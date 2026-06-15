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
import { MessageCircle, Search, Lock, CheckCircle2, Clock } from "lucide-react";

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
  approved: { label: "Aprovado", className: "bg-green-100 text-green-700" },
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-700" },
  refused: { label: "Recusado", className: "bg-red-100 text-red-700" },
  refunded: { label: "Estornado", className: "bg-gray-100 text-gray-700" },
};

const buildWhatsAppLink = (phone: string | null, order: Order) => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (!digits.startsWith("55")) digits = "55" + digits;
  const firstName = order.full_name?.trim().split(" ")[0] || "";
  const msg = `Olá ${firstName}, tudo bem? Estou entrando em contato sobre o seu pedido ${order.order_number}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
};

const AdminOrders = () => {
  const [authed, setAuthed] = useState(
    typeof window !== "undefined" && sessionStorage.getItem("admin_orders_ok") === "1"
  );
  const [pass, setPass] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, full_name, email, cpf, phone, total, payment_status, payment_method, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    return orders.filter(
      (o) =>
        !q ||
        o.full_name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.cpf?.includes(q) ||
        o.phone?.includes(q) ||
        o.order_number?.toLowerCase().includes(q)
    );
  }, [orders, filter]);

  const totalApproved = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status === "approved")
        .reduce((sum, o) => sum + Number(o.total), 0),
    [orders]
  );

  const totalPending = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status === "pending")
        .reduce((sum, o) => sum + Number(o.total), 0),
    [orders]
  );

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Acesso restrito</h1>
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
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            Pedidos ({filtered.length})
          </h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar por nome, email, CPF, telefone..."
                className="pl-8 w-72"
              />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? "..." : "Atualizar"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">WhatsApp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const wa = buildWhatsAppLink(o.phone, o);
                const st = statusLabel[o.payment_status] || {
                  label: o.payment_status,
                  className: "bg-secondary text-foreground",
                };
                return (
                  <TableRow key={o.id}>
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
                    <TableCell className="whitespace-nowrap text-foreground">
                      R$ {Number(o.total).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {wa ? (
                        <a href={wa} target="_blank" rel="noreferrer">
                          <Button
                            size="sm"
                            className="gap-1 bg-[#25D366] text-white hover:bg-[#1ebe5a]"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Chamar
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem telefone</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {!loading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Nenhum pedido encontrado.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
