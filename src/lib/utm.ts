// Captura e persistência dos parâmetros UTM/tracking para envio à UTMify.

const STORAGE_KEY = "utmify_tracking";

export type TrackingParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  src?: string;
  sck?: string;
};

const KEYS: (keyof TrackingParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "src",
  "sck",
];

export function captureTrackingFromUrl(): TrackingParams {
  const stored = loadTracking();
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: TrackingParams = {};
    let hasAny = false;
    KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) {
        incoming[k] = v;
        hasAny = true;
      }
    });
    if (hasAny) {
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
