import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <div className="grid min-h-screen place-items-center">Carregando SCPE...</div>;
  if (!session) return <AuthScreen />;
  return <>{children}</>;
}

function AuthScreen() {
  const [register, setRegister] = useState(false);
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false); const [showPassword,setShowPassword]=useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage(""); setBusy(true);
    if (register) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      setMessage(error ? error.message : data.session ? "Conta criada." : "Conta criada. Confira seu e-mail para confirmar.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("E-mail ou senha inválidos.");
    }
    setBusy(false);
  }
  return <main className="grid min-h-screen place-items-center bg-muted/30 p-5">
    <section className="w-full max-w-md rounded-3xl border bg-background p-7 shadow-xl">
      <div className="mb-6 flex items-center gap-4">
        <img src={`${import.meta.env.BASE_URL}branding/blue-mascot.svg`} alt="Blue" className="h-20 w-20 rounded-2xl"/>
        <div><div className="font-mono text-xs uppercase tracking-widest text-primary">SCPE</div><h1 className="text-2xl font-extrabold">{register ? "Criar sua conta" : "Entrar no SCPE"}</h1><p className="text-sm text-muted-foreground">Acesso ao sistema de estoque.</p></div>
      </div>
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1">
        <button type="button" onClick={()=>{setRegister(false);setMessage("")}} className={`rounded-lg py-2 text-sm font-bold ${!register?"bg-background shadow-sm":""}`}>Entrar</button>
        <button type="button" onClick={()=>{setRegister(true);setMessage("")}} className={`rounded-lg py-2 text-sm font-bold ${register?"bg-background shadow-sm":""}`}>Cadastrar</button>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        {register && <input required value={name} onChange={e=>setName(e.target.value)} className="h-11 rounded-xl border px-3" placeholder="Nome"/>}
        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 rounded-xl border px-3" placeholder="E-mail"/>
        <div className="relative"><input required type={showPassword ? "text" : "password"} minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="h-11 w-full rounded-xl border px-3 pr-11" placeholder="Senha (mínimo 6 caracteres)"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
        {message && <div className="rounded-xl bg-muted p-3 text-sm">{message}</div>}
        <button disabled={busy} className="h-11 rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60">{busy ? "Aguarde..." : register ? "Criar conta" : "Entrar"}</button>
      </form>
    </section>
  </main>;
}
