/**
 * Meta (Facebook) Pixel helper
 * Pixel ID: 1452547236480808
 */

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

const PIXEL_ID = "1452547236480808";

let initialized = false;

export function initMetaPixel() {
  if (initialized || typeof window === "undefined") return;

  // Facebook Pixel base code
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
  initialized = true;
}

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
}

/**
 * InitiateCheckout — fired when user lands on checkout
 */
export function trackInitiateCheckout(params: {
  content_ids: string[];
  contents: Array<{ id: string; quantity: number; item_price: number }>;
  content_type: string;
  currency: string;
  num_items: number;
  value: number;
}) {
  fbq("track", "InitiateCheckout", {
    content_ids: params.content_ids,
    contents: params.contents,
    content_type: params.content_type,
    currency: params.currency,
    num_items: params.num_items,
    value: params.value,
  });
}

/**
 * AddPaymentInfo — fired when user selects payment method
 */
export function trackAddPaymentInfo(params: {
  content_ids: string[];
  contents: Array<{ id: string; quantity: number; item_price: number }>;
  content_type: string;
  currency: string;
  value: number;
  payment_method: string;
}) {
  fbq("track", "AddPaymentInfo", {
    content_ids: params.content_ids,
    contents: params.contents,
    content_type: params.content_type,
    currency: params.currency,
    value: params.value,
    // Custom param
    payment_method: params.payment_method,
  });
}

/**
 * Purchase — fired when payment is confirmed/approved
 */
export function trackPurchase(params: {
  content_ids: string[];
  contents: Array<{ id: string; quantity: number; item_price: number }>;
  content_type: string;
  currency: string;
  num_items: number;
  value: number;
  order_id?: string;
  payment_method?: string;
}) {
  fbq("track", "Purchase", {
    content_ids: params.content_ids,
    contents: params.contents,
    content_type: params.content_type,
    currency: params.currency,
    num_items: params.num_items,
    value: params.value,
    order_id: params.order_id,
    payment_method: params.payment_method,
  });
}
