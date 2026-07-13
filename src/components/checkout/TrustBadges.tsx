import { Truck, MessageCircle, ShieldCheck } from "lucide-react";

const badges = [
  { icon: Truck, text: "Entrega para todo o Brasil" },
  { icon: MessageCircle, text: "Suporte via WhatsApp" },
  { icon: ShieldCheck, text: "Compra protegida" },
];

const TrustBadges = () => (
  <div className="flex flex-wrap items-center justify-center gap-4 py-4">
    {badges.map((b) => (
      <div key={b.text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <b.icon className="h-3.5 w-3.5 text-checkout-trust" />
        <span>{b.text}</span>
      </div>
    ))}
  </div>
);

export default TrustBadges;
