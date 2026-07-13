declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const CONVERSION_ID = "AW-18320168920";
const PURCHASE_LABEL = "SFozCNXiv88cENiv3p9E";

/**
 * Dispara conversão de compra no Google Ads.
 * transaction_id garante deduplicação no Google Ads.
 */
export function trackGoogleAdsPurchase(params: {
  value: number;
  transaction_id: string;
  currency?: string;
  items?: Array<{ quantity: number; unit_price: number }>;
}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    console.warn("[GoogleAds] gtag não carregado");
    return;
  }
  // Nomes genéricos Produto1, Produto2, Produto3 — nunca o nome real
  const items = (params.items && params.items.length > 0
    ? params.items
    : [{ quantity: 1, unit_price: params.value }]
  ).slice(0, 3).map((it, idx) => ({
    id: `Produto${idx + 1}`,
    google_business_vertical: "retail",
    quantity: it.quantity,
    price: it.unit_price,
  }));
  window.gtag("event", "conversion", {
    send_to: `${CONVERSION_ID}/${PURCHASE_LABEL}`,
    value: params.value,
    currency: params.currency || "BRL",
    transaction_id: params.transaction_id,
    items,
  });
  console.log("[GoogleAds] conversion enviado", params);
}

export {};