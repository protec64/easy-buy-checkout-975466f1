import { Package, Zap } from "lucide-react";

export interface ShippingOption { id: string; label: string; description: string; price: number; icon: React.ElementType; }

export const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: "free", label: "Frete Grátis", description: "Entrega em 8 a 12 dias úteis", price: 0, icon: Package },
  { id: "express", label: "Frete Expresso", description: "Chegará amanhã", price: 19.9, icon: Zap },
];

interface ShippingOptionsProps { selected: string; onChange: (id: string) => void; }

const ShippingOptions = ({ selected, onChange }: ShippingOptionsProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 checkout-shadow">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <Package className="h-4 w-4 text-primary" />
        Frete
      </h2>

      <div className="space-y-3">
        {SHIPPING_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          const Icon = opt.icon;
          return (
            <label key={opt.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <input type="radio" name="shipping" value={opt.id} checked={isSelected} onChange={() => onChange(opt.id)} className="sr-only" />
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-primary" : "border-muted-foreground/40"}`}>
                {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
              <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              <span className={`text-sm font-semibold ${opt.price === 0 ? "text-green-600" : "text-foreground"}`}>
                {opt.price === 0 ? "Grátis" : opt.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ShippingOptions;
