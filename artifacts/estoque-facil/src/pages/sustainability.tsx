import { useEffect, useState, type FormEvent } from "react";
import { Leaf, Recycle, PackageCheck, Trash2, RefreshCw } from "lucide-react";
import { useListProducts, getListProductsQueryKey, getGetDashboardSummaryQueryKey, getListMovementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, LoadingState, ErrorState } from "@/components/ui";

type Action = "REUSE" | "RECYCLE" | "DISPOSE";
type RecordItem = { id: number; productId: number; productName: string; action: Action; quantity: number; notes: string | null; createdAt: string };
const labels: Record<Action, string> = { REUSE: "Reaproveitamento", RECYCLE: "Reciclagem", DISPOSE: "Descarte" };
export default function Sustainability() {
  const products = useListProducts({});
  const qc = useQueryClient();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");
  const [action, setAction] = useState<Action>("REUSE");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/environment/actions", { credentials: "include" });
      if (!response.ok) throw new Error("Não foi possível carregar o histórico ambiental. Confira se a tabela foi criada no banco.");
      setRecords(await response.json() as RecordItem[]);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Erro inesperado."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(quantity);
    if (!productId || !Number.isSafeInteger(amount) || amount <= 0) { setError("Selecione um material e informe uma quantidade inteira positiva."); return; }
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/environment/actions", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: Number(productId), action, quantity: amount, notes }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Não foi possível registrar a ação (HTTP ${response.status}).`);
      }
      setQuantity("1"); setNotes("");
      await Promise.all([refresh(), qc.invalidateQueries({ queryKey: getListProductsQueryKey() }), qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }), qc.invalidateQueries({ queryKey: getListMovementsQueryKey() })]);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro inesperado."); }
    finally { setSaving(false); }
  }
  if (products.isLoading) return <><PageHeader title="Impacto ambiental" /><LoadingState rows={4} /></>;
  if (products.isError || !products.data) return <ErrorState onRetry={() => { void products.refetch(); }} />;
  const available = products.data.filter(p => p.active && p.currentStock > 0);
  const total = (kind: Action) => records.filter(r => r.action === kind).reduce((sum, r) => sum + r.quantity, 0);
  return <div className="animate-rise-in space-y-6">
    <PageHeader eyebrow="SCPE · PROJETEC · Sustentabilidade" title="Impacto ambiental na prática" description="Registre a destinação dos materiais e acompanhe resultados reais de reaproveitamento, reciclagem e descarte." />
    <section className="rounded-xl border border-primary/20 bg-primary/10 p-5">
      <h2 className="flex items-center gap-2 text-lg font-extrabold"><Leaf size={20} /> Menos desperdício, mais responsabilidade</h2>
      <p className="mt-2 text-sm text-muted-foreground">Cada ação registrada retira a quantidade correspondente do estoque e fica salva no histórico da sua conta. Os indicadores representam unidades registradas, não estimativas de CO₂.</p>
    </section>
    <div className="grid gap-4 sm:grid-cols-3">
      {([
        { key: "REUSE" as Action, icon: PackageCheck, text: "Unidades reaproveitadas" },
        { key: "RECYCLE" as Action, icon: Recycle, text: "Unidades para reciclagem" },
        { key: "DISPOSE" as Action, icon: Trash2, text: "Unidades descartadas" },
      ]).map(({key,icon:Icon,text}) => <div key={key} className="rounded-xl border border-card-border bg-card p-5 shadow-sm"><Icon size={21} className="text-primary" /><p className="mt-3 text-xs font-bold uppercase text-muted-foreground">{text}</p><p className="mt-2 text-3xl font-extrabold">{loading ? "…" : total(key)}</p></div>)}
    </div>
    <section className="rounded-xl border border-card-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-extrabold">Registrar ação ambiental</h2>
      <p className="mt-1 text-sm text-muted-foreground">Exemplo: selecione “Caixas”, registre 3 unidades reaproveitadas e veja o resultado acima.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">Material
          <select required value={productId} onChange={e => setProductId(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-normal">
            <option value="">Selecione um material</option>
            {available.map(p => <option key={p.id} value={p.id}>{p.name} ({p.currentStock} disponíveis)</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">Destinação
          <select value={action} onChange={e => setAction(e.target.value as Action)} className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-normal">
            <option value="REUSE">Reaproveitamento</option><option value="RECYCLE">Reciclagem</option><option value="DISPOSE">Descarte responsável</option>
          </select>
        </label>
        <label className="text-sm font-bold">Quantidade (unidades)
          <input required type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-normal" />
        </label>
        <label className="text-sm font-bold">Observações (opcional)
          <input maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex.: caixas destinadas à coleta seletiva" className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-normal" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving || !available.length} className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">{saving ? "Salvando…" : "Registrar ação"}</button>
          {!available.length && <p className="mt-2 text-sm text-muted-foreground">Cadastre um material com estoque disponível para começar.</p>}
        </div>
      </form>
      {error && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    </section>
    <section className="rounded-xl border border-card-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">Histórico ambiental</h2><button onClick={() => { void refresh(); }} className="flex items-center gap-1 text-sm font-bold text-primary"><RefreshCw size={16} /> Atualizar</button></div>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Carregando registros…</p> : records.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhuma ação ambiental registrada nesta conta.</p> : <div className="mt-4 space-y-3">{records.map(r => <div key={r.id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-border p-3 text-sm"><div><strong>{labels[r.action]}</strong> · {r.productName}<p className="text-muted-foreground">{r.notes || "Sem observações"}</p></div><div className="text-right"><strong>{r.quantity} un.</strong><p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("pt-BR")}</p></div></div>)}</div>}
    </section>
  </div>;
}
