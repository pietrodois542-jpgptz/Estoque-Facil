import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center px-4 text-center">
      <div className="w-full rounded-2xl border border-card-border bg-card p-8 shadow-sm sm:p-10">
        <img src={`${import.meta.env.BASE_URL}branding/blue-mascot.svg`} alt="Blue" className="mx-auto h-28 w-28 object-contain" />
        <div className="mt-4 font-mono text-xs font-bold uppercase tracking-[.18em] text-primary">Erro 404</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Página não encontrada</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">O Blue não encontrou esta página. O endereço pode estar incorreto ou a página pode ter sido movida.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm"><ArrowLeft size={16}/>Voltar para a visão geral</Link>
      </div>
    </div>
  );
}
