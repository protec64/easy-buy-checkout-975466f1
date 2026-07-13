import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  Mail,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Truck,
  Calendar,
  Shield,
} from "lucide-react";
import TrustBadges from "@/components/checkout/TrustBadges";
import { supabase } from "@/integrations/supabase/client";
import { initMetaPixel, trackPurchase } from "@/lib/meta-pixel";
import { trackGoogleAdsPurchase } from "@/lib/google-ads";

interface OrderData {
  order_number: string;
  full_name: string;
  email: string;
  cpf: string;
  phone: string | null;
  street: string;
  address_number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  created_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  variation: string | null;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const Success = () => {
  const [params] = useSearchParams();
  const paymentId = params.get("order_id") || "";
  const fired = useRef(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fired.current || !paymentId) return;
    fired.current = true;

    (async () => {
      initMetaPixel();
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("mp_payment_id", paymentId)
          .maybeSingle();

        if (!orderData) {
          console.warn("Order not found:", paymentId);
          setLoading(false);
          return;
        }

        setOrder(orderData as OrderData);

        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id);

        const orderItems = (itemsData || []) as OrderItem[];
        setItems(orderItems);
        setLoading(false);

        // Só dispara Purchase quando o pagamento estiver realmente confirmado
        const isPaid =
          (orderData as { payment_status?: string }).payment_status === "approved" ||
          (orderData as { mp_status?: string }).mp_status === "paid";
        if (!isPaid) {
          console.warn("[Success] Purchase não disparado: pagamento não confirmado", paymentId);
          return;
        }

        trackPurchase({
          content_ids: itemsData?.map((i) => i.product_id) || [],
          contents: orderItems.map((i) => ({
            id: i.product_name,
            quantity: i.quantity,
            item_price: Number(i.unit_price),
          })),
          content_type: "product",
          currency: "BRL",
          num_items: orderItems.reduce((sum, i) => sum + i.quantity, 0),
          value: Number(orderData.total),
          email: orderData.email,
          phone: orderData.phone || undefined,
          cpf: orderData.cpf,
          first_name: orderData.full_name,
          city: orderData.city,
          state: orderData.state,
          zip_code: orderData.cep,
          order_id: orderData.mp_payment_id || orderData.id,
          payment_method: orderData.payment_method,
          event_id: orderData.event_id || undefined,
        });

        trackGoogleAdsPurchase({
          value: Number(orderData.total),
          transaction_id: orderData.order_number || orderData.mp_payment_id || orderData.id,
          currency: "BRL",
          num_items: orderItems.reduce((sum, i) => sum + i.quantity, 0),
        });
      } catch (err) {
        console.error("Error loading order:", err);
        setLoading(false);
      }
    })();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <h1 className="text-lg font-bold text-foreground">Pedido não encontrado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Não foi possível localizar este pedido.
          </p>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const address = [
    `${order.street}, ${order.address_number}`,
    order.complement,
    order.neighborhood,
    `${order.city} - ${order.state}`,
    order.cep.replace(/(\d{5})(\d{3})/, "$1-$2"),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-background">
      {/* Success banner */}
      <div className="bg-accent/10 border-b border-accent/20">
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-8 text-center animate-fade-in">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 animate-scale-in">
            <CheckCircle2 className="h-9 w-9 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Pagamento confirmado!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigado pela sua compra. Seu pedido foi processado com sucesso.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Order number + date */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              Número do pedido
            </div>
            <span className="font-mono text-sm font-bold text-foreground">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Data do pedido
            </div>
            <span className="text-sm text-foreground">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Pagamento
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
              <CheckCircle2 className="h-3 w-3" />
              Aprovado via PIX
            </span>
          </div>
        </div>

        {/* Products */}
        <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Produtos
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.product_name}
                  </p>
                  {item.variation && (
                    <p className="text-xs text-muted-foreground">
                      {item.variation}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Qtd: {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {fmt(Number(item.unit_price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 border-t border-border pt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span>{fmt(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Frete
              </span>
              <span>
                {Number(order.shipping_cost) === 0
                  ? "Grátis"
                  : fmt(Number(order.shipping_cost))}
              </span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-xs text-accent">
                <span>Desconto</span>
                <span>-{fmt(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
              <span>Total</span>
              <span>{fmt(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" />
            Dados do cliente
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="text-foreground font-medium">{order.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mail</span>
              <span className="text-foreground font-medium">{order.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPF</span>
              <span className="text-foreground font-medium">
                {order.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
              </span>
            </div>
            {order.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone</span>
                <span className="text-foreground font-medium">{order.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping address */}
        <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Endereço de entrega
          </div>
          <p className="text-sm text-foreground">{address}</p>
        </div>

        {/* Email notice */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
          <Mail className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Um e-mail de confirmação foi enviado para{" "}
            <strong className="text-foreground">{order.email}</strong> com todos
            os detalhes do seu pedido.
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 animate-fade-in" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-xs text-muted-foreground">
            Compra 100% segura e protegida
          </span>
        </div>

        <TrustBadges />
      </div>
    </div>
  );
};

export default Success;
