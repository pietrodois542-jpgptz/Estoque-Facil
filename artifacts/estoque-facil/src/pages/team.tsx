import { ClipboardCheck, Code2, Cpu, Crown } from "lucide-react";
import { PageHeader } from "@/components/ui";

const team = [
  {
    name: "Pietro dos Reis Guimarães Narciso",
    role: "Presidente / CEO",
    icon: Crown,
  },
  {
    name: "Guilherme do Nascimento Machado",
    role: "Diretor de Tecnologia (CTO)",
    icon: Cpu,
  },
  {
    name: "Fabrício Ribeiro Viana",
    role: "Desenvolvedor de Software",
    icon: Code2,
  },
  {
    name: "Davi Lima de Souza",
    role: "Analista de Qualidade e Testes",
    icon: ClipboardCheck,
  },
];

export default function Team() {
  return (
    <div className="animate-rise-in">
      <PageHeader
        eyebrow="Estrutura"
        title="Equipe SCPE"
        description="As pessoas por trás do desenvolvimento e da evolução do sistema."
      />

      <section
        aria-label="Integrantes da equipe SCPE"
        className="grid gap-4 sm:grid-cols-2"
      >
        {team.map(({ name, role, icon: Icon }) => (
          <article
            key={name}
            className="group rounded-xl border border-card-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon size={21} strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold leading-6 text-foreground">
                  {name}
                </h2>
                <p className="mt-1 text-sm font-bold text-primary">{role}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="mt-8 border-t border-border pt-5 text-center text-xs font-semibold text-muted-foreground">
        SCPE – Gestão Inteligente de Estoque | Desenvolvido pela equipe SCPE.
      </p>
    </div>
  );
}