import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendUtmifyOrder } from "../_shared/utmify.ts";
import { sendWirePusher } from "../_shared/wirepusher.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Hash a value with SHA-256 (Meta requires lowercase hex)
 */
async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Send Purchase event to Meta CAPI with dedup event_id */
async function sendPurchaseCAPI(order: any, orderItems: any[]) {
  const META_TOKEN = Deno.env.get("META_CONVERSIONS_API_TOKEN");
  if (!META_TOKEN) {
    console.warn("META_CONVERSIONS_API_TOKEN not configured, skipping CAPI");
    return;
  }

  const PIXEL_ID = "1687575215693095";

  const userData: Record<string, any> = {};

  if (order.email) userData.em = await sha256(order.email);
  if (order.phone) {
    let phone = order.phone.replace(/\D/g, "");
    if (!phone.startsWith("55")) phone = "55" + phone;
    userData.ph = await sha256(phone);
  }
  if (order.cpf) {
    const cleanCpf = order.cpf.replace(/\D/g, "");
    userData.external_id = await sha256(cleanCpf);
  }
  if (order.full_name) {
    const parts = order.full_name.trim().split(/\s+/);
    userData.fn = await sha256(parts[0]);
    if (parts.length > 1) userData.ln = await sha256(parts.slice(1).join(" "));
  }
  if (order.city) userData.ct = await sha256(order.city.replace(/\s/g, ""));
  if (order.state) userData.st = await sha256(order.state.toLowerCase().slice(0, 2));
  if (order.cep) userData.zp = await sha256(order.cep.replace(/\D/g, ""));
  userData.country = await sha256("br");

  // Include fbp/fbc for better matching (NOT hashed per Meta docs)
  if (order.fbp) userData.fbp = order.fbp;
  if (order.fbc) userData.fbc = order.fbc;

  const contents = orderItems.map((item: any) => ({
    id: item.product_id,
    quantity: item.quantity,
    item_price: item.unit_price,
  }));

  const event: Record<string, any> = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: order.total,
      currency: "BRL",
      content_ids: orderItems.map((item: any) => item.product_id),
      contents,
      content_type: "product",
      num_items: orderItems.reduce((s: number, i: any) => s + i.quantity, 0),
      order_id: order.mp_payment_id,
      payment_method: order.payment_method,
    },
  };

  // Use stored event_id for browser↔server deduplication
  if (order.event_id) {
    event.event_id = order.event_id;
  }

  const payload = { data: [event] };
  console.log("CAPI Purchase event:", JSON.stringify(payload));

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${META_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    console.log("CAPI Purchase response:", JSON.stringify(data));
  } catch (err) {
    console.error("CAPI Purchase error:", err);
  }
}

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

    // Busca pedido + itens para CAPI e UTMify
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
      await sendPurchaseCAPI(order, orderItems || []);

      // Notificação push de venda aprovada (WirePusher)
      await sendWirePusher({
        title: "✅ Venda aprovada!",
        message:
          `Pedido ${order.order_number || paymentId} | ` +
          `R$ ${Number(order.total).toFixed(2)} | ` +
          `Cliente: ${order.full_name || "-"} | ` +
          `Pagamento confirmado (PIX)`,
      });
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
