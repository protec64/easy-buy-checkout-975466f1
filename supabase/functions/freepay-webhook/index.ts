import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

/** Send Purchase event to Meta CAPI */
async function sendPurchaseCAPI(order: any, orderItems: any[]) {
  const META_TOKEN = Deno.env.get("META_CONVERSIONS_API_TOKEN");
  if (!META_TOKEN) {
    console.warn("META_CONVERSIONS_API_TOKEN not configured, skipping CAPI");
    return;
  }

  const PIXEL_ID = "1452547236480808";

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

  const contents = orderItems.map((item: any) => ({
    id: item.product_id,
    quantity: item.quantity,
    item_price: item.unit_price,
  }));

  const event = {
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
    console.log("FreePay webhook received:", JSON.stringify(body));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const paymentId = String(body.Id || body.id || body.transaction_id || "");
    const rawStatus = body.Status || body.status || body.current_status || "";
    const status = rawStatus.toLowerCase();

    if (!paymentId) {
      throw new Error("No payment ID in webhook payload");
    }

    // Map FreePay status to our status
    let paymentStatus = "pending";
    if (status === "paid" || status === "approved") {
      paymentStatus = "approved";
    } else if (status === "refused" || status === "failed" || status === "declined") {
      paymentStatus = "refused";
    } else if (status === "refunded" || status === "chargedback") {
      paymentStatus = "refunded";
    }

    console.log(`Payment ${paymentId}: raw=${rawStatus}, mapped=${paymentStatus}`);

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

    // Fire Meta CAPI Purchase event only when payment is approved
    if (paymentStatus === "approved") {
      // Fetch order + items for CAPI data
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("mp_payment_id", paymentId)
        .single();

      if (order) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);

        await sendPurchaseCAPI(order, orderItems || []);
      }
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
