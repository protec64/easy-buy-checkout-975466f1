import { Lock, Shield } from "lucide-react";
import mercadopagoLogo from "@/assets/mercadopago-logo.png";

interface CheckoutHeaderProps {
  checkoutId?: string;
}

const CheckoutHeader = ({ checkoutId }: CheckoutHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card checkout-shadow">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={mercadopagoLogo}
            alt="Mercado Pago"
            className="h-7"
          />
          {checkoutId && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              Pedido {checkoutId}
            </span>
          )}
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
      {checkoutId && (
        <div className="sm:hidden border-t border-border bg-muted/50 px-4 py-1.5 text-center">
          <span className="text-[11px] font-mono text-muted-foreground">
            Pedido {checkoutId}
          </span>
        </div>
      )}
    </header>
  );
};

export default CheckoutHeader;
