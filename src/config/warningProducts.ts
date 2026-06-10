// Configuração centralizada de avisos por produto.

// Produtos que exibem o aviso de "Tempo restante / multa" no header (taxa1, taxa2, taxa3)
export const HEADER_TIMER_PRODUCT_IDS: string[] = [
  "d3d978a6-2426-49c6-9803-1e252e5376c9", // taxa1
  "95216e2e-a90d-4a0f-9cc0-7fe888ca54dd", // taxa2
  "3c547ca4-f181-409e-af84-a7e7dfc8a7f0", // taxa3
  "bf888b49-0d72-4aeb-a202-d391c5432f95", // taxa4
];

// Produtos que exibem o aviso "Atenção - O não pagamento do imposto..." (taxa-iof)
export const IOF_WARNING_PRODUCT_IDS: string[] = [
  "3992d6d7-f608-4b8a-9191-c053eda9a673", // /taxa-iof
];

// Produtos que exibem o aviso "Este valor não é para nós..." (/ativar-conta)
export const ATIVAR_CONTA_PRODUCT_IDS: string[] = [
  "01ba9522-2107-4a64-9e39-53e782886996", // /ativar-conta
];

// Produtos que exibem o aviso da anuidade (/taxa-anual)
export const TAXA_ANUAL_PRODUCT_IDS: string[] = [
  "806f969c-7667-4d9d-8520-18579f3c772b", // /taxa-anual
];

export function shouldShowTaxaAnualWarning(items: Array<{ id: string }>): boolean {
  return items.some((i) => TAXA_ANUAL_PRODUCT_IDS.includes(i.id));
}


export function shouldShowHeaderTimer(items: Array<{ id: string }>): boolean {
  return items.some((i) => HEADER_TIMER_PRODUCT_IDS.includes(i.id));
}

export function shouldShowIofWarning(items: Array<{ id: string }>): boolean {
  return items.some((i) => IOF_WARNING_PRODUCT_IDS.includes(i.id));
}

export function shouldShowAtivarContaWarning(items: Array<{ id: string }>): boolean {
  return items.some((i) => ATIVAR_CONTA_PRODUCT_IDS.includes(i.id));
}

// Compat: mantém função antiga apontando para o header timer
export const TOP_WARNING_PRODUCT_IDS = HEADER_TIMER_PRODUCT_IDS;
export const shouldShowTopWarning = shouldShowHeaderTimer;
