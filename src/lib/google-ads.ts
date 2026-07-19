declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const CONVERSION_ID = "AW-18080913516";
const PURCHASE_LABEL = "U7akCPD5-64cEOyw061D";

/**
 * Dispara conversão de compra no Google Ads.
 * transaction_id garante deduplicação no Google Ads.
 */
export function trackGoogleAdsPurchase(params: {
  value: number;
  transaction_id: string;
  currency?: string;
}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    console.warn("[GoogleAds] gtag não carregado");
    return;
  }
  window.gtag("event", "conversion", {
    send_to: `${CONVERSION_ID}/${PURCHASE_LABEL}`,
    value: params.value,
    currency: params.currency || "BRL",
    transaction_id: params.transaction_id,
  });
  console.log("[GoogleAds] conversion enviado", params);
}

export {};