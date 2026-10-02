import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, Check, ChevronDown, Loader2, PackageOpen, RefreshCw } from "lucide-react";

export function Button({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-55 ${className}`} {...props}>{children}</button>;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-11 w-full appearance-none rounded-lg border border-input bg-card px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-28 w-full resize-y rounded-lg border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`} {...props} />;
}

export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}{required && <span className="ml-1 text-destructive">*</span>}{children}{error ? <span className="text-xs font-medium text-destructive">{error}</span> : hint ? <span className="text-xs font-medium text-muted-foreground">{hint}</span> : null}</label>;
}

export function StatusPill({ status }: { status: "OK" | "LOW" | "OUT" | "active" | "inactive" }) {
  const map = {
    OK: ["bg-primary/10 text-primary", "Em dia"],
    LOW: ["bg-accent/20 text-foreground", "Estoque baixo"],
    OUT: ["bg-destructive/10 text-destructive", "Sem estoque"],
    active: ["bg-primary/10 text-primary", "Ativo"],
    inactive: ["bg-muted text-muted-foreground", "Inativo"],
  } as const;
  const [tone, label] = map[status];
  return <span data-testid={`status-${status.toLowerCase()}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.08em] ${tone}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[.16em] text-primary">{eyebrow || "SCPE – Gestão Inteligente de Estoque"}</div><h1 className="text-3xl font-extrabold tracking-[-.04em] text-foreground sm:text-[2.6rem]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
    {action}
  </div>;
}

export function StatCard({ label, value, detail, accent = "primary", icon }: { label: string; value: ReactNode; detail?: string; accent?: "primary" | "accent" | "destructive"; icon?: ReactNode }) {
  return <div className="relative overflow-hidden rounded-xl border border-card-border bg-card p-5 shadow-sm">
    <div className={`absolute inset-y-0 left-0 w-1 ${accent === "primary" ? "bg-primary" : accent === "accent" ? "bg-accent" : "bg-destructive"}`} />
    <div className="flex items-start justify-between"><span className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</span>{icon && <span className="text-muted-foreground">{icon}</span>}</div>
    <div data-testid={`stat-${label.toLowerCase().replaceAll(" ", "-")}`} className="mt-3 text-3xl font-extrabold tracking-[-.05em]">{value}</div>
    {detail && <div className="mt-1 text-xs font-medium text-muted-foreground">{detail}</div>}
  </div>;
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return <div className="grid gap-3" data-testid="loading-state">{Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>;
}
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center" data-testid="error-state"><AlertCircle className="mx-auto mb-3 text-destructive" size={26} /><p className="font-bold">Não foi possível carregar os dados.</p><Button onClick={onRetry} data-testid="button-retry" className="mt-4 bg-card text-foreground ring-1 ring-border"><RefreshCw size={15} />Tentar novamente</Button></div>;
}
export function EmptyState({ title, detail }: { title: string; detail: string }) {
  const blueMascot = `${import.meta.env.BASE_URL}branding/blue-mascot.svg`;
  return <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center" data-testid="empty-state"><span className="mx-auto mb-3 grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-primary/10"><img src={blueMascot} alt="" className="h-full w-full object-contain" /></span><p className="font-bold">{title}</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{detail}</p></div>;
}
export function Saving({ label = "Salvando..." }: { label?: string }) { return <><Loader2 className="animate-spin" size={16} />{label}</>; }
export function SuccessMark({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><Check size={16} />{children}</span>; }
export function SelectChevron() { return <ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground" size={16} />; }