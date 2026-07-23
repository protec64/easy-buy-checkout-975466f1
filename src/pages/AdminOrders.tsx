import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Search, Lock, CheckCircle2, Clock, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TAXA_ANUAL_PRODUCT_IDS,
  IOF_WARNING_PRODUCT_IDS,
  ATIVAR_CONTA_PRODUCT_IDS,
  HEADER_TIMER_PRODUCT_IDS,
} from "@/config/warningProducts";

interface Order {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  cpf: string;
  phone: string | null;
  total: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

const ADMIN_PASS = "@Android007";

const statusLabel: Record<string, { label: string; className: string }> = {
  approved: {
    label: "Aprovado",
    className: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success-foreground))]",
  },
  pending: {
    label: "Pendente",
    className: "bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning-foreground))]",
  },
  refused: {
    label: "Recusado",
    className: "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger-foreground))]",
  },
  refunded: {
    label: "Estornado",
    className: "bg-[hsl(var(--neutral-soft))] text-[hsl(var(--neutral-foreground))]",
  },
};

const buildEmailContent = (order: Order, productIds: string[]) => {
  const firstName = order.full_name?.trim().split(" ")[0] || "";
  const has = (list: string[]) => productIds.some((id) => list.includes(id));

  let subject = `Sobre o seu pedido ${order.order_number}`;
  let body = `Olá ${firstName}, tudo bem? Estou entrando em contato sobre o seu pedido ${order.order_number}.`;

  if (has(TAXA_ANUAL_PRODUCT_IDS)) {
    subject = "Sua Conta e Cartão Azul Já Estão Disponíveis";
    body =
      `Olá, ${firstName}! 🎉\n\n` +
      "O acesso à sua conta e ao seu Cartão Azul já está disponível.\n\n" +
      "Para visualizar os dados da sua conta, acompanhar o status do cartão e acessar as funcionalidades liberadas, acesse o link abaixo:\n\n" +
      "https://azulspace.online/liberado/banking\n\n" +
      "Recomendamos que realize o acesso o quanto antes para conferir todas as informações disponíveis em seu cadastro.\n\n" +
      "Caso precise de ajuda, estou à disposição.";
  } else if (
    has(HEADER_TIMER_PRODUCT_IDS) ||
    has(IOF_WARNING_PRODUCT_IDS) ||
    has(ATIVAR_CONTA_PRODUCT_IDS)
  ) {
    subject = "Seu Cartão está aguardando ativação";
    body =
      `Olá, ${firstName}! 😊\n\n` +
      "Seu cartão já está liberado e aguardando apenas a ativação final.\n\n" +
      "Para concluir o processo e liberar o acesso, acesse agora:\n\n" +
      "https://azulspace.online/liberado/ativacao\n\n" +
      "A ativação leva apenas alguns minutos e, após a confirmação, seu cartão ficará disponível para uso.\n\n" +
      "Qualquer dúvida, estou à disposição.";
  }

  return { subject, body };
};

const buildMailtoLink = (order: Order, productIds: string[]) => {
  if (!order.email) return null;
  const { subject, body } = buildEmailContent(order, productIds);
  return `mailto:${order.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const AdminOrders = () => {
  const [authed, setAuthed] = useState(
    typeof window !== "undefined" && sessionStorage.getItem("admin_orders_ok") === "1"
  );
  const [pass, setPass] = useState("");
  const [preview, setPreview] = useState<
    | { order: Order; subject: string; body: string; mailto: string }
    | null
  >(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  type DateFilter = "today" | "yesterday" | "last3" | "last7" | null;
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [testingUtmify, setTestingUtmify] = useState(false);

  const testUtmify = async () => {
    setTestingUtmify(true);
    try {
      const { data, error } = await supabase.functions.invoke("utmify-test", {});
      if (error) throw error;
      const ok = (data as any)?.ok;
      const status = (data as any)?.status;
      const body = (data as any)?.body;
      if (ok) {
        toast({
          title: "UTMify autenticou ✅",
          description: `HTTP ${status} · Pedido de teste enviado (${(data as any)?.orderId}).`,
        });
      } else {
        toast({
          title: "Falha na autenticação UTMify",
          description: `HTTP ${status ?? "?"} · ${String(body).slice(0, 200)}`,
          variant: "destructive",
        });
      }
      console.log("utmify-test result:", data);
    } catch (e: any) {
      toast({
        title: "Erro ao testar UTMify",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setTestingUtmify(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, full_name, email, cpf, phone, total, payment_status, payment_method, created_at, order_items(product_id)"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    const raw = (data as any[]) || [];
    const list = raw.map(({ order_items, ...o }) => o) as Order[];
    setOrders(list);
    const map: Record<string, string[]> = {};
    raw.forEach((o: any) => {
      map[o.id] = (o.order_items || []).map((i: any) => i.product_id);
    });
    setItemsByOrder(map);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const last3Start = new Date(todayStart);
    last3Start.setDate(last3Start.getDate() - 2);
    const last7Start = new Date(todayStart);
    last7Start.setDate(last7Start.getDate() - 6);

    return orders.filter((o) => {
      const matchesText =
        !q ||
        o.full_name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.cpf?.includes(q) ||
        o.phone?.includes(q) ||
        o.order_number?.toLowerCase().includes(q);

      if (!dateFilter) return matchesText;

      const orderDate = new Date(o.created_at);
      let matchesDate = false;
      if (dateFilter === "today") {
        matchesDate = isSameDay(orderDate, todayStart);
      } else if (dateFilter === "yesterday") {
        matchesDate = isSameDay(orderDate, yesterdayStart);
      } else if (dateFilter === "last3") {
        matchesDate = orderDate >= last3Start;
      } else if (dateFilter === "last7") {
        matchesDate = orderDate >= last7Start;
      }
      return matchesText && matchesDate;
    });
  }, [orders, filter, dateFilter]);

  const totalApproved = useMemo(
    () =>
      filtered
        .filter((o) => o.payment_status === "approved")
        .reduce((sum, o) => sum + Number(o.total), 0),
    [filtered]
  );

  const totalPending = useMemo(
    () =>
      filtered
        .filter((o) => o.payment_status === "pending")
        .reduce((sum, o) => sum + Number(o.total), 0),
    [filtered]
  );

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 checkout-shadow-lg">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Acesso restrito</h1>
            <p className="text-xs text-muted-foreground">Informe a senha para continuar.</p>
          </div>
          <Input
            type="password"
            placeholder="Senha"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pass === ADMIN_PASS) {
                sessionStorage.setItem("admin_orders_ok", "1");
                setAuthed(true);
              }
            }}
          />
          <Button
            className="w-full"
            onClick={() => {
              if (pass === ADMIN_PASS) {
                sessionStorage.setItem("admin_orders_ok", "1");
                setAuthed(true);
              }
            }}
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Pedidos
            </h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "pedido" : "pedidos"} · atualizados agora
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar por nome, email, CPF, telefone..."
                className="pl-8 w-72"
              />
            </div>
            {(
              [
                { key: "today", label: "Hoje" },
                { key: "yesterday", label: "Ontem" },
                { key: "last3", label: "Últimos 3 dias" },
                { key: "last7", label: "Últimos 7 dias" },
              ] as { key: DateFilter; label: string }[]
            ).map((opt) => (
              <Button
                key={opt.key}
                variant={dateFilter === opt.key ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setDateFilter((prev) => (prev === opt.key ? null : opt.key))
                }
              >
                {opt.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? "..." : "Atualizar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testUtmify}
              disabled={testingUtmify}
              className="gap-1"
            >
              <Zap className="h-4 w-4" />
              {testingUtmify ? "Testando..." : "Testar UTMify"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 checkout-shadow card-interactive">
            <div className="rounded-full bg-[hsl(var(--success-soft))] p-2.5">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success-foreground))]" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Pago</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                R$ {totalApproved.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 checkout-shadow card-interactive">
            <div className="rounded-full bg-[hsl(var(--warning-soft))] p-2.5">
              <Clock className="h-5 w-5 text-[hsl(var(--warning-foreground))]" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Pendente</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                R$ {totalPending.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden checkout-shadow">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">E-mail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const mailto = buildMailtoLink(o, itemsByOrder[o.id] || []);
                const st = statusLabel[o.payment_status] || {
                  label: o.payment_status,
                  className: "bg-secondary text-foreground",
                };
                return (
                  <TableRow key={o.id} className="transition-colors">
                    <TableCell className="font-medium text-foreground whitespace-nowrap">
                      {o.order_number}
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground">{o.full_name}</div>
                      <div className="text-xs text-muted-foreground">{o.email}</div>
                      <div className="text-xs text-muted-foreground">CPF: {o.cpf}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {o.phone || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-foreground tabular-nums">
                      R$ {Number(o.total).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn("status-pill", st.className)}
                      >
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {mailto ? (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            const { subject, body } = buildEmailContent(
                              o,
                              itemsByOrder[o.id] || []
                            );
                            setPreview({ order: o, subject, body, mailto });
                          }}
                        >
                          <Mail className="h-4 w-4" />
                          Pré-visualizar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem e-mail</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhum pedido encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajuste os filtros ou tente uma busca diferente.
            </p>
          </div>
        )}
      </div>
    </div>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do e-mail</DialogTitle>
            <DialogDescription>
              Confira o conteúdo antes de abrir no seu cliente de e-mail.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-[80px_1fr] gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-muted-foreground">Para:</span>
                <span className="font-medium text-foreground break-all">{preview.order.email}</span>
                <span className="text-muted-foreground">Pedido:</span>
                <span className="font-medium text-foreground">{preview.order.order_number}</span>
                <span className="text-muted-foreground">Assunto:</span>
                <span className="font-semibold text-foreground">{preview.subject}</span>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 whitespace-pre-wrap leading-relaxed text-foreground max-h-[45vh] overflow-y-auto">
                {preview.body}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreview(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!preview) return;
                navigator.clipboard?.writeText(preview.body).catch(() => {});
                toast({ title: "Corpo copiado", description: "Texto do e-mail na área de transferência." });
              }}
              variant="secondary"
            >
              Copiar texto
            </Button>
            {preview && (
              <a href={preview.mailto} onClick={() => setPreview(null)}>
                <Button className="gap-1">
                  <Mail className="h-4 w-4" />
                  Abrir no e-mail
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminOrders;
