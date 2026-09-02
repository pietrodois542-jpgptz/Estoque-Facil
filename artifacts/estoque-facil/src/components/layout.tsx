import { type ReactNode } from "react";
import { BarChart3, Boxes, ClipboardList, LayoutDashboard, Menu, PackagePlus, PackageMinus, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

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
  return <div className="min-h-[100dvh] bg-background">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-6">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" data-testid="link-logo">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sm font-extrabold text-sidebar-primary-foreground"
            data-logo-slot="scpe-logo"
            aria-label="Espaço reservado para o logotipo oficial da SCPE"
          >
            S
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-[-.03em]">SCPE</span>
            <span className="block max-w-[165px] text-[10px] font-medium leading-4 text-sidebar-foreground/60">
              Gestão Inteligente de Estoque
            </span>
          </span>
        </Link>
        <button className="text-sidebar-foreground/60 lg:hidden" onClick={() => setOpen(false)} data-testid="button-close-menu"><X size={19} /></button>
      </div>
      <div className="px-4 pt-8"><div className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.17em] text-sidebar-foreground/45">Operação</div>
        <nav className="grid gap-1">{nav.map(({ href, label, icon: Icon }) => { const active = href === "/" ? location === "/" : location.startsWith(href); return <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-nav-${label.toLowerCase()}`} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}><Icon size={18} strokeWidth={active ? 2.5 : 1.8} />{label}</Link>; })}</nav>
      </div>
      <div className="mt-auto p-5"><div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-sidebar-primary" />Operação em dia</div><p className="text-xs leading-5 text-sidebar-foreground/55">Registre cada movimento para manter seu estoque confiável.</p></div><div className="mt-5 flex items-center gap-3 border-t border-sidebar-border pt-5"><div className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary/20 font-mono text-xs text-sidebar-primary">LO</div><div><div className="text-xs font-bold">Loja Oliveira</div><div className="text-[11px] text-sidebar-foreground/45">Administradora</div></div></div></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-sidebar/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" data-testid="button-overlay" />}
      <main className="lg:pl-[248px]"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8"><button className="text-foreground lg:hidden" onClick={() => setOpen(true)} data-testid="button-open-menu"><Menu size={22} /></button><Link href="/" onClick={() => setOpen(false)} className="ml-3 flex items-center gap-2 lg:hidden" data-testid="link-mobile-brand"><span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-[10px] font-extrabold text-primary-foreground" data-logo-slot="scpe-logo-mobile" aria-label="Espaço reservado para o logotipo oficial da SCPE">S</span><span className="text-sm font-extrabold tracking-[-.03em]">SCPE</span></Link><div className="hidden text-xs font-semibold text-muted-foreground sm:block">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date())}</div><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><div className="text-xs font-bold">Loja Oliveira</div><div className="font-mono text-[10px] text-muted-foreground">conta principal</div></div><div className="grid h-9 w-9 place-items-center rounded-full bg-secondary font-mono text-xs font-bold text-secondary-foreground">LO</div></div></header><div className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</div></main>
  </div>;
}