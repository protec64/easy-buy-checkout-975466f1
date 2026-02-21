import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Package, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrustBadges from "@/components/checkout/TrustBadges";

const Success = () => {
  const [params] = useSearchParams();
  const orderId = params.get("order_id") || "—";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center checkout-shadow-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">
          Pedido confirmado!
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Seu pedido foi processado com sucesso.
        </p>

        <div className="mb-6 rounded-lg bg-secondary p-4 text-left">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Número do pedido
          </div>
          <p className="font-mono text-lg font-bold text-foreground">
            {orderId}
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border p-3 text-left text-sm text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0 text-primary" />
          <span>Um email de confirmação foi enviado com os detalhes do pedido.</span>
        </div>

        <Link to="/checkout">
          <Button variant="outline" className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao checkout
          </Button>
        </Link>
      </div>
      <TrustBadges />
    </div>
  );
};

export default Success;
