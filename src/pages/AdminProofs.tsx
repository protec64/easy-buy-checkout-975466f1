import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Search, Lock } from "lucide-react";

interface Proof {
  id: string;
  payment_id: string;
  email: string;
  cpf: string;
  file_url: string;
  file_name: string;
  note: string | null;
  order_id: string | null;
  created_at: string;
}

const ADMIN_PASS = "owempay2026";

const AdminProofs = () => {
  const [authed, setAuthed] = useState(
    typeof window !== "undefined" && sessionStorage.getItem("admin_proofs_ok") === "1"
  );
  const [pass, setPass] = useState("");
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payment_proofs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setProofs((data as Proof[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

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
                sessionStorage.setItem("admin_proofs_ok", "1");
                setAuthed(true);
              }
            }}
          />
          <Button
            className="w-full"
            onClick={() => {
              if (pass === ADMIN_PASS) {
                sessionStorage.setItem("admin_proofs_ok", "1");
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

  const filtered = proofs.filter((p) => {
    const q = filter.toLowerCase();
    return (
      !q ||
      p.email?.toLowerCase().includes(q) ||
      p.cpf?.includes(q) ||
      p.payment_id?.toLowerCase().includes(q) ||
      p.file_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            Comprovantes recebidos ({filtered.length})
          </h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar por email, CPF, payment_id..."
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? "..." : "Atualizar"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isImg = /\.(jpe?g|png|webp|gif)$/i.test(p.file_name);
            return (
              <div
                key={p.id}
                className="rounded-lg border border-border bg-card p-3 space-y-2"
              >
                <a
                  href={p.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {isImg ? (
                    <img
                      src={p.file_url}
                      alt={p.file_name}
                      className="h-48 w-full rounded object-cover bg-secondary"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-48 w-full rounded bg-secondary flex flex-col items-center justify-center gap-2">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground px-2 text-center break-all">
                        {p.file_name}
                      </span>
                    </div>
                  )}
                </a>
                <div className="text-xs space-y-0.5">
                  <p className="font-medium text-foreground truncate">{p.email}</p>
                  <p className="text-muted-foreground">CPF: {p.cpf}</p>
                  <p className="text-muted-foreground truncate">
                    PID: {p.payment_id}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("pt-BR")}
                  </p>
                  {p.note && (
                    <p className="text-foreground bg-secondary rounded p-1.5 mt-1">
                      {p.note}
                    </p>
                  )}
                </div>
                <a
                  href={p.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                >
                  Abrir arquivo <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Nenhum comprovante encontrado.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminProofs;
