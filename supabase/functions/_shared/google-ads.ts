// Helper para invocar a edge function google-ads-conversion a partir de outros webhooks.

export interface GoogleAdsConversionInput {
  order_id: string;
  value: number;
  currency?: string;
  email?: string | null;
  phone?: string | null;
  gclid?: string | null;
  approved_at?: string | null;
}

export async function sendGoogleAdsConversion(input: GoogleAdsConversionInput): Promise<void> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.warn("[google-ads] SUPABASE_URL/SERVICE_ROLE ausentes");
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/google-ads-conversion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE}`,
        "apikey": SERVICE_ROLE,
      },
      body: JSON.stringify({
        order_id: input.order_id,
        value: input.value,
        currency: input.currency || "BRL",
        email: input.email || undefined,
        phone: input.phone || undefined,
        gclid: input.gclid || undefined,
        approved_at: input.approved_at || undefined,
      }),
    });
    const txt = await res.text();
    console.log(`[google-ads] status=${res.status} body=${txt.slice(0, 500)}`);
  } catch (err) {
    console.error("[google-ads] fetch error:", err);
  }
}