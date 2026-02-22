import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, QrCode, RefreshCw, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ProofUpload from "./ProofUpload";
import BANKS from "./BankLogos";
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
  total?: number;
}




const PixPayment = ({ pixData, loading, onGeneratePix, email, cpf, total }: PixPaymentProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ min: "00", sec: "00" });
  const [expired, setExpired] = useState(false);
  const [status, setStatus] = useState(pixData?.status || "");
  const [checking, setChecking] = useState(false);
  const [showAllBanks, setShowAllBanks] = useState(false);

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
  const formattedTotal = total ? `R$ ${total.toFixed(2).replace(".", ",")}` : "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Já é quase seu...</h3>
        <p className="mt-1 text-sm text-muted-foreground">
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

      {/* QR Code */}
      <div className="flex flex-col items-center gap-2">
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

      {/* Steps */}
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

      {/* Security Warning */}
      <div className="rounded-lg border border-[hsl(var(--checkout-warning))]/30 bg-[hsl(var(--checkout-warning))]/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[hsl(var(--checkout-warning))]" />
          <p className="text-xs text-muted-foreground">
            Os bancos reforçaram a segurança do Pix e podem exibir alertas preventivos durante o pagamento.{" "}
            <strong className="text-foreground">Fique tranquilo — sua transação é segura e está totalmente protegida.</strong>
          </p>
        </div>
      </div>

      {/* Upload Comprovante */}
      <ProofUpload paymentId={pixData.payment_id} email={email} cpf={cpf} />

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
