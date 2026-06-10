import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendUtmifyOrder } from "../_shared/utmify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { payment_id } = await req.json();
    if (!payment_id) throw new Error("payment_id required");

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("mp_payment_id", String(payment_id))
      .single();

    if (!order) throw new Error("order not found");

    // If already approved, send UTMify again is fine (idempotent on their side)
    let orderNumber = order.order_number;
    if (order.payment_status !== "approved") {
      const now = new Date();
      const seq =
        now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0");
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      orderNumber = `PED-${seq}-${rand}`;

      await supabase
        .from("orders")
        .update({
          payment_status: "approved",
          mp_status: "paid",
          order_number: orderNumber,
        })
        .eq("id", order.id);
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const totalCents = Math.round(Number(order.total) * 100);

    await sendUtmifyOrder({
      orderId: String(payment_id),
      status: "paid",
      paymentMethod: "pix",
      createdAt: new Date(order.created_at),
      approvedAt: new Date(),
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

    return new Response(
      JSON.stringify({ ok: true, order_number: orderNumber }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("approve-by-proof error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
