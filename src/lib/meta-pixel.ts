/**
 * Meta (Facebook) Pixel + Conversions API (CAPI) helper
 * Pixel ID: 1452547236480808
 */

import { supabase } from "@/integrations/supabase/client";

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

/** Get _fbp and _fbc cookies for deduplication */
function getMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const cookies = document.cookie.split(";").reduce((acc, c) => {
    const [k, v] = c.trim().split("=");
    acc[k] = v;
    return acc;
  }, {} as Record<string, string>);
  return {
    fbp: cookies["_fbp"] || undefined,
    fbc: cookies["_fbc"] || undefined,
  };
}

/** Generate unique event ID for deduplication between browser pixel and CAPI */
function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Send server-side event via CAPI edge function (fire-and-forget) */
function sendCAPIEvent(params: {
  event_name: string;
  event_id: string;
  event_source_url: string;
  user_data: {
    email?: string;
    phone?: string;
    cpf?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, any>;
}) {
  // Fire and forget — don't block UI
  supabase.functions
    .invoke("meta-capi", {
      body: {
        event_name: params.event_name,
        event_id: params.event_id,
        event_source_url: params.event_source_url,
        action_source: "website",
        user_data: {
          ...params.user_data,
          client_user_agent: navigator.userAgent,
        },
        custom_data: params.custom_data,
      },
    })
    .then(({ error }) => {
      if (error) console.warn("CAPI error:", error.message);
    })
    .catch((err) => console.warn("CAPI fetch error:", err));
}

interface TrackParams {
  content_ids: string[];
  contents: Array<{ id: string; quantity: number; item_price: number }>;
  content_type: string;
  currency: string;
  num_items: number;
  value: number;
  // User data for CAPI
  email?: string;
  phone?: string;
  cpf?: string;
  order_id?: string;
  payment_method?: string;
}

/**
 * InitiateCheckout — fired when user lands on checkout
 */
export function trackInitiateCheckout(params: TrackParams) {
  const eventId = generateEventId();
  const { fbp, fbc } = getMetaCookies();

  const pixelData = {
    content_ids: params.content_ids,
    contents: params.contents,
    content_type: params.content_type,
    currency: params.currency,
    num_items: params.num_items,
    value: params.value,
    eventID: eventId,
  };

  fbq("track", "InitiateCheckout", pixelData);

  sendCAPIEvent({
    event_name: "InitiateCheckout",
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: { email: params.email, phone: params.phone, cpf: params.cpf, fbp, fbc },
    custom_data: {
      value: params.value,
      currency: params.currency,
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
      num_items: params.num_items,
    },
  });
}

/**
 * AddPaymentInfo — fired when user selects payment method
 */
export function trackAddPaymentInfo(params: TrackParams & { payment_method: string }) {
  const eventId = generateEventId();
  const { fbp, fbc } = getMetaCookies();

  fbq("track", "AddPaymentInfo", {
    content_ids: params.content_ids,
    contents: params.contents,
    content_type: params.content_type,
    currency: params.currency,
    value: params.value,
    payment_method: params.payment_method,
    eventID: eventId,
  });

  sendCAPIEvent({
    event_name: "AddPaymentInfo",
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: { email: params.email, phone: params.phone, cpf: params.cpf, fbp, fbc },
    custom_data: {
      value: params.value,
      currency: params.currency,
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
      num_items: params.num_items,
      payment_method: params.payment_method,
    },
  });
}

/**
 * Purchase — fired when payment is confirmed/approved
 */
export function trackPurchase(params: TrackParams & { order_id?: string; payment_method?: string }) {
  const eventId = generateEventId();
  const { fbp, fbc } = getMetaCookies();

  fbq("track", "Purchase", {
    content_ids: params.content_ids,
    contents: params.contents,
    content_type: params.content_type,
    currency: params.currency,
    num_items: params.num_items,
    value: params.value,
    order_id: params.order_id,
    payment_method: params.payment_method,
    eventID: eventId,
  });

  sendCAPIEvent({
    event_name: "Purchase",
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: { email: params.email, phone: params.phone, cpf: params.cpf, fbp, fbc },
    custom_data: {
      value: params.value,
      currency: params.currency,
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
      num_items: params.num_items,
      order_id: params.order_id,
      payment_method: params.payment_method,
    },
  });
}
