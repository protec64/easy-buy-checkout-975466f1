// Captura e persistência dos parâmetros UTM/tracking + Meta cookies para envio à UTMify e CAPI.

const STORAGE_KEY = "utmify_tracking";

export type TrackingParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  src?: string;
  sck?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
};

const URL_KEYS: (keyof TrackingParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
  "sck",
  "fbclid",
];

function getCookie(name: string): string | undefined {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

export function captureTrackingFromUrl(): TrackingParams {
  const stored = loadTracking();
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: TrackingParams = {};
    let hasAny = false;
    URL_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) {
        incoming[k] = v;
        hasAny = true;
      }
    });

    // Always capture Meta cookies when available
    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");
    if (fbp) incoming.fbp = fbp;
    if (fbc) incoming.fbc = fbc;

    // If fbclid is present but no _fbc cookie, build fbc manually
    const fbclid = incoming.fbclid || stored.fbclid;
    if (fbclid && !fbc) {
      incoming.fbc = `fb.1.${Date.now()}.${fbclid}`;
    }

    if (hasAny || fbp || fbc) {
      const merged = { ...stored, ...incoming };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {}
  return stored;
}

export function loadTracking(): TrackingParams {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TrackingParams;
  } catch {
    return {};
  }
}
