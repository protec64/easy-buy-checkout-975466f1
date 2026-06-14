/**
 * Envia uma notificação push via ntfy.sh.
 * Configure o secret NTFY_TOPIC com um tópico privado (ex: "vendas-x7k9q2").
 * No celular Android, instale o app "ntfy" e assine esse mesmo tópico.
 */
interface NtfyOptions {
  title: string;
  message: string;
  priority?: "min" | "low" | "default" | "high" | "max";
  tags?: string[];
}

export async function sendNtfy({ title, message, priority = "high", tags }: NtfyOptions) {
  const topic = Deno.env.get("NTFY_TOPIC");
  if (!topic) {
    console.warn("NTFY_TOPIC not configured, skipping push notification");
    return;
  }

  const server = Deno.env.get("NTFY_SERVER") || "https://ntfy.sh";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      Title: title,
      Priority: priority,
    };
    if (tags && tags.length) headers.Tags = tags.join(",");

    const res = await fetch(`${server}/${topic}`, {
      method: "POST",
      headers,
      body: message,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("ntfy error:", res.status, txt);
    } else {
      console.log("ntfy notification sent");
    }
  } catch (err) {
    console.error("ntfy send failed:", err);
  }
}
