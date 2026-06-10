// Configuração centralizada: produtos (por ID) que exibem a barra de aviso
// no topo da página de checkout.
//
// Para adicionar/remover uma rota da exibição do aviso, basta editar este array.
// Mapeamento atual:
//   - /taxa1 → d3d978a6-2426-49c6-9803-1e252e5376c9
//   - /taxa2 → 95216e2e-a90d-4a0f-9cc0-7fe888ca54dd
//   - /taxa3 → 3c547ca4-f181-409e-af84-a7e7dfc8a7f0
export const TOP_WARNING_PRODUCT_IDS: string[] = [
  "d3d978a6-2426-49c6-9803-1e252e5376c9", // taxa1
  "95216e2e-a90d-4a0f-9cc0-7fe888ca54dd", // taxa2
  "3c547ca4-f181-409e-af84-a7e7dfc8a7f0", // taxa3
];

export function shouldShowTopWarning(items: Array<{ id: string }>): boolean {
  return items.some((i) => TOP_WARNING_PRODUCT_IDS.includes(i.id));
}
