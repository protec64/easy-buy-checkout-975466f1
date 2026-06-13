import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProofUploadProps {
  paymentId: string;
  email: string;
  cpf: string;
  orderId?: string;
  onUploadSuccess?: () => void;
}

const WHATSAPP_NUMBER = "5511949849799";

const ProofUpload = ({ paymentId, email, cpf, orderId, onUploadSuccess }: ProofUploadProps) => {
  const handleSend = () => {
    const ref = orderId || paymentId;
    const message = `Olá! Acabei de efetuar o pagamento PIX e gostaria de enviar o comprovante.${
      ref ? ` Pedido/Pagamento: ${ref}.` : ""
    }${cpf ? ` CPF: ${cpf}.` : ""}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onUploadSuccess?.();
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-checkout-highlight p-4">
      <p className="text-sm font-medium text-foreground">
        Já pagou? Envie o comprovante pelo WhatsApp
      </p>
      <p className="text-xs text-muted-foreground">
        Clique no botão abaixo para enviar o comprovante de pagamento diretamente
        para o nosso WhatsApp e agilizar a confirmação.
      </p>
      <Button
        onClick={handleSend}
        className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5b]"
      >
        <MessageCircle className="h-4 w-4" />
        Enviar comprovante no WhatsApp
      </Button>
    </div>
  );
};

export default ProofUpload;
