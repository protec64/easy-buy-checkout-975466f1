// Email templates por produto (espelho do buildEmailContent do AdminOrders)
const TAXA_ANUAL = ["806f969c-7667-4d9d-8520-18579f3c772b"];
const IOF = ["3992d6d7-f608-4b8a-9191-c053eda9a673"];
const ATIVAR_CONTA = ["01ba9522-2107-4a64-9e39-53e782886996"];
// Envio automático para todos os pedidos aprovados
export function shouldSendOrderEmail(_productIds: string[]): boolean {
  return true;
}

export function buildOrderEmail(order: any, productIds: string[]): { subject: string; body: string } {
  const firstName = (order.full_name || "").trim().split(" ")[0] || "";
  const has = (list: string[]) => productIds.some((id) => list.includes(id));

  void has;
  return {
    subject: "Seu cartão está aguardando ativação",
    body:
      `Olá, ${firstName}!\n\n` +
      "Seu cartão já está liberado e aguardando apenas a ativação final.\n\n" +
      "Para concluir o processo e liberar o acesso, acesse agora:\n\n" +
      "https://azulspace.online/liberado/ativacao\n\n" +
      "A ativação leva apenas alguns minutos e, após a confirmação, seu cartão ficará disponível para uso.\n\n" +
      "Qualquer dúvida, estou à disposição.",
  };
}

function base64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendOrderEmailViaGmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!LOVABLE_API_KEY || !GMAIL_KEY) {
    console.warn("Gmail connector not configured, skipping email");
    return;
  }

  const fromName = Deno.env.get("EMAIL_FROM_NAME") || "Central de Ativação";
  const fromAddr = Deno.env.get("EMAIL_FROM_ADDRESS") || "";
  const replyTo = Deno.env.get("EMAIL_REPLY_TO") || fromAddr;

  const subjectEnc = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`;
  const fromNameEnc = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(fromName)))}?=`;

  // HTML alternative (better inbox placement than pure text with a bare link)
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linkified = escapeHtml(params.body).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1a73e8;text-decoration:underline;font-weight:600;" target="_blank" rel="noopener">$1</a>',
  );
  const htmlBody =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:560px;">` +
    linkified.replace(/\n/g, "<br>") +
    `</div>`;

  const boundary = `bnd_${crypto.randomUUID().replace(/-/g, "")}`;
  const headers: string[] = [
    `To: ${params.to}`,
    fromAddr ? `From: ${fromNameEnc} <${fromAddr}>` : `From: ${fromNameEnc}`,
    replyTo ? `Reply-To: ${replyTo}` : "",
    `Subject: ${subjectEnc}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);

  const rfc2822 =
    headers.join("\r\n") +
    "\r\n\r\n" +
    `--${boundary}\r\n` +
    'Content-Type: text/plain; charset="UTF-8"\r\n' +
    "Content-Transfer-Encoding: 8bit\r\n\r\n" +
    params.body +
    `\r\n--${boundary}\r\n` +
    'Content-Type: text/html; charset="UTF-8"\r\n' +
    "Content-Transfer-Encoding: 8bit\r\n\r\n" +
    htmlBody +
    `\r\n--${boundary}--\r\n`;

  const raw = base64Url(rfc2822);

  try {
    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GMAIL_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      }
    );
    const txt = await res.text();
    console.log(`Gmail send [${res.status}]:`, txt.slice(0, 500));
  } catch (err) {
    console.error("Gmail send error:", err);
  }
}