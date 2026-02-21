import { Lock, Shield } from "lucide-react";

const CheckoutHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card checkout-shadow">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">MP</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Checkout</span>
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
    </header>
  );
};

export default CheckoutHeader;
