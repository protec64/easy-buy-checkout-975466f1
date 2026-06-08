import { Lock, Shield } from "lucide-react";
import azulLogo from "@/assets/azul-logo.png.asset.json";

interface CheckoutHeaderProps {
  checkoutId?: string;
}

const CheckoutHeader = ({ checkoutId }: CheckoutHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card checkout-shadow">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={azulLogo.url}
            alt="Azul"
            className="h-7"
          />
        </div>
        <div className="flex items-center gap-2 text-checkout-trust">
          <Shield className="h-4 w-4" />
          <Lock className="h-3.5 w-3.5" />
          <div className="hidden sm:block">
            <span className="text-xs font-medium">Ambiente Seguro</span>
            <p className="text-[10px] text-muted-foreground">
              Pagamento processado com segurança
            </p>
          </div>
          <span className="text-xs font-medium sm:hidden">Seguro</span>
        </div>
      </div>
      <div className="border-t-2 border-destructive bg-destructive/10 px-4 py-2">
        <p className="mx-auto max-w-5xl text-[11px] sm:text-xs text-foreground leading-snug text-center">
          <strong className="text-destructive">⚠️ Atenção:</strong> Este pagamento só pode ser realizado dentro do tempo. Após este período, caso o pagamento não seja confirmado,{" "}
          <strong>sua solicitação será cancelada</strong>. A desistência gera{" "}
          <strong className="text-destructive">multa de R$ 226,39 vinculada ao seu CPF</strong>, conforme os Termos de Uso.
        </p>
      </div>
    </header>
  );
};

export default CheckoutHeader;
