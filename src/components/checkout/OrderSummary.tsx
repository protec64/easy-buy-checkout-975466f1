import { Package } from "lucide-react";

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
  digital = false,
}: OrderSummaryProps) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = subtotal + (digital ? 0 : shippingCost) - discount;

  const content = (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary">
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
          </div>
        </div>
      ))}

      <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-foreground">
        <span>Total</span>
        <span>
          {total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 checkout-shadow lg:sticky lg:top-20 lg:checkout-shadow-md">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Resumo do pedido
      </h2>
      {content}
    </div>
  );
};

export default OrderSummary;
