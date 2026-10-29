import { Leaf, Recycle, PackageCheck, AlertTriangle, ArrowRight, RefreshCw, ClipboardCheck, Sprout } from "lucide-react";
import { Link } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/ui";

/** Indicadores calculados a partir de estoque real; sem inventar impactos ambientais. */
export default function Sustainability() {
  const products = useListProducts({});
  if (products.isLoading) return <><PageHeader title="Impacto ambiental" /><LoadingState rows={4} /></>;
  if (products.isError || !products.data) return <ErrorState onRetry={() => { void products.refetch(); }} />;
  const active = products.data.filter(p => p.active);
  const critical = active.filter(p => p.currentStock <= p.minimumStock);
  const zero = active.filter(p => p.currentStock === 0);
  return <div className="animate-rise-in space-y-6">
    <PageHeader eyebrow="SPE · Sustentabilidade na prática" title="Recursos bem geridos. Menos desperdício." description="Use o controle de materiais como base para planejar o consumo, evitar compras desnecessárias e dar visibilidade ao uso dos recursos." />
    <section className="rounded-2xl border border-primary/20 bg-primary/10 p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm font-extrabold text-primary"><Sprout size={19} /> NOSSA MISSÃO</div>
      <h2 className="mt-3 max-w-3xl text-2xl font-extrabold tracking-tight sm:text-3xl">Transformar informações do estoque em decisões mais conscientes.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">A SPE ajuda a acompanhar o que uma empresa possui, o que realmente utiliza e o que precisa repor. Esse controle é o primeiro passo para diminuir desperdícios de materiais e melhorar o aproveitamento dos recursos.</p>
      <Link href="/produtos" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Gerenciar materiais <ArrowRight size={16} /></Link>
    </section>
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: "Materiais sob controle", value: active.length, icon: PackageCheck, description: "Itens cadastrados para acompanhamento" },
        { label: "Reposições a avaliar", value: critical.length, icon: AlertTriangle, description: "Itens no limite ou abaixo do estoque mínimo" },
        { label: "Materiais esgotados", value: zero.length, icon: RefreshCw, description: "Itens que exigem revisão antes da próxima compra" },
      ].map(({label,value,icon:Icon,description}) => <div key={label} className="rounded-xl border border-card-border bg-card p-5 shadow-sm"><Icon size={20} className="text-primary" /><p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-2 text-3xl font-extrabold">{value}</div><p className="mt-2 text-xs text-muted-foreground">{description}</p></div>)}
    </div>
    <section className="rounded-xl border border-card-border bg-card p-6">
      <h2 className="flex items-center gap-2 text-xl font-extrabold"><Leaf className="text-primary" size={22} /> Como a SPE contribui</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-5"><PackageCheck className="text-primary" /><h3 className="mt-3 font-extrabold">1. Conhecer os recursos</h3><p className="mt-2 text-sm text-muted-foreground">Registrar materiais, quantidades e necessidades reais para reduzir a falta de informação.</p></div>
        <div className="rounded-xl bg-muted/50 p-5"><ClipboardCheck className="text-primary" /><h3 className="mt-3 font-extrabold">2. Planejar o consumo</h3><p className="mt-2 text-sm text-muted-foreground">Acompanhar entradas e saídas, evitando reposições sem verificar o que já existe.</p></div>
        <div className="rounded-xl bg-muted/50 p-5"><Recycle className="text-primary" /><h3 className="mt-3 font-extrabold">3. Evoluir para a circularidade</h3><p className="mt-2 text-sm text-muted-foreground">Próxima funcionalidade: registrar reaproveitamento, reciclagem e descarte responsável com histórico verificável.</p></div>
      </div>
    </section>
    <section className="rounded-xl border border-card-border bg-card p-6">
      <h2 className="text-lg font-extrabold">Próximos indicadores ambientais</h2>
      <p className="mt-2 text-sm text-muted-foreground">Reaproveitamento de materiais, destinação de resíduos e prevenção de perdas serão apresentados aqui quando houver registros ambientais reais. Os números acima representam controle operacional e não equivalem a resíduos evitados ou CO₂ reduzido.</p>
    </section>
  </div>;
}
