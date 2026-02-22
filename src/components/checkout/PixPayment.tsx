import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, QrCode, HelpCircle, RefreshCw, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
  const [timeLeft, setTimeLeft] = useState({ min: "00", sec: "00" });
  const [expired, setExpired] = useState(false);
  const [status, setStatus] = useState(pixData?.status || "");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!pixData?.expires_at) return;
    const timer = setInterval(() => {
      const diff = new Date(pixData.expires_at).getTime() - Date.now();
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
  }, [pixData?.expires_at]);

  useEffect(() => {
    if (pixData) setStatus(pixData.status);
  }, [pixData]);

  const handleCopy = useCallback(async () => {
    if (!pixData) return;
    const code = pixData.copia_e_cola || pixData.qr_code_base64;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [pixData]);

  const handleCheckStatus = useCallback(async () => {
    if (!pixData) return;
    setChecking(true);
    const res = await checkPaymentStatus(pixData.payment_id);
    setStatus(res.status);
    setChecking(false);
  }, [pixData]);

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-foreground">PIX gerado com sucesso!</h3>
        <p className="text-sm text-muted-foreground">Agora é só finalizar o pagamento</p>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Este código expirará em:</span>
        <div className="flex items-center gap-1">
          <span className={`inline-flex h-9 w-10 items-center justify-center rounded-lg text-sm font-bold text-white ${expired ? "bg-destructive" : "bg-[hsl(var(--accent))]"}`}>
            {timeLeft.min}
          </span>
          <span className="text-lg font-bold text-muted-foreground">:</span>
          <span className={`inline-flex h-9 w-10 items-center justify-center rounded-lg text-sm font-bold text-white ${expired ? "bg-destructive" : "bg-[hsl(var(--accent))]"}`}>
            {timeLeft.sec}
          </span>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="rounded-xl border-2 border-dashed border-border p-4 bg-card">
          {pixCode ? (
            <QRCodeSVG
              value={pixCode}
              size={220}
              level="M"
              includeMargin
            />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center">
              <QrCode className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Aguardando pagamento...</span>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          A aprovação leva no máximo 2 minutos
        </span>
      </div>

      {/* Copy button */}
      <Button
        variant="outline"
        onClick={handleCopy}
        className="w-full h-12 gap-2 text-base border-accent text-accent hover:bg-accent/5"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-accent" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copiar código Pix
          </>
        )}
      </Button>

      {/* Already paid button */}
      <Button
        onClick={handleCheckStatus}
        disabled={checking}
        className="w-full h-12 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
      >
        {checking ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          "Já fiz o pagamento"
        )}
      </Button>

      {/* Steps */}
      <div className="space-y-3 pt-2">
        {[
          { n: 1, text: <>Abra o app do seu banco e entre na opção <strong>Pix</strong></> },
          { n: 2, text: <>Escolha a opção <strong>Pagar / Pix copia e cola</strong></> },
          { n: 3, text: <>Escaneie o QR Code. Se preferir, copie e cole o código</> },
          { n: 4, text: <>Depois, confirme o pagamento</> },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-xs font-bold text-accent">
              {n}
            </span>
            <p className="text-sm text-foreground">{text}</p>
          </div>
        ))}
      </div>

      {/* Upload Comprovante */}
      <ProofUpload paymentId={pixData.payment_id} email={email} cpf={cpf} />
    </div>
  );
};

export default PixPayment;
