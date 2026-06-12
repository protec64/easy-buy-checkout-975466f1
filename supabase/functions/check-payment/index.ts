// Consulta o status real da transação na FreePay e, se paga, dispara o mesmo
// fluxo de aprovação do webhook (UTMify "paid" + Meta CAPI + order_number).

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

    const FREEPAY_PUBLIC_KEY = Deno.env.get("FREEPAY_PUBLIC_KEY");
    const FREEPAY_SECRET_KEY = Deno.env.get("FREEPAY_SECRET_KEY");
    if (!FREEPAY_PUBLIC_KEY || !FREEPAY_SECRET_KEY) {
      throw new Error("FreePay credentials not configured");
    }

    const authToken = btoa(`${FREEPAY_PUBLIC_KEY}:${FREEPAY_SECRET_KEY}`);
    const res = await fetch(
      `https://api.freepaybrasil.com/v1/payment-transaction/info/${payment_id}`,
      { headers: { Authorization: `Basic ${authToken}` } }
    );
    const data = await res.json();

    if (!res.ok) {
      console.error("FreePay info error:", JSON.stringify(data));
      return new Response(JSON.stringify({ status: "pending" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fp = data.data || data;
    const rawStatus = String(fp.status || "").toLowerCase();
    console.log(`check-payment ${payment_id}: freepay status=${rawStatus}`);

    let status = "pending";
    if (rawStatus === "paid" || rawStatus === "approved") status = "approved";
    else if (["refused", "failed", "declined"].includes(rawStatus)) status = "refused";
    else if (["refunded", "chargedback"].includes(rawStatus)) status = "refunded";

    // Encaminha para o webhook interno para processar aprovação (UTMify + CAPI)
    if (status !== "pending") {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      try {
        const whRes = await fetch(`${SUPABASE_URL}/functions/v1/freepay-webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: String(payment_id), status: rawStatus }),
        });
        console.log("forwarded to webhook:", whRes.status, await whRes.text());
      } catch (e) {
        console.error("forward to webhook failed:", e);
      }
    }

    return new Response(JSON.stringify({ status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("check-payment error:", message);
    return new Response(JSON.stringify({ status: "pending", error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
