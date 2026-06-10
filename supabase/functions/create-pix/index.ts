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
    const FREEPAY_PUBLIC_KEY = Deno.env.get("FREEPAY_PUBLIC_KEY");
    const FREEPAY_SECRET_KEY = Deno.env.get("FREEPAY_SECRET_KEY");

    if (!FREEPAY_PUBLIC_KEY || !FREEPAY_SECRET_KEY) {
      throw new Error("FreePay credentials not configured");
    }

    const body = await req.json();
    const { customer, shipping_address, order, tracking } = body;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create order in database first
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        email: customer.email,
        full_name: customer.full_name,
        cpf: customer.cpf,
        phone: customer.phone || null,
        cep: shipping_address.cep,
        street: shipping_address.street,
        address_number: shipping_address.number,
        complement: shipping_address.complement || null,
        neighborhood: shipping_address.neighborhood,
        city: shipping_address.city,
        state: shipping_address.state,
        reference: shipping_address.reference || null,
        payment_method: "pix",
        subtotal: order.total - order.shipping_cost + order.discount,
        shipping_cost: order.shipping_cost,
        discount: order.discount,
        total: order.total,
        payment_status: "pending",
        utm_source: tracking?.utm_source || null,
        utm_medium: tracking?.utm_medium || null,
        utm_campaign: tracking?.utm_campaign || null,
        utm_content: tracking?.utm_content || null,
        utm_term: tracking?.utm_term || null,
        utm_src: tracking?.src || null,
        utm_sck: tracking?.sck || null,
      })
      .select("id, order_number")
      .single();

    if (orderError) {
      throw new Error("Failed to create order: " + orderError.message);
    }

    // Insert order items
    const itemInserts = order.items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.qty,
      unit_price: item.price,
      variation: item.variation || null,
    }));

    await supabase.from("order_items").insert(itemInserts);

    // Build FreePay payload
    const amountInCents = Math.round(order.total * 100);
    const cleanCpf = customer.cpf.replace(/\D/g, "");
    const authToken = btoa(`${FREEPAY_PUBLIC_KEY}:${FREEPAY_SECRET_KEY}`);

    const freepayPayload = {
      amount: amountInCents,
      payment_method: "pix",
      postback_url: `${SUPABASE_URL}/functions/v1/freepay-webhook`,
      customer: {
        name: customer.full_name,
        email: customer.email,
        document: {
          type: cleanCpf.length <= 11 ? "cpf" : "cnpj",
          number: cleanCpf,
        },
        phone: customer.phone ? customer.phone.replace(/\D/g, "") : "00000000000",
      },
      items: order.items.map((item: any) => ({
        title: item.name,
        quantity: item.qty,
        unit_price: Math.round(item.price * 100),
        tangible: true,
      })),
      pix: {
        expires_in: 900,
      },
      metadata: {
        provider_name: "Lovable Checkout",
        order_id: orderData.id,
        order_number: orderData.order_number,
      },
    };

    console.log("FreePay request:", JSON.stringify(freepayPayload));

    const freepayRes = await fetch(
      "https://api.freepaybrasil.com/v1/payment-transaction/create",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(freepayPayload),
      }
    );

    const freepayData = await freepayRes.json();

    if (!freepayRes.ok) {
      console.error("FreePay error:", JSON.stringify(freepayData));
      throw new Error(
        `FreePay API error [${freepayRes.status}]: ${JSON.stringify(freepayData)}`
      );
    }

    console.log("FreePay response:", JSON.stringify(freepayData));

    // Update order with FreePay payment info
    const fpData = freepayData.data || freepayData;
    const pixCode = fpData.pix?.qr_code || fpData.qr_code || "";
    const pixCopiaECola = fpData.pix?.qr_code || fpData.pix?.qr_code_url || fpData.pix?.copy_paste || "";
    const paymentId = fpData.id || fpData.transaction_id || "";
    const expiresAt = fpData.pix?.expiration_date || new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase
      .from("orders")
      .update({
        mp_payment_id: String(paymentId),
        mp_qr_code: pixCode,
        mp_copia_e_cola: pixCopiaECola,
        mp_expires_at: expiresAt,
        mp_status: "pending",
        payment_id: String(paymentId),
      })
      .eq("id", orderData.id);

    return new Response(
      JSON.stringify({
        payment_id: String(paymentId),
        qr_code_base64: pixCode,
        copia_e_cola: pixCopiaECola,
        expires_at: expiresAt,
        status: "pending",
        order_id: orderData.id,
        order_number: orderData.order_number,
        freepay_raw: freepayData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error creating PIX payment:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
