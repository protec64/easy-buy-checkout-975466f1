import { useState } from "react";
import { ChevronDown, ChevronUp, Tag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderItem {
  id: string;
  name: string;
  variation?: string;
  qty: number;
  price: number;
  image?: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  shippingCost: number;
  discount: number;
  installments?: number;
  isMobile?: boolean;
  digital?: boolean;
}

const OrderSummary = ({
  items,
  shippingCost,
  discount,
  installments,
  isMobile = false,
  digital = false,
}: OrderSummaryProps) => {
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [expanded, setExpanded] = useState(!isMobile);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = subtotal + shippingCost - discount;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "DESCONTO10") {
      setCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("Cupom inválido");
      setCouponApplied(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{item.name}</p>
            {item.variation && (
              <p className="text-xs text-muted-foreground">{item.variation}</p>
            )}
            <p className="text-xs text-muted-foreground">Qtd: {item.qty}</p>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {(item.price * item.qty).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      ))}

      <div className="border-t border-border pt-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cupom de desconto"
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value);
                setCouponError("");
              }}
              className="pl-9 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={applyCoupon}
            className="shrink-0"
          >
            Aplicar
          </Button>
        </div>
        {couponError && (
          <p className="mt-1 text-xs text-destructive">{couponError}</p>
        )}
        {couponApplied && (
          <p className="mt-1 text-xs text-checkout-trust">Cupom aplicado!</p>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>
            {subtotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Frete</span>
          <span>
            {shippingCost > 0
              ? shippingCost.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "Grátis"}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-checkout-trust">
            <span>Desconto</span>
            <span>
              -
              {discount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
          <span>Total</span>
          <span>
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
        {installments && installments > 1 && (
          <p className="text-center text-xs text-muted-foreground">
            ou {installments}x de{" "}
            {(total / installments).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
            sem juros
          </p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 checkout-shadow">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between"
        >
          <span className="text-sm font-semibold text-foreground">
            Ver resumo do pedido
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
        {expanded && <div className="mt-4">{content}</div>}
      </div>
    );
  }

  return (
    <div className="sticky top-20 rounded-xl border border-border bg-card p-5 checkout-shadow-md">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Resumo do pedido
      </h2>
      {content}
    </div>
  );
};

export default OrderSummary;
