const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIXEL_ID = "1556662072725633";

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
  event_id?: string;
  user_data: {
    email?: string;
    phone?: string;
    cpf?: string;
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
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
    content_name?: string;
    content_category?: string;
    num_items?: number;
    order_id?: string;
    payment_method?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const META_TOKEN = Deno.env.get("META_CONVERSIONS_API_TOKEN");
    if (!META_TOKEN) {
      // Token not configured — skip silently so the frontend doesn't error
      return new Response(JSON.stringify({ skipped: true, reason: "token_not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CAPIPayload = await req.json();

    // Get client IP from request headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "";

    // Build user_data with hashed PII per Meta docs
    const userData: Record<string, any> = {};

    // em - Email (hash required)
    if (body.user_data.email) {
      userData.em = await sha256(body.user_data.email);
    }

    // ph - Phone (hash required, include country code)
    if (body.user_data.phone) {
      let phone = body.user_data.phone.replace(/\D/g, "");
      if (!phone.startsWith("55")) phone = "55" + phone;
      userData.ph = await sha256(phone);
    }

    // fn - First Name (hash required)
    if (body.user_data.first_name) {
      userData.fn = await sha256(body.user_data.first_name);
    }

    // ln - Last Name (hash required)
    if (body.user_data.last_name) {
      userData.ln = await sha256(body.user_data.last_name);
    }

    // ct - City (hash required, no spaces, lowercase)
    if (body.user_data.city) {
      userData.ct = await sha256(body.user_data.city.replace(/\s/g, ""));
    }

    // st - State (hash required, 2-char lowercase)
    if (body.user_data.state) {
      userData.st = await sha256(body.user_data.state.toLowerCase().slice(0, 2));
    }

    // zp - Zip/CEP (hash required, digits only)
    if (body.user_data.zip_code) {
      userData.zp = await sha256(body.user_data.zip_code.replace(/\D/g, ""));
    }

    // country - Country code (hash required)
    if (body.user_data.country) {
      userData.country = await sha256(body.user_data.country.toLowerCase());
    }

    // external_id - CPF as unique identifier (hash recommended)
    if (body.user_data.cpf) {
      const cleanCpf = body.user_data.cpf.replace(/\D/g, "");
      userData.external_id = await sha256(cleanCpf);
    }

    // client_ip_address - Do NOT hash
    if (clientIp) {
      userData.client_ip_address = clientIp;
    } else if (body.user_data.client_ip_address) {
      userData.client_ip_address = body.user_data.client_ip_address;
    }

    // client_user_agent - Do NOT hash
    if (body.user_data.client_user_agent) {
      userData.client_user_agent = body.user_data.client_user_agent;
    }

    // fbc - Click ID cookie - Do NOT hash
    if (body.user_data.fbc) {
      userData.fbc = body.user_data.fbc;
    }

    // fbp - Browser ID cookie - Do NOT hash
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
      event.custom_data = { ...body.custom_data };
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
      throw new Error(
        `Meta CAPI error [${metaRes.status}]: ${JSON.stringify(metaData)}`
      );
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
