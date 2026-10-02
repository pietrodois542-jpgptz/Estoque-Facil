import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

const blueMascot = `${import.meta.env.BASE_URL}branding/blue-mascot.svg`;

const suggestions = [
  "Como cadastrar um produto?",
  "Como registrar uma entrada?",
  "Como registrar uma saída?",
  "Como gerar um relatório?",
  "Como editar um produto?",
  "O que é estoque mínimo?",
];

function answer(question: string) {
  const q = question.toLowerCase();
  if (q.includes("editar") && q.includes("produto")) return "Abra Produtos, localize o item que deseja alterar e use a opção de edição. Revise os dados antes de salvar.";
  if ((q.includes("estoque") && (q.includes("mínimo") || q.includes("minimo"))) || q.includes("abaixo do mínimo") || q.includes("abaixo do minimo")) return "O estoque mínimo é a quantidade de segurança definida para cada produto. Na Visão geral, o SCPE destaca os itens que chegaram a esse limite ou ficaram abaixo dele.";
  if (q.includes("movimenta") || q.includes("histórico") || q.includes("historico")) return "Abra Movimentações para consultar o histórico de entradas e saídas registradas no SCPE.";
  if (q.includes("export") || q.includes("pdf") || q.includes("imprimir")) return "Abra Relatórios e use Exportar para preparar os dados para impressão ou PDF.";
  if (q.includes("cadastr") || q.includes("novo produto")) return "Abra Produtos e clique em Novo produto. Preencha código, nome, preço, estoque mínimo e os demais campos antes de salvar.";
  if (q.includes("entrada")) return "Abra Entrada, escolha o produto, informe a quantidade e registre a movimentação.";
  if (q.includes("saída") || q.includes("saida")) return "Abra Saída, escolha o produto e a quantidade. O SCPE bloqueia automaticamente uma saída maior que o estoque disponível.";
  if (q.includes("relat")) return "Abra Relatórios para conferir entradas, saídas e a saúde do estoque. O botão Exportar permite gerar uma versão para impressão ou PDF.";
  if (q.includes("desativ")) return "Abra Produtos, localize o produto e escolha a opção de desativação. Confira se selecionou o item correto antes de confirmar.";
  if (q.includes("ajuda") || q.includes("o que você") || q.includes("o que voce")) return "Posso orientar você sobre cadastro e edição de produtos, entradas, saídas, estoque mínimo, movimentações, relatórios e exportação.";
  return "Não encontrei uma orientação específica para essa pergunta. Posso ajudar com produtos, entradas, saídas, estoque mínimo, movimentações, relatórios e exportação do SCPE.";
}

export function BlueAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{from:"blue"|"user"; text:string}[]>([
    { from: "blue", text: "Olá! Eu sou o Blue, assistente do SCPE. Como posso te ajudar hoje?" },
  ]);

  const ask = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [...m, { from: "user", text: value }, { from: "blue", text: answer(value) }]);
    setInput("");
  };

  return <>
    {open && <section className="fixed bottom-24 right-4 z-50 flex h-[min(520px,72vh)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:right-6">
      <header className="flex items-center gap-3 border-b p-4">
        <img src={blueMascot} alt="Blue, mascote do SCPE" className="h-12 w-12 rounded-full" />
        <div className="min-w-0 flex-1"><div className="font-bold">Assistente do Blue</div><div className="text-xs text-muted-foreground">Mascote e assistente do SCPE</div></div>
        <button onClick={() => setOpen(false)} aria-label="Fechar assistente" className="rounded-lg p-2 hover:bg-muted"><X size={18}/></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m,i)=><div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 ${m.from==="user"?"ml-auto bg-primary text-primary-foreground":"bg-muted"}`}>{m.text}</div>)}
        {messages.length===1 && <div className="grid gap-2 pt-1">{suggestions.map(s=><button key={s} onClick={()=>ask(s)} className="rounded-xl border px-3 py-2 text-left text-xs font-medium hover:bg-muted">{s}</button>)}</div>}
      </div>
      <form className="flex gap-2 border-t p-3" onSubmit={(e)=>{e.preventDefault();ask(input)}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Digite sua pergunta..." className="min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"/>
        <button className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground" aria-label="Enviar"><Send size={17}/></button>
      </form>
    </section>}
    <button onClick={()=>setOpen(v=>!v)} className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-primary py-2 pl-2 pr-4 text-primary-foreground shadow-xl transition hover:scale-[1.02] sm:right-6" aria-label="Abrir Assistente do Blue">
      <img src={blueMascot} alt="" className="h-12 w-12 rounded-full bg-white"/>
      <span className="text-left"><span className="block text-sm font-bold">Blue</span><span className="block text-[11px] opacity-80">Assistente do SCPE</span></span>
      <MessageCircle size={18}/>
    </button>
  </>;
}
