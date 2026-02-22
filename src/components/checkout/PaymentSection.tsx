import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, CreditCard } from "lucide-react";
import PixPayment from "./PixPayment";
import CardPayment from "./CardPayment";
import type { PixPaymentResult } from "@/lib/checkout-api";

interface PaymentSectionProps {
  method: "pix" | "card";
  onMethodChange: (m: "pix" | "card") => void;
  pixData: PixPaymentResult | null;
  pixLoading: boolean;
  onGeneratePix: () => void;
  cardValues: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    installments: string;
  };
  cardErrors: Record<string, string>;
  onCardChange: (field: string, value: string) => void;
  onCardSubmit: () => void;
  cardLoading: boolean;
  cardApiError?: string;
  total: number;
  email: string;
  cpf: string;
}

const PaymentSection = ({
  method,
  onMethodChange,
  pixData,
  pixLoading,
  onGeneratePix,
  cardValues,
  cardErrors,
  onCardChange,
  onCardSubmit,
  cardLoading,
  cardApiError,
  total,
  email,
  cpf,
}: PaymentSectionProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 checkout-shadow">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <CreditCard className="h-4 w-4 text-primary" />
        Pagamento
      </h2>

      <Tabs
        value={method}
        onValueChange={(v) => onMethodChange(v as "pix" | "card")}
      >
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="pix" className="gap-2 text-sm">
            <QrCode className="h-4 w-4" />
            PIX
            <span className="ml-1 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              Rápido
            </span>
          </TabsTrigger>
          <TabsTrigger value="card" className="gap-2 text-sm">
            <CreditCard className="h-4 w-4" />
            Cartão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pix">
          <PixPayment
            pixData={pixData}
            loading={pixLoading}
            onGeneratePix={onGeneratePix}
            email={email}
            cpf={cpf}
            total={total}
          />
        </TabsContent>

        <TabsContent value="card">
          <CardPayment
            values={cardValues}
            errors={cardErrors}
            onChange={onCardChange}
            onSubmit={onCardSubmit}
            loading={cardLoading}
            total={total}
            apiError={cardApiError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSection;
