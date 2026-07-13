import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendUtmifyOrder } from "../_shared/utmify.ts";
import { sendWirePusher } from "../_shared/wirepusher.ts";
import { buildOrderEmail, sendOrderEmailViaGmail, shouldSendOrderEmail } from "../_shared/order-email.ts";
import { sendGoogleAdsConversion } from "../_shared/google-ads.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("SkalePay webhook received:", JSON.stringify(body));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const paymentId = String(body.Id || body.id || body.transaction_id || "");
    const rawStatus = body.Status || body.status || body.current_status || "";
    const status = rawStatus.toLowerCase();

    if (!paymentId) {
      throw new Error("No payment ID in webhook payload");
    }

    // Map SkalePay status to our status
    let paymentStatus = "pending";
    if (status === "paid" || status === "approved") {
      paymentStatus = "approved";
    } else if (status === "refused" || status === "failed" || status === "declined" || status === "cancelled") {
      paymentStatus = "refused";
    } else if (status === "refunded" || status === "chargedback") {
      paymentStatus = "refunded";
    }

    console.log(`Payment ${paymentId}: raw=${rawStatus}, mapped=${paymentStatus}`);

    // Idempotência: se o pedido já está nesse status, não reprocessa
    const { data: existing } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("mp_payment_id", paymentId)
      .single();

    if (existing && existing.payment_status === paymentStatus) {
      console.log(`Order already in status ${paymentStatus}, skipping`);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate order number only when approved
    const updateData: Record<string, any> = {
      mp_status: status,
      payment_status: paymentStatus,
    };

    if (paymentStatus === "approved") {
      const now = new Date();
      const seq = now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0");
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      updateData.order_number = `PED-${seq}-${rand}`;
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("mp_payment_id", paymentId);

    if (error) {
      console.error("Error updating order:", error);
      throw new Error("Failed to update order: " + error.message);
    }

    // Busca pedido + itens para UTMify
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("mp_payment_id", paymentId)
      .single();

    const { data: orderItems } = order
      ? await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id)
      : { data: [] as any[] };

    if (paymentStatus === "approved" && order) {
      // Google Ads server-side conversion
      await sendGoogleAdsConversion({
        order_id: order.order_number || order.mp_payment_id || order.id,
        value: Number(order.total),
        currency: "BRL",
        email: order.email,
        phone: order.phone,
        gclid: order.gclid || null,
        approved_at: new Date().toISOString(),
      });

      // Notificação push de venda aprovada (WirePusher)
      await sendWirePusher({
        title: "✅ Venda aprovada!",
        message:
          `Pedido ${order.order_number || paymentId} | ` +
          `R$ ${Number(order.total).toFixed(2)} | ` +
          `Cliente: ${order.full_name || "-"} | ` +
          `Pagamento confirmado (PIX)`,
      });

      // E-mail automático via Gmail (Google Workspace)
      try {
        const productIds = (orderItems || []).map((it: any) => it.product_id);
        if (order.email && shouldSendOrderEmail(productIds)) {
          const { subject, body: emailBody } = buildOrderEmail(order, productIds);
          await sendOrderEmailViaGmail({ to: order.email, subject, body: emailBody });
        }
      } catch (e) {
        console.warn("order email send failed", e);
      }
    }

    // Envia status para a UTMify (paid / refused / refunded)
    if (order && (paymentStatus === "approved" || paymentStatus === "refused" || paymentStatus === "refunded")) {
      const utmStatus =
        paymentStatus === "approved" ? "paid" :
        paymentStatus === "refused" ? "refused" : "refunded";

      const totalCents = Math.round(Number(order.total) * 100);
      await sendUtmifyOrder({
        orderId: paymentId,
        status: utmStatus,
        paymentMethod: "pix",
        createdAt: new Date(order.created_at),
        approvedAt: paymentStatus === "approved" ? new Date() : null,
        refundedAt: paymentStatus === "refunded" ? new Date() : null,
        customer: {
          name: order.full_name,
          email: order.email,
          phone: order.phone || null,
          document: order.cpf,
        },
        products: (orderItems || []).map((it: any) => ({
          id: it.product_id,
          name: it.product_name,
          quantity: it.quantity,
          priceInCents: Math.round(Number(it.unit_price) * 100),
        })),
        totalInCents: totalCents,
        tracking: {
          utm_source: order.utm_source,
          utm_medium: order.utm_medium,
          utm_campaign: order.utm_campaign,
          utm_content: order.utm_content,
          utm_term: order.utm_term,
          src: order.utm_src,
          sck: order.utm_sck,
        },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
