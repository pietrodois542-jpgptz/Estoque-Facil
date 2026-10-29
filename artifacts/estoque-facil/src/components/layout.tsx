import { type ReactNode, useState } from "react";
import { BarChart3, Boxes, ClipboardList, LayoutDashboard, Menu, PackageMinus, PackagePlus, X, Leaf, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { BlueAssistant } from "@/components/blue-assistant";
import { useAuth } from "@/components/auth-gate";

const nav = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Boxes },
  { href: "/entrada", label: "Entrada", icon: PackagePlus },
  { href: "/saida", label: "Saída", icon: PackageMinus },
  { href: "/movimentacoes", label: "Movimentações", icon: ClipboardList },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const current = nav.find(item => item.href === location)?.label || (location.includes("/editar") ? "Produtos" : "Visão geral");
  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="relative border-b border-sidebar-border px-6 pb-6 pt-7">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sidebar-accent/90"><img src={`${import.meta.env.BASE_URL}branding/blue-mascot.svg`} alt="Blue, mascote PROJETECH" className="h-10 w-10 object-contain" /></span>
            <div className="min-w-0"><div className="font-display text-[17px] font-bold tracking-[-.04em]">PROJETECH</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.18em] text-sidebar-foreground/55">Sustentabilidade</div></div>
          </div>
          <button className="absolute right-5 top-7 rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
          <div className="mt-6 flex items-center gap-2 border-t border-sidebar-border pt-4 text-[10px] font-mono uppercase tracking-[.15em] text-sidebar-foreground/50"><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />Gestão de estoque</div>
        </div>
        <div className="px-4 pt-6">
          <div className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Operação</div>
          <nav className="grid gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-nav-${label.toLowerCase()}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-all ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span className="flex-1">{label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-current" />}</Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold"><Leaf size={14} className="text-sidebar-primary" />Gestão responsável</div>
            <p className="mt-2 text-[11px] leading-[1.65] text-sidebar-foreground/55">Visibilidade sobre saldos e movimentos ajuda a planejar melhor cada reposição.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-sidebar-border pt-4 text-[10px] text-sidebar-foreground/40"><span className="font-mono">PROJETECH</span><span>·</span><span>Controle que orienta</span></div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-sidebar/50 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <main className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-foreground hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="hidden sm:inline">Estoque</span><span className="hidden sm:inline text-border">/</span><span className="font-bold text-foreground">{current}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><div className="text-[11px] font-bold text-foreground">PROJETECH Sustentabilidade</div><div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date())}</div></div>
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-card"><img src={`${import.meta.env.BASE_URL}branding/blue-mascot.svg`} alt="Blue" className="h-8 w-8 object-contain" /></span>
            <div className="hidden max-w-32 truncate text-xs font-semibold sm:block" title={auth?.user.name}>{auth?.user.name}</div>
            <button type="button" onClick={() => void auth?.signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary/40 hover:text-foreground" aria-label="Sair da conta"><LogOut size={14} /><span className="hidden sm:inline">Sair</span></button>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-4 sm:p-8">{children}</div>
        <footer className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-5 pb-24 pt-2 text-[10px] text-muted-foreground sm:flex-row sm:px-8 sm:pb-8"><span><span className="font-semibold text-foreground">PROJETECH</span> · Gestão de estoque responsável</span></footer>
      </main>
      <BlueAssistant />
    </div>
  );
}
