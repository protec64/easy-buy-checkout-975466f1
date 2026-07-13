import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCPF, maskPhone } from "@/lib/masks";
import { User, Mail, CreditCard, Phone } from "lucide-react";

interface CustomerFormProps {
  values: { email: string; fullName: string; cpf: string; phone: string; };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

const CustomerForm = ({ values, errors, onChange }: CustomerFormProps) => {
  return (
    <div className="space-y-3 sm:space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 checkout-shadow">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <User className="h-4 w-4 text-primary" />
        Dados pessoais
      </h2>

      <div className="space-y-3">
        <div>
          <Label htmlFor="email" className="text-xs text-muted-foreground">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="seu@email.com" value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              className={`pl-10 ${errors.email ? "border-destructive" : ""}`} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="fullName" className="text-xs text-muted-foreground">Nome completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="fullName" placeholder="João da Silva" value={values.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              className={`pl-10 ${errors.fullName ? "border-destructive" : ""}`} />
          </div>
          {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cpf" className="text-xs text-muted-foreground">CPF *</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="cpf" placeholder="000.000.000-00" value={values.cpf}
                onChange={(e) => onChange("cpf", maskCPF(e.target.value))} maxLength={14}
                className={`pl-10 ${errors.cpf ? "border-destructive" : ""}`} />
            </div>
            {errors.cpf && <p className="mt-1 text-xs text-destructive">{errors.cpf}</p>}
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs text-muted-foreground">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" placeholder="(11) 99999-9999" value={values.phone}
                onChange={(e) => onChange("phone", maskPhone(e.target.value))} maxLength={15} className="pl-10" />
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">🔒 Seus dados estão protegidos.</p>
    </div>
  );
};

export default CustomerForm;
