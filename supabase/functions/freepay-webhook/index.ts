import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log("FreePay webhook received:", JSON.stringify(body));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const paymentId = String(body.id || body.transaction_id || "");
    const status = body.status || body.current_status || "";

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

    const { error } = await supabase
      .from("orders")
      .update({
        mp_status: status,
        payment_status: paymentStatus,
      })
      .eq("mp_payment_id", paymentId);

    if (error) {
      console.error("Error updating order:", error);
      throw new Error("Failed to update order: " + error.message);
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
