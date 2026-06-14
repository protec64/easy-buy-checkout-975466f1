/**
 * Envia uma notificação push via WirePusher (https://wirepusher.com).
 *
 * Como configurar no Android:
 *  1. Instale o app "WirePusher" na Play Store.
 *  2. Abra o app e copie o seu "Device ID".
 *  3. Salve esse ID no secret WIREPUSHER_ID.
 *  4. (Opcional) Crie um tipo de notificação no app e salve em WIREPUSHER_TYPE.
 */
interface WirePusherOptions {
  title: string;
  message: string;
  /** Nome do "type" criado no app (opcional). */
  type?: string;
}

export async function sendWirePusher({ title, message, type }: WirePusherOptions) {
  const id = Deno.env.get("WIREPUSHER_ID");
  if (!id) {
    console.warn("WIREPUSHER_ID not configured, skipping push notification");
    return;
  }

  const notifType = type || Deno.env.get("WIREPUSHER_TYPE") || "Venda";

  const params = new URLSearchParams({
    id,
    title,
    message,
    type: notifType,
  });

  try {
    const res = await fetch(`https://wirepusher.com/send?${params.toString()}`, {
      method: "GET",
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("WirePusher error:", res.status, txt);
    } else {
      console.log("WirePusher notification sent");
    }
  } catch (err) {
    console.error("WirePusher send failed:", err);
  }
}
