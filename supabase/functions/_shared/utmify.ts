// Envio de eventos para a UTMify (https://docs.utmify.com.br)

const UTMIFY_URL = "https://api.utmify.com.br/api-credentials/orders";

type Status = "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";

function fmtUtmifyDate(d: Date): string {
  // UTMify exige "YYYY-MM-DD HH:MM:SS" em UTC
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    "-" + pad(d.getUTCMonth() + 1) +
    "-" + pad(d.getUTCDate()) +
    " " + pad(d.getUTCHours()) +
    ":" + pad(d.getUTCMinutes()) +
    ":" + pad(d.getUTCSeconds())
  );
}

export interface UtmifyPayloadInput {
  orderId: string;
  status: Status;
  paymentMethod?: "pix" | "credit_card" | "boleto";
  createdAt: Date;
  approvedAt?: Date | null;
  refundedAt?: Date | null;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    document: string;
    ip?: string | null;
  };
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    priceInCents: number;
  }>;
  totalInCents: number;
  tracking?: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
    src?: string | null;
    sck?: string | null;
  } | null;
}

export async function sendUtmifyOrder(input: UtmifyPayloadInput): Promise<void> {
  const token = Deno.env.get("UTMIFY_API_TOKEN");
  if (!token) {
    console.warn("UTMIFY_API_TOKEN not configured, skipping UTMify");
    return;
  }

  const t = input.tracking || {};
  const body = {
    orderId: input.orderId,
    platform: "ExpressBuyPro",
    paymentMethod: input.paymentMethod || "pix",
    status: input.status,
    createdAt: fmtUtmifyDate(input.createdAt),
    approvedDate: input.approvedAt ? fmtUtmifyDate(input.approvedAt) : null,
    refundedAt: input.refundedAt ? fmtUtmifyDate(input.refundedAt) : null,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone || null,
      document: input.customer.document.replace(/\D/g, ""),
      country: "BR",
      ip: input.customer.ip && input.customer.ip.length > 0 ? input.customer.ip : "0.0.0.0",
    },
    products: input.products.map((p) => ({
      id: p.id,
      name: p.name,
      planId: null,
      planName: null,
      quantity: p.quantity,
      priceInCents: p.priceInCents,
    })),
    trackingParameters: {
      src: t.src || null,
      sck: t.sck || null,
      utm_source: t.utm_source || null,
      utm_campaign: t.utm_campaign || null,
      utm_medium: t.utm_medium || null,
      utm_content: t.utm_content || null,
      utm_term: t.utm_term || null,
    },
    commission: {
      totalPriceInCents: input.totalInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: input.totalInCents,
    },
    isTest: false,
  };

  try {
    console.log("UTMify request:", JSON.stringify(body));
    const res = await fetch(UTMIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log(`UTMify response [${res.status}]:`, text);
  } catch (err) {
    console.error("UTMify error:", err);
  }
}
