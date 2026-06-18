import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendUtmifyOrder } from "../_shared/utmify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Generate a unique event_id for Meta Pixel/CAPI deduplication */
function generateEventId(): string {
  return `${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SKALEPAY_API_KEY = Deno.env.get("SKALEPAY_API_KEY");

    if (!SKALEPAY_API_KEY) {
      throw new Error("SkalePay credentials not configured");
    }

    const body = await req.json();
    const { customer, shipping_address, order, tracking } = body;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate event_id for Purchase dedup (browser pixel + server CAPI)
    const eventId = generateEventId();

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
        event_id: eventId,
        utm_source: tracking?.utm_source || null,
        utm_medium: tracking?.utm_medium || null,
        utm_campaign: tracking?.utm_campaign || null,
        utm_content: tracking?.utm_content || null,
        utm_term: tracking?.utm_term || null,
        utm_src: tracking?.src || null,
        utm_sck: tracking?.sck || null,
        fbclid: tracking?.fbclid || null,
        fbp: tracking?.fbp || null,
        fbc: tracking?.fbc || null,
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

    // Build SkalePay payload
    const amountInCents = Math.round(order.total * 100);
    const cleanCpf = customer.cpf.replace(/\D/g, "");

    const skalePayload = {
      amount: amountInCents,
      paymentMethod: "pix",
      postbackUrl: `${SUPABASE_URL}/functions/v1/skalepay-webhook`,
      customer: {
        name: customer.full_name,
        email: customer.email,
        phone: customer.phone ? customer.phone.replace(/\D/g, "") : "00000000000",
        document: {
          type: cleanCpf.length <= 11 ? "cpf" : "cnpj",
          number: cleanCpf,
        },
      },
      items: order.items.map((item: any) => ({
        title: item.name,
        unitPrice: Math.round(item.price * 100),
        quantity: item.qty,
        tangible: true,
        externalRef: String(item.id),
      })),
      pix: {
        expiresInDays: 1,
      },
      metadata: {
        provider_name: "Lovable Checkout",
        order_id: orderData.id,
        order_number: orderData.order_number,
      },
    };

    console.log("SkalePay request:", JSON.stringify(skalePayload));

    const freepayRes = await fetch(
      "https://api.skalepayments.com.br/transactions",
      {
        method: "POST",
        headers: {
          "X-API-Key": SKALEPAY_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(skalePayload),
      }
    );

    const freepayData = await freepayRes.json();

    if (!freepayRes.ok) {
      console.error("SkalePay error:", JSON.stringify(freepayData));
      throw new Error(
        `SkalePay API error [${freepayRes.status}]: ${JSON.stringify(freepayData)}`
      );
    }

    console.log("SkalePay response:", JSON.stringify(freepayData));

    // Update order with SkalePay payment info
    const fpData = freepayData.data || freepayData;
    const pixCode = fpData.pix?.qrcode || fpData.pix?.qr_code || "";
    const pixCopiaECola = fpData.pix?.qrcode || fpData.pix?.qr_code || "";
    const paymentId = fpData.id || fpData.transaction_id || "";
    const expiresAt = fpData.pix?.expirationDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();


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

    // Envia para a UTMify como "waiting_payment"
    await sendUtmifyOrder({
      orderId: String(paymentId),
      status: "waiting_payment",
      paymentMethod: "pix",
      createdAt: new Date(),
      customer: {
        name: customer.full_name,
        email: customer.email,
        phone: customer.phone || null,
        document: customer.cpf,
        ip: clientIp,
      },
      products: order.items.map((it: any) => ({
        id: it.id,
        name: it.name,
        quantity: it.qty,
        priceInCents: Math.round(it.price * 100),
      })),
      totalInCents: amountInCents,
      tracking: tracking || null,
    });

    return new Response(
      JSON.stringify({
        payment_id: String(paymentId),
        qr_code_base64: pixCode,
        copia_e_cola: pixCopiaECola,
        expires_at: expiresAt,
        status: "pending",
        order_id: orderData.id,
        order_number: orderData.order_number,
        event_id: eventId,
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
