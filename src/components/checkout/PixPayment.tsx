import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, QrCode, HelpCircle, RefreshCw } from "lucide-react";
import ProofUpload from "./ProofUpload";
import { checkPaymentStatus } from "@/lib/checkout-api";

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
}

const PixPayment = ({ pixData, loading, onGeneratePix, email, cpf }: PixPaymentProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [status, setStatus] = useState(pixData?.status || "");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!pixData?.expires_at) return;
    const timer = setInterval(() => {
      const diff = new Date(pixData.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft("Expirado");
        clearInterval(timer);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [pixData?.expires_at]);

  useEffect(() => {
    if (pixData) setStatus(pixData.status);
  }, [pixData]);

  const handleCopy = useCallback(async () => {
    if (!pixData) return;
    await navigator.clipboard.writeText(pixData.copia_e_cola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pixData]);

  const handleCheckStatus = useCallback(async () => {
    if (!pixData) return;
    setChecking(true);
    const res = await checkPaymentStatus(pixData.payment_id);
    setStatus(res.status);
    setChecking(false);
  }, [pixData]);

  if (!pixData) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-border bg-checkout-highlight p-6 text-center">
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
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
              Gerando PIX...
            </span>
          ) : (
            "Gerar PIX"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="flex items-center justify-between rounded-lg bg-checkout-highlight px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-checkout-warning" />
          <span className="text-muted-foreground">Expira em</span>
          <span className={`font-mono font-bold ${expired ? "text-destructive" : "text-foreground"}`}>
            {timeLeft}
          </span>
        </div>
        <span className="rounded-full bg-checkout-warning/10 px-2 py-0.5 text-xs font-medium text-checkout-warning">
          {status === "pending" ? "Aguardando" : status}
        </span>
      </div>

      {/* QR Code */}
      <div className="flex justify-center rounded-lg border border-border bg-card p-4">
        {pixData.qr_code_base64 ? (
          <img
            src={`data:image/png;base64,${pixData.qr_code_base64}`}
            alt="QR Code PIX"
            className="h-48 w-48"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-secondary">
            <QrCode className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Copia e Cola */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          PIX Copia e Cola
        </label>
        <div className="flex gap-2">
          <div className="flex-1 overflow-hidden rounded-lg border border-border bg-secondary px-3 py-2">
            <p className="truncate font-mono text-xs text-foreground">
              {pixData.copia_e_cola}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-checkout-trust" />
                Copiado
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

      {/* Check Status */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCheckStatus}
        disabled={checking}
        className="w-full gap-2"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
        Atualizar status do pagamento
      </Button>

      {/* Upload Comprovante */}
      <ProofUpload paymentId={pixData.payment_id} email={email} cpf={cpf} />

      {/* Ajuda */}
      <div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1.5 text-xs text-checkout-info hover:underline"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Precisa de ajuda?
        </button>
        {showHelp && (
          <div className="mt-2 space-y-2 rounded-lg bg-checkout-highlight p-3 text-xs text-muted-foreground">
            <p>
              <strong>Onde encontro o comprovante?</strong> No app do seu banco,
              após realizar o pagamento, acesse o extrato ou a área de
              comprovantes.
            </p>
            <p>
              <strong>E se o PIX demorar para aprovar?</strong> O PIX é
              geralmente instantâneo. Se demorar mais de 5 minutos, entre em
              contato via WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PixPayment;
