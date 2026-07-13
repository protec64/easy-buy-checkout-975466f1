import { useEffect, useState } from "react";
import { Lock, Shield } from "lucide-react";
import azulLogo from "@/assets/azul-logo.png.asset.json";

interface CheckoutHeaderProps {
  checkoutId?: string;
  showTimerWarning?: boolean;
}

const TIMER_KEY = "checkout_deadline_ts";
const DURATION_MS = 15 * 60 * 1000;

const CheckoutHeader = ({ checkoutId, showTimerWarning = false }: CheckoutHeaderProps) => {
  const [timeLeft, setTimeLeft] = useState({ min: "15", sec: "00" });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let deadline = Number(localStorage.getItem(TIMER_KEY));
    if (!deadline || deadline < Date.now()) {
      deadline = Date.now() + DURATION_MS;
      localStorage.setItem(TIMER_KEY, String(deadline));
    }

    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ min: "00", sec: "00" });
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ min: m.toString().padStart(2, "0"), sec: s.toString().padStart(2, "0") });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card checkout-shadow">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={azulLogo.url} alt="Azul" className="h-7" />
        </div>
        <div className="flex items-center gap-2 text-checkout-trust">
          <Shield className="h-4 w-4" />
          <Lock className="h-3.5 w-3.5" />
          <div className="hidden sm:block">
            <span className="text-xs font-medium">Ambiente Seguro</span>
            <p className="text-[10px] text-muted-foreground">Pagamento processado com segurança</p>
          </div>
          <span className="text-xs font-medium sm:hidden">Seguro</span>
        </div>
      </div>
      {showTimerWarning && (
        <div className="border-t-2 border-destructive bg-destructive/10 px-4 py-2">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-destructive">⚠️ Tempo restante:</span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs sm:text-sm font-bold tabular-nums text-primary-foreground ${expired ? "bg-destructive" : "bg-destructive"}`}>
                {timeLeft.min}:{timeLeft.sec}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground leading-snug text-center">
              Este pagamento só pode ser realizado dentro do tempo. Após este período,{" "}
              <strong>sua solicitação será cancelada</strong>. A desistência gera{" "}
              <strong className="text-destructive">multa de R$ 226,39 vinculada ao seu CPF</strong>, conforme os Termos de Uso.
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default CheckoutHeader;
