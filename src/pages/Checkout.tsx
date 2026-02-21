import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import OrderSummary from "@/components/checkout/OrderSummary";
import CustomerForm from "@/components/checkout/CustomerForm";
import ShippingForm from "@/components/checkout/ShippingForm";
import PaymentSection from "@/components/checkout/PaymentSection";
import TrustBadges from "@/components/checkout/TrustBadges";
import { Checkbox } from "@/components/ui/checkbox";
import { customerSchema, shippingSchema, cardSchema } from "@/lib/validators";
import {
  createPixPayment,
  createCardPayment,
  type PixPaymentResult,
  type OrderPayload,
} from "@/lib/checkout-api";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock product data — substituir por dados reais
const MOCK_ITEMS = [
  {
    id: "prod_001",
    name: "Camiseta Premium Algodão",
    variation: "Preta — Tamanho M",
    qty: 1,
    price: 129.9,
  },
];
const SHIPPING_COST = 19.9;
const DISCOUNT = 0;

const STORAGE_KEY = "checkout_form_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const draft = loadDraft();

  // Customer
  const [customer, setCustomer] = useState({
    email: draft?.email || "",
    fullName: draft?.fullName || "",
    cpf: draft?.cpf || "",
    phone: draft?.phone || "",
  });

  // Shipping
  const [shipping, setShipping] = useState({
    cep: draft?.cep || "",
    street: draft?.street || "",
    number: draft?.number || "",
    complement: draft?.complement || "",
    neighborhood: draft?.neighborhood || "",
    city: draft?.city || "",
    state: draft?.state || "",
    reference: draft?.reference || "",
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [cardValues, setCardValues] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
    installments: "1",
  });

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Errors
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [termsError, setTermsError] = useState("");

  // States
  const [pixData, setPixData] = useState<PixPaymentResult | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardApiError, setCardApiError] = useState("");

  // Persist draft
  useEffect(() => {
    const data = { ...customer, ...shipping };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [customer, shipping]);

  const handleCustomerChange = useCallback((field: string, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    setCustomerErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const handleShippingChange = useCallback((field: string, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setShippingErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const handleCardChange = useCallback((field: string, value: string) => {
    setCardValues((prev) => ({ ...prev, [field]: value }));
    setCardErrors((prev) => ({ ...prev, [field]: "" }));
    setCardApiError("");
  }, []);

  const subtotal = MOCK_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + SHIPPING_COST - DISCOUNT;

  const validateBase = (): boolean => {
    let valid = true;
    const cResult = customerSchema.safeParse(customer);
    if (!cResult.success) {
      const errs: Record<string, string> = {};
      cResult.error.errors.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setCustomerErrors(errs);
      valid = false;
    } else {
      setCustomerErrors({});
    }

    const sResult = shippingSchema.safeParse(shipping);
    if (!sResult.success) {
      const errs: Record<string, string> = {};
      sResult.error.errors.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setShippingErrors(errs);
      valid = false;
    } else {
      setShippingErrors({});
    }

    if (!termsAccepted) {
      setTermsError("Aceite os termos para continuar");
      valid = false;
    } else {
      setTermsError("");
    }

    if (!valid) {
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector(".border-destructive");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }

    return valid;
  };

  const buildPayload = (method: "pix" | "card"): OrderPayload => ({
    customer: {
      email: customer.email,
      full_name: customer.fullName,
      cpf: customer.cpf,
      phone: customer.phone || undefined,
    },
    shipping_address: {
      cep: shipping.cep,
      street: shipping.street,
      number: shipping.number,
      complement: shipping.complement || undefined,
      neighborhood: shipping.neighborhood,
      city: shipping.city,
      state: shipping.state,
      reference: shipping.reference || undefined,
    },
    order: {
      items: MOCK_ITEMS,
      shipping_cost: SHIPPING_COST,
      discount: DISCOUNT,
      total,
    },
    payment: {
      method,
      installments: method === "card" ? parseInt(cardValues.installments) : undefined,
    },
  });

  const handleGeneratePix = async () => {
    if (!validateBase()) return;
    setPixLoading(true);
    try {
      const result = await createPixPayment(buildPayload("pix"));
      setPixData(result);
    } catch {
      // handle error
    }
    setPixLoading(false);
  };

  const handleCardSubmit = async () => {
    if (!validateBase()) return;
    const cResult = cardSchema.safeParse(cardValues);
    if (!cResult.success) {
      const errs: Record<string, string> = {};
      cResult.error.errors.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setCardErrors(errs);
      return;
    }
    setCardErrors({});
    setCardLoading(true);
    try {
      const result = await createCardPayment(buildPayload("card"));
      if (result.status === "approved") {
        localStorage.removeItem(STORAGE_KEY);
        navigate(`/success?order_id=${result.order_id}`);
      } else {
        setCardApiError("Cartão recusado. Tente outro cartão ou método de pagamento.");
      }
    } catch {
      setCardApiError("Erro ao processar pagamento. Tente novamente.");
    }
    setCardLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Mobile Summary */}
        {isMobile && (
          <div className="mb-4">
            <OrderSummary
              items={MOCK_ITEMS}
              shippingCost={SHIPPING_COST}
              discount={DISCOUNT}
              installments={paymentMethod === "card" ? parseInt(cardValues.installments) : undefined}
              isMobile
            />
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left: Form */}
          <div className="flex-1 space-y-5">
            <CustomerForm
              values={customer}
              errors={customerErrors}
              onChange={handleCustomerChange}
            />

            <ShippingForm
              values={shipping}
              errors={shippingErrors}
              onChange={handleShippingChange}
            />

            <PaymentSection
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              pixData={pixData}
              pixLoading={pixLoading}
              onGeneratePix={handleGeneratePix}
              cardValues={cardValues}
              cardErrors={cardErrors}
              onCardChange={handleCardChange}
              onCardSubmit={handleCardSubmit}
              cardLoading={cardLoading}
              cardApiError={cardApiError}
              total={total}
            />

            {/* Terms */}
            <div className="rounded-xl border border-border bg-card p-5 checkout-shadow">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => {
                    setTermsAccepted(v === true);
                    setTermsError("");
                  }}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  Li e concordo com os{" "}
                  <a href="#" className="text-primary underline">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-primary underline">
                    Política de Privacidade
                  </a>
                  .
                </label>
              </div>
              {termsError && (
                <p className="mt-2 text-xs text-destructive">{termsError}</p>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Você receberá atualizações do pedido no email.
            </p>
          </div>

          {/* Right: Summary (desktop) */}
          {!isMobile && (
            <div className="w-full lg:w-[360px]">
              <OrderSummary
                items={MOCK_ITEMS}
                shippingCost={SHIPPING_COST}
                discount={DISCOUNT}
                installments={
                  paymentMethod === "card"
                    ? parseInt(cardValues.installments)
                    : undefined
                }
              />
            </div>
          )}
        </div>

        <TrustBadges />
      </main>
    </div>
  );
};

export default Checkout;
