import { QrCode, CreditCard } from "lucide-react";
import PixPayment from "./PixPayment";
import type { PixPaymentResult } from "@/lib/checkout-api";

interface PaymentSectionProps {
  method?: "pix" | "card";
  onMethodChange?: (m: "pix" | "card") => void;
  pixData: PixPaymentResult | null;
  pixLoading: boolean;
  onGeneratePix: () => void;
  cardValues?: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    installments: string;
  };
  cardErrors?: Record<string, string>;
  onCardChange?: (field: string, value: string) => void;
  onCardSubmit?: () => void;
  cardLoading?: boolean;
  cardApiError?: string;
  total: number;
  email: string;
  cpf: string;
  fullName?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  items?: Array<{ id: string; name: string; qty: number; price: number }>;
}

const PaymentSection = ({
  pixData,
  pixLoading,
  onGeneratePix,
  total,
  email,
  cpf,
  fullName,
  phone,
  city,
  state,
  zipCode,
  items,
}: PaymentSectionProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 checkout-shadow">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <CreditCard className="h-4 w-4 text-primary" />
        Pagamento
      </h2>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
        <QrCode className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">PIX</span>
        <span className="ml-auto rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
          Aprovação instantânea
        </span>
      </div>

      <PixPayment
        pixData={pixData}
        loading={pixLoading}
        onGeneratePix={onGeneratePix}
        email={email}
        cpf={cpf}
        total={total}
        fullName={fullName}
        phone={phone}
        city={city}
        state={state}
        zipCode={zipCode}
        items={items}
      />
    </div>
  );
};

export default PaymentSection;
