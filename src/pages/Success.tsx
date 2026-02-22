import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Package, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrustBadges from "@/components/checkout/TrustBadges";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/lib/meta-pixel";

const Success = () => {
  const [params] = useSearchParams();
  const paymentId = params.get("order_id") || "";
  const fired = useRef(false);
  const [orderNumber, setOrderNumber] = useState("—");

  useEffect(() => {
    if (fired.current || !paymentId) return;
    fired.current = true;

    (async () => {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("mp_payment_id", paymentId)
          .maybeSingle();

        if (!order) {
          console.warn("Order not found for Purchase event:", paymentId);
          return;
        }

        setOrderNumber(order.order_number);

        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);

        const orderItems = items || [];

        trackPurchase({
          content_ids: orderItems.map((i) => i.product_id),
          contents: orderItems.map((i) => ({
            id: i.product_id,
            quantity: i.quantity,
            item_price: Number(i.unit_price),
          })),
          content_type: "product",
          currency: "BRL",
          num_items: orderItems.reduce((sum, i) => sum + i.quantity, 0),
          value: Number(order.total),
          email: order.email,
          phone: order.phone || undefined,
          cpf: order.cpf,
          first_name: order.full_name,
          city: order.city,
          state: order.state,
          zip_code: order.cep,
          order_id: order.mp_payment_id || order.id,
          payment_method: order.payment_method,
        });

        console.log("Purchase event fired for order:", order.order_number);
      } catch (err) {
        console.error("Error firing Purchase event:", err);
      }
    })();
  }, [paymentId]);

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
            {orderNumber}
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