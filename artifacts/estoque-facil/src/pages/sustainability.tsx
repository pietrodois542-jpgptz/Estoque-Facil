import { Leaf, Recycle, PackageCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/ui";

/**
 * Indicadores operacionais, não estimativas de CO₂ ou reciclagem.
 * Evita apresentar impactos ambientais sem registros verificáveis.
 */
export default function Sustainability() {
  const products = useListProducts({});
  if (products.isLoading) return <><PageHeader title="Sustentabilidade" /><LoadingState rows={4} /></>;
  if (products.isError || !products.data) return <ErrorState onRetry={() => { void products.refetch(); }} />;
  const active = products.data.filter(p => p.active);
  const critical = active.filter(p => p.currentStock <= p.minimumStock);
  const zero = active.filter(p => p.currentStock === 0);
  const healthy = active.length - critical.length;
  return <div className="animate-rise-in">
    <PageHeader eyebrow="PROJETECH · Gestão responsável" title="Painel de sustentabilidade" description="Acompanhe oportunidades de consumo consciente, reposição planejada e redução de desperdícios." />
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: "Produtos monitorados", value: active.length, icon: PackageCheck, description: "Produtos ativos com controle de estoque" },
        { label: "Reposições que exigem atenção", value: critical.length, icon: AlertTriangle, description: "Produtos no limite ou abaixo do mínimo" },
        { label: "Estoque em situação regular", value: healthy, icon: Leaf, description: "Produtos acima do estoque mínimo" },
      ].map(({label,value,icon:Icon,description}) => <div key={label} className="rounded-xl border border-card-border bg-card p-5 shadow-sm"><Icon size={20} className="text-primary" /><p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-2 text-3xl font-extrabold">{value}</div><p className="mt-2 text-xs text-muted-foreground">{description}</p></div>)}
    </div>
    <section className="mt-6 rounded-xl border border-card-border bg-card p-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold"><Recycle className="text-primary" size={21} /> Planejamento para evitar desperdício</h2>
      <p className="mt-2 text-sm text-muted-foreground">Estes indicadores mostram o controle operacional do estoque. Ainda não representam quantidade reciclada, resíduos evitados ou emissões de carbono reduzidas.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-muted/50 p-4"><div className="text-sm font-bold">Produtos sem unidades</div><div className="mt-1 text-2xl font-bold">{zero.length}</div><p className="text-xs text-muted-foreground">Revise a necessidade de reposição antes de comprar.</p></div>
        <div className="rounded-lg bg-muted/50 p-4"><div className="text-sm font-bold">Próxima etapa ambiental</div><p className="mt-2 text-sm text-muted-foreground">Registrar materiais, reaproveitamento, destinação e resíduos com unidades de medida e histórico auditável.</p></div>
      </div>
      <Link href="/produtos" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Consultar catálogo <ArrowRight size={16} /></Link>
    </section>
  </div>;
}
