// Envia conversão de compra para o Google Ads via Enhanced Conversions API.
// Chamado pelos webhooks quando payment_status = approved.
//
// Secrets necessários (Deno.env):
//   GOOGLE_ADS_DEVELOPER_TOKEN         — Developer token do Google Ads API Center
//   GOOGLE_ADS_OAUTH_CLIENT_ID         — OAuth2 client ID (Google Cloud Console)
//   GOOGLE_ADS_OAUTH_CLIENT_SECRET     — OAuth2 client secret
//   GOOGLE_ADS_REFRESH_TOKEN           — Refresh token gerado 1x com escopo adwords
//   GOOGLE_ADS_CUSTOMER_ID             — ID da conta Google Ads (só dígitos, sem hífens)
//   GOOGLE_ADS_CONVERSION_ACTION_ID    — ID numérico da conversion action de "Compra"
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID       — (opcional) MCC ID se a conta é gerenciada
//
// Enquanto os secrets não estiverem configurados a função retorna { skipped: true }.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhoneE164BR(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

/** Formata YYYY-MM-DD HH:MM:SS±HH:MM em America/Sao_Paulo (Google Ads exige TZ). */
function conversionDateTime(date: Date): string {
  const brOffsetMin = -180; // BRT -03:00
  const local = new Date(date.getTime() + brOffsetMin * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = local.getUTCFullYear();
  const mo = pad(local.getUTCMonth() + 1);
  const d = pad(local.getUTCDate());
  const h = pad(local.getUTCHours());
  const mi = pad(local.getUTCMinutes());
  const s = pad(local.getUTCSeconds());
  return `${y}-${mo}-${d} ${h}:${mi}:${s}-03:00`;
}

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`OAuth token error [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

interface Payload {
  order_id: string;              // usado como orderId (dedup)
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  gclid?: string | null;
  approved_at?: string;          // ISO; default now
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const DEV_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    const CLIENT_ID = Deno.env.get("GOOGLE_ADS_OAUTH_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GOOGLE_ADS_OAUTH_CLIENT_SECRET");
    const REFRESH_TOKEN = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
    const CUSTOMER_ID = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
    const CONVERSION_ACTION_ID = Deno.env.get("GOOGLE_ADS_CONVERSION_ACTION_ID");
    const LOGIN_CUSTOMER_ID = Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID");

    if (!DEV_TOKEN || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !CUSTOMER_ID || !CONVERSION_ACTION_ID) {
      console.warn("[google-ads-conversion] secrets ausentes — skipping");
      return new Response(
        JSON.stringify({ skipped: true, reason: "secrets_not_configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Payload;
    if (!body?.order_id || typeof body.value !== "number") {
      return new Response(JSON.stringify({ error: "order_id and value are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIdentifiers: Array<Record<string, string>> = [];
    if (body.email) userIdentifiers.push({ hashedEmail: await sha256(body.email) });
    if (body.phone) {
      const e164 = normalizePhoneE164BR(body.phone);
      if (e164) userIdentifiers.push({ hashedPhoneNumber: await sha256(e164) });
    }

    const conversion: Record<string, unknown> = {
      conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
      conversionDateTime: conversionDateTime(body.approved_at ? new Date(body.approved_at) : new Date()),
      conversionValue: body.value,
      currencyCode: body.currency || "BRL",
      orderId: body.order_id, // dedup no Google Ads
    };
    if (body.gclid) conversion.gclid = body.gclid;
    if (userIdentifiers.length > 0) conversion.userIdentifiers = userIdentifiers;
    // Enhanced Conversions for Web quando não há gclid
    if (!body.gclid && userIdentifiers.length > 0) {
      conversion.conversionEnvironment = "WEB";
    }

    const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN);

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "developer-token": DEV_TOKEN,
      "Content-Type": "application/json",
    };
    if (LOGIN_CUSTOMER_ID) headers["login-customer-id"] = LOGIN_CUSTOMER_ID;

    const url = `https://googleads.googleapis.com/v18/customers/${CUSTOMER_ID}:uploadClickConversions`;
    const payload = {
      conversions: [conversion],
      partialFailure: true,
      validateOnly: false,
    };

    console.log("[google-ads-conversion] request:", JSON.stringify(payload));

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error(`[google-ads-conversion] api error [${res.status}]:`, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "google_ads_api_error", status: res.status, details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // partial_failure_error dentro de 200 OK
    if (data.partialFailureError) {
      console.error("[google-ads-conversion] partial failure:", JSON.stringify(data.partialFailureError));
    }

    console.log("[google-ads-conversion] ok:", JSON.stringify(data));
    return new Response(JSON.stringify({ success: true, response: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[google-ads-conversion] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});