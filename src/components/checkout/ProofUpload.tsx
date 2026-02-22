import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { uploadPaymentProof } from "@/lib/checkout-api";
import { Upload, FileText, X, CheckCircle2, Loader2, Image } from "lucide-react";

interface ProofUploadProps {
  paymentId: string;
  email: string;
  cpf: string;
  orderId?: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

const ProofUpload = ({ paymentId, email, cpf, orderId }: ProofUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): boolean => {
    if (!ACCEPTED.includes(f.type)) {
      setError("Formato não aceito. Use JPG, PNG ou PDF.");
      return false;
    }
    if (f.size > MAX_SIZE) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return false;
    }
    setError("");
    return true;
  };

  const handleFile = useCallback((f: File) => {
    if (!validateFile(f)) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadPaymentProof(file, {
        payment_id: paymentId,
        email,
        cpf,
        order_id: orderId,
        note: note || undefined,
      });
      setUploaded(true);
    } catch (err: any) {
      setError(err?.message || "Erro ao enviar. Tente novamente.");
    }
    setUploading(false);
  };

  if (uploaded) {
    return (
      <div className="rounded-lg border border-checkout-trust/30 bg-checkout-trust/5 p-4 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-checkout-trust" />
        <p className="text-sm font-medium text-foreground">
          Comprovante enviado com sucesso!
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vamos validar e te avisar por email/WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-checkout-highlight p-4">
      <p className="text-sm font-medium text-foreground">
        Já pagou? Envie o comprovante
      </p>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          }`}
        >
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arraste ou clique para anexar
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG ou PDF (máx 10MB)</p>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="h-14 w-14 rounded object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded bg-secondary">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {file && (
        <>
          <Textarea
            placeholder="Observação do pagamento (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Image className="h-4 w-4" />
                Enviar comprovante
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default ProofUpload;
