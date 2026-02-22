import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCEP } from "@/lib/masks";
import { fetchAddressByCep } from "@/lib/checkout-api";
import { MapPin, Loader2 } from "lucide-react";

interface ShippingFormProps {
  values: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    reference: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

const ShippingForm = ({ values, errors, onChange }: ShippingFormProps) => {
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepChange = async (raw: string) => {
    const masked = maskCEP(raw);
    onChange("cep", masked);
    const cleaned = masked.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setLoadingCep(true);
      const addr = await fetchAddressByCep(cleaned);
      setLoadingCep(false);
      if (addr) {
        onChange("street", addr.street);
        onChange("neighborhood", addr.neighborhood);
        onChange("city", addr.city);
        onChange("state", addr.state);
      }
    }
  };

  const fieldClass = (name: string) =>
    errors[name] ? "border-destructive" : "";

  return (
    <div className="space-y-3 sm:space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 checkout-shadow">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        Endereço de entrega
      </h2>

      <div className="space-y-3">
        <div className="max-w-[200px]">
          <Label htmlFor="cep" className="text-xs text-muted-foreground">
            CEP *
          </Label>
          <div className="relative">
            <Input
              id="cep"
              placeholder="00000-000"
              value={values.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              maxLength={9}
              className={fieldClass("cep")}
            />
            {loadingCep && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>
          {errors.cep && (
            <p className="mt-1 text-xs text-destructive">{errors.cep}</p>
          )}
        </div>

        {values.cep.replace(/\D/g, "").length === 8 && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
              <div>
                <Label htmlFor="street" className="text-xs text-muted-foreground">
                  Rua *
                </Label>
                <Input
                  id="street"
                  value={values.street}
                  onChange={(e) => onChange("street", e.target.value)}
                  className={fieldClass("street")}
                />
                {errors.street && (
                  <p className="mt-1 text-xs text-destructive">{errors.street}</p>
                )}
              </div>
              <div>
                <Label htmlFor="number" className="text-xs text-muted-foreground">
                  Número *
                </Label>
                <Input
                  id="number"
                  value={values.number}
                  onChange={(e) => onChange("number", e.target.value)}
                  className={fieldClass("number")}
                />
                {errors.number && (
                  <p className="mt-1 text-xs text-destructive">{errors.number}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="complement" className="text-xs text-muted-foreground">
                Complemento
              </Label>
              <Input
                id="complement"
                placeholder="Apto, bloco, etc."
                value={values.complement}
                onChange={(e) => onChange("complement", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="neighborhood" className="text-xs text-muted-foreground">
                  Bairro *
                </Label>
                <Input
                  id="neighborhood"
                  value={values.neighborhood}
                  onChange={(e) => onChange("neighborhood", e.target.value)}
                  className={fieldClass("neighborhood")}
                />
                {errors.neighborhood && (
                  <p className="mt-1 text-xs text-destructive">{errors.neighborhood}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city" className="text-xs text-muted-foreground">
                  Cidade *
                </Label>
                <Input
                  id="city"
                  value={values.city}
                  onChange={(e) => onChange("city", e.target.value)}
                  className={fieldClass("city")}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-destructive">{errors.city}</p>
                )}
              </div>
              <div>
                <Label htmlFor="state" className="text-xs text-muted-foreground">
                  UF *
                </Label>
                <Input
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  value={values.state}
                  onChange={(e) =>
                    onChange("state", e.target.value.toUpperCase().slice(0, 2))
                  }
                  className={fieldClass("state")}
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-destructive">{errors.state}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="reference" className="text-xs text-muted-foreground">
                Referência
              </Label>
              <Input
                id="reference"
                placeholder="Próximo a..."
                value={values.reference}
                onChange={(e) => onChange("reference", e.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShippingForm;
