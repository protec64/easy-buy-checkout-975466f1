// Configuração centralizada de avisos por produto.

// Produtos que exibem o aviso de "Tempo restante / multa" no header (apenas taxa1, taxa2, taxa3)
export const HEADER_TIMER_PRODUCT_IDS: string[] = [
  "804a87c3-c43e-4173-b71c-069d83911bc8", // taxa1
  "31ccbc66-dff2-4273-a3f1-d6e7858a2578", // taxa2
  "4e1e0583-f0c9-47e9-8632-2e5c81a43518", // taxa3
];

// Produtos que exibem o aviso "Atenção - O não pagamento do imposto..." (taxa-iof)
export const IOF_WARNING_PRODUCT_IDS: string[] = [
  "3992d6d7-f608-4b8a-9191-c053eda9a673", // /taxa-iof
];

// Produtos que exibem o aviso "Este valor não é para nós..." (/ativar-conta)
export const ATIVAR_CONTA_PRODUCT_IDS: string[] = [
  "01ba9522-2107-4a64-9e39-53e782886996", // /ativar-conta
  "5f3e11dc-276b-4c90-a9ed-bfc6aa95aba7", // /deposito
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
