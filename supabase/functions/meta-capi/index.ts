import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIXEL_ID = "1452547236480808";

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

interface CAPIPayload {
  event_name: string;
  event_time?: number;
  event_source_url?: string;
  action_source: string;
  user_data: {
    email?: string;
    phone?: string;
    cpf?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    contents?: Array<{ id: string; quantity: number; item_price: number }>;
    content_type?: string;
    num_items?: number;
    order_id?: string;
    payment_method?: string;
  };
  event_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const META_TOKEN = Deno.env.get("META_CONVERSIONS_API_TOKEN");
    if (!META_TOKEN) {
      throw new Error("META_CONVERSIONS_API_TOKEN not configured");
    }

    const body: CAPIPayload = await req.json();

    // Build user_data with hashed PII
    const userData: Record<string, string> = {};

    if (body.user_data.email) {
      userData.em = await sha256(body.user_data.email);
    }
    if (body.user_data.phone) {
      // Remove non-digits, add country code if missing
      let phone = body.user_data.phone.replace(/\D/g, "");
      if (!phone.startsWith("55")) phone = "55" + phone;
      userData.ph = await sha256(phone);
    }
    if (body.user_data.cpf) {
      // Hash CPF as external_id
      const cleanCpf = body.user_data.cpf.replace(/\D/g, "");
      userData.external_id = await sha256(cleanCpf);
    }
    if (body.user_data.client_ip_address) {
      userData.client_ip_address = body.user_data.client_ip_address;
    }
    if (body.user_data.client_user_agent) {
      userData.client_user_agent = body.user_data.client_user_agent;
    }
    if (body.user_data.fbc) {
      userData.fbc = body.user_data.fbc;
    }
    if (body.user_data.fbp) {
      userData.fbp = body.user_data.fbp;
    }

    // Build the event
    const event: Record<string, any> = {
      event_name: body.event_name,
      event_time: body.event_time || Math.floor(Date.now() / 1000),
      action_source: body.action_source || "website",
      user_data: userData,
    };

    if (body.event_source_url) {
      event.event_source_url = body.event_source_url;
    }

    if (body.event_id) {
      event.event_id = body.event_id;
    }

    if (body.custom_data) {
      event.custom_data = {};
      if (body.custom_data.value !== undefined) event.custom_data.value = body.custom_data.value;
      if (body.custom_data.currency) event.custom_data.currency = body.custom_data.currency;
      if (body.custom_data.content_ids) event.custom_data.content_ids = body.custom_data.content_ids;
      if (body.custom_data.contents) event.custom_data.contents = body.custom_data.contents;
      if (body.custom_data.content_type) event.custom_data.content_type = body.custom_data.content_type;
      if (body.custom_data.num_items !== undefined) event.custom_data.num_items = body.custom_data.num_items;
      if (body.custom_data.order_id) event.custom_data.order_id = body.custom_data.order_id;
      if (body.custom_data.payment_method) event.custom_data.payment_method = body.custom_data.payment_method;
    }

    const metaPayload = {
      data: [event],
    };

    console.log("Meta CAPI request:", JSON.stringify(metaPayload));

    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${META_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error("Meta CAPI error:", JSON.stringify(metaData));
      throw new Error(`Meta CAPI error [${metaRes.status}]: ${JSON.stringify(metaData)}`);
    }

    console.log("Meta CAPI response:", JSON.stringify(metaData));

    return new Response(
      JSON.stringify({ success: true, meta_response: metaData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending Meta CAPI event:", error);
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
