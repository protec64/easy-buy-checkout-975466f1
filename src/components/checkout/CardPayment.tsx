import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskCardNumber, maskExpiry, maskCVV } from "@/lib/masks";
import { CreditCard, Lock, Loader2, AlertCircle } from "lucide-react";

interface CardPaymentProps {
  values: { cardNumber: string; cardName: string; expiry: string; cvv: string; installments: string; };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  total: number;
  apiError?: string;
}

const CardPayment = ({ values, errors, onChange, onSubmit, loading, total, apiError }: CardPaymentProps) => {
  const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
    value: String(n),
    label: n === 1
      ? `1x de ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros`
      : `${n}x de ${(total / n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros`,
  }));

  const fc = (name: string) => errors[name] ? "border-destructive" : "";

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Número do cartão *</Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="0000 0000 0000 0000" value={values.cardNumber}
            onChange={(e) => onChange("cardNumber", maskCardNumber(e.target.value))} maxLength={19}
            className={`pl-10 font-mono ${fc("cardNumber")}`} />
        </div>
        {errors.cardNumber && <p className="mt-1 text-xs text-destructive">{errors.cardNumber}</p>}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Nome no cartão *</Label>
        <Input placeholder="Como impresso no cartão" value={values.cardName}
          onChange={(e) => onChange("cardName", e.target.value.toUpperCase())} className={fc("cardName")} />
        {errors.cardName && <p className="mt-1 text-xs text-destructive">{errors.cardName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Validade *</Label>
          <Input placeholder="MM/AA" value={values.expiry}
            onChange={(e) => onChange("expiry", maskExpiry(e.target.value))} maxLength={5}
            className={`font-mono ${fc("expiry")}`} />
          {errors.expiry && <p className="mt-1 text-xs text-destructive">{errors.expiry}</p>}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">CVV *</Label>
          <Input placeholder="000" value={values.cvv}
            onChange={(e) => onChange("cvv", maskCVV(e.target.value))} maxLength={4}
            className={`font-mono ${fc("cvv")}`} />
          {errors.cvv && <p className="mt-1 text-xs text-destructive">{errors.cvv}</p>}
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Parcelas *</Label>
        <Select value={values.installments} onValueChange={(v) => onChange("installments", v)}>
          <SelectTrigger className={fc("installments")}>
            <SelectValue placeholder="Selecione as parcelas" />
          </SelectTrigger>
          <SelectContent>
            {installmentOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.installments && <p className="mt-1 text-xs text-destructive">{errors.installments}</p>}
      </div>

      {apiError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{apiError}</p>
        </div>
      )}

      <Button onClick={onSubmit} disabled={loading} className="w-full h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold">
        {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Processando...</>) : (<><Lock className="h-4 w-4" />Pagar {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</>)}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">🔒 Dados do cartão não são armazenados. Tokenização segura via Mercado Pago.</p>
    </div>
  );
};

export default CardPayment;
