import { createContext, FormEvent, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

type AuthUser = { id: number; name: string; email: string; role: string };
type AuthContextValue = { user: AuthUser; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthContext);
const authUrl = (route: string) => `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")}/api/auth/${route}`;

async function authRequest<T>(route: string, body?: Record<string, string>): Promise<T> {
  const response = await fetch(authUrl(route), {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "Não foi possível concluir a solicitação.");
  return payload as T;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isAuthRoute = location === "/login" || location === "/register";
  useEffect(() => {
    let mounted = true;
    authRequest<AuthUser>("me").then((next) => { if (mounted) setUser(next); }).catch(() => {
      if (mounted) setUser(null);
    }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (user && isAuthRoute) setLocation("/");
    if (!user && !isAuthRoute) setLocation("/login");
  }, [ready, user, isAuthRoute, setLocation]);

  const signOut = async () => {
    try {
      await authRequest<{ message: string }>("logout", {});
    } catch {
      // Clear the local view even if the session has expired.
    } finally {
      queryClient.clear();
      setUser(null);
      setLocation("/login");
    }
  };
  if (!ready) return <div className="grid min-h-[100dvh] place-items-center p-5"><div className="w-full max-w-xs text-center"><img src={`${import.meta.env.BASE_URL}branding/blue-mascot.svg`} alt="Blue, mascote da SPE" className="mx-auto h-28 w-28 object-contain" /><div className="mt-3 font-display text-xl font-bold">SPE</div><div className="mt-1 text-sm text-muted-foreground">Preparando seu espaço de estoque</div><div className="skeleton mx-auto mt-6 h-1.5 w-40 rounded-full" /></div></div>;
  if (!user) return <AuthScreen onAuthenticated={(next) => { setUser(next); setLocation("/"); }} />;
  if (isAuthRoute) return null;
  return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [location, setLocation] = useLocation();
  const register = location === "/register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (register && name.trim().length < 2) { setMessage("Informe seu nome."); return; }
    if (password.length < (register ? 8 : 1)) { setMessage(register ? "A senha deve ter pelo menos 8 caracteres." : "Informe sua senha."); return; }
    setBusy(true);
    try {
      const user = await authRequest<AuthUser>(register ? "register" : "login", register
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password });
      onAuthenticated(user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar. Verifique seus dados.");
    } finally { setBusy(false); }
  }
  return <main className="grid min-h-[100dvh] lg:grid-cols-[minmax(320px,1fr)_minmax(460px,1fr)]">
    <aside className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-sidebar-foreground/10" />
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border border-sidebar-foreground/10" />
      <div className="relative flex items-center gap-3"><img src={`${import.meta.env.BASE_URL}branding/blue-mascot.svg`} alt="Blue" className="h-14 w-14 object-contain" /><div><div className="font-display text-xl font-bold tracking-tight">SPE</div><div className="text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/55">Gestão de estoque</div></div></div>
      <div className="relative max-w-lg pb-10"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sidebar-border px-3 py-1.5 text-xs text-sidebar-foreground/70"><ShieldCheck size={14} />Controle claro. Decisões melhores.</div><h1 className="font-display text-5xl font-bold leading-[1.04] tracking-[-.05em]">Seu estoque,<br />em boas mãos.</h1><p className="mt-5 max-w-md text-sm leading-6 text-sidebar-foreground/65">Acompanhe produtos e movimentos com informações organizadas para apoiar uma operação mais responsável.</p></div>
      <div className="relative text-[11px] text-sidebar-foreground/45">SPE Sustentabilidade · Operação e controle</div>
    </aside>
    <section className="flex items-center justify-center px-5 py-10 sm:px-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3 lg:hidden"><img src={`${import.meta.env.BASE_URL}branding/blue-mascot.svg`} alt="Blue, mascote da SPE" className="h-14 w-14 object-contain" /><div><div className="font-display text-lg font-bold">SPE</div><div className="text-xs text-muted-foreground">Sustentabilidade · Estoque</div></div></div>
        <div className="mb-7"><p className="font-mono text-[10px] uppercase tracking-[.19em] text-primary">Acesso seguro</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.04em]">{register ? "Criar sua conta" : "Bom ter você de volta"}</h2><p className="mt-2 text-sm text-muted-foreground">Entre para acompanhar a operação do seu estoque.</p></div>
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
          <button type="button" onClick={() => { setLocation("/login"); setMessage(""); }} className={`rounded-lg py-2.5 text-sm font-bold transition ${!register ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Entrar</button>
          <button type="button" onClick={() => { setLocation("/register"); setMessage(""); }} className={`rounded-lg py-2.5 text-sm font-bold transition ${register ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Cadastrar</button>
        </div>
        <form onSubmit={submit} className="grid gap-4">
          {register && <label className="grid gap-1.5 text-xs font-bold">Nome<input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} className="h-12 rounded-xl border border-input bg-card px-3.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Seu nome" /></label>}
          <label className="grid gap-1.5 text-xs font-bold">E-mail<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="h-12 rounded-xl border border-input bg-card px-3.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="nome@empresa.com" /></label>
          <label className="grid gap-1.5 text-xs font-bold">Senha<div className="relative"><input required type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} minLength={register ? 8 : 1} value={password} onChange={event => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3.5 pr-12 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder={register ? "Mínimo de 8 caracteres" : "Sua senha"} /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {message && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{message}</div>}
          <button disabled={busy} className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground transition hover:brightness-95 disabled:opacity-60">{busy ? "Aguarde..." : register ? "Criar conta" : "Entrar"}</button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Acesso protegido por sessão segura em cookie.</p>
      </div>
    </section>
  </main>;
}
