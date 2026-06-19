/**
 * Meta (Facebook) Pixel + Conversions API (CAPI) helper
 * Pixel ID: 1325984956346321
 *
 * Events: PageView, ViewContent, InitiateCheckout, AddPaymentInfo, Purchase
 * Purchase uses event_id for browser↔server deduplication.
 */

import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

const PIXEL_ID = "1325984956346321";

let initialized = false;

export function initMetaPixel() {
  if (initialized || typeof window === "undefined") return;

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
export function generateEventId(): string {
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
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, any>;
}) {
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
  email?: string;
  phone?: string;
  cpf?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  order_id?: string;
  payment_method?: string;
}

/** Build CAPI user_data from TrackParams */
function buildCAPIUserData(params: TrackParams, fbp?: string, fbc?: string) {
  const nameParts = (params.first_name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  return {
    email: params.email,
    phone: params.phone,
    cpf: params.cpf,
    first_name: firstName,
    last_name: lastName,
    city: params.city,
    state: params.state,
    zip_code: params.zip_code,
    country: "br",
    fbp,
    fbc,
  };
}

/**
 * ViewContent — fired on product/offer page load
 */
export function trackViewContent(params: TrackParams) {
  const eventId = generateEventId();
  const { fbp, fbc } = getMetaCookies();

  fbq(
    "track",
    "ViewContent",
    {
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
      currency: params.currency,
      value: params.value,
    },
    { eventID: eventId }
  );

  sendCAPIEvent({
    event_name: "ViewContent",
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: buildCAPIUserData(params, fbp, fbc),
    custom_data: {
      value: params.value,
      currency: params.currency,
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
    },
  });
}

/**
 * InitiateCheckout — fired when user lands on checkout
 */
export function trackInitiateCheckout(params: TrackParams) {
  const eventId = generateEventId();
  const { fbp, fbc } = getMetaCookies();

  fbq(
    "track",
    "InitiateCheckout",
    {
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
      currency: params.currency,
      num_items: params.num_items,
      value: params.value,
    },
    { eventID: eventId }
  );

  sendCAPIEvent({
    event_name: "InitiateCheckout",
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: buildCAPIUserData(params, fbp, fbc),
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

  fbq(
    "track",
    "AddPaymentInfo",
    {
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
      currency: params.currency,
      value: params.value,
      payment_method: params.payment_method,
    },
    { eventID: eventId }
  );

  sendCAPIEvent({
    event_name: "AddPaymentInfo",
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: buildCAPIUserData(params, fbp, fbc),
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
 * Purchase — fired ONLY after confirmed payment.
 * Accepts optional event_id for dedup with server-side CAPI.
 */
export function trackPurchase(params: TrackParams & { order_id?: string; payment_method?: string; event_id?: string }) {
  const eventId = params.event_id || generateEventId();
  const { fbp, fbc } = getMetaCookies();

  fbq(
    "track",
    "Purchase",
    {
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type,
      currency: params.currency,
      num_items: params.num_items,
      value: params.value,
      order_id: params.order_id,
      payment_method: params.payment_method,
    },
    { eventID: eventId }
  );

  sendCAPIEvent({
    event_name: "Purchase",
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: buildCAPIUserData(params, fbp, fbc),
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
