import { Check } from "lucide-react";

interface RedirectLoaderProps { message?: string; }

const RedirectLoader = ({ message = "Estamos preparando sua próxima etapa. Não feche nem atualize esta tela." }: RedirectLoaderProps) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
          <span className="absolute inset-2 rounded-full bg-accent/30 animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/40 animate-scale-in">
            <Check className="h-8 w-8 text-accent-foreground" strokeWidth={3} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground sm:text-xl">Aguarde um momento...</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="relative h-1.5 w-56 overflow-hidden rounded-full bg-muted">
          <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-primary via-accent to-primary animate-[loading-slide_1.4s_ease-in-out_infinite]" />
        </div>

        <p className="text-xs text-muted-foreground">Por favor, não feche esta página.</p>
      </div>

      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default RedirectLoader;
