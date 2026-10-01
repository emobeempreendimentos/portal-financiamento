import {
  ArrowLeft, BadgeCheck, Bell, FileSignature, HardHat, KeyRound, Route, ShieldCheck,
} from "lucide-react";
import { serif } from "@/lib/fonts";
import { cn } from "@/lib/utils";

// Telas de acesso no mesmo desenho da área restrita do site (emobe.com.br/acesso).

const SITE_URL = "https://emobe.com.br";
const SERIF = "font-[family-name:var(--font-serif)] font-normal";

const MODULOS = [
  { Icon: Route, label: "Acompanhamento", hint: "As 6 etapas em tempo real" },
  { Icon: BadgeCheck, label: "Aprovação de crédito", hint: "Análise e resposta do banco" },
  { Icon: HardHat, label: "Engenharia", hint: "Vistoria e avaliação do imóvel" },
  { Icon: FileSignature, label: "Contrato e ITBI", hint: "Assinatura, impostos e registro" },
  { Icon: Bell, label: "Notificações", hint: "Aviso por e-mail a cada etapa" },
  { Icon: KeyRound, label: "Entrega das chaves", hint: "Do contrato até as chaves" },
];

// Estilos dos campos dentro do cartão escuro — compartilhados pelos formulários de acesso.
export const authLabel = "mb-2 block text-[13px] font-medium leading-none text-white/70";
export const authInput =
  "h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 text-base text-white placeholder:text-white/35 transition-colors focus:border-[#d9b06b]/70 focus:outline-none focus:ring-2 focus:ring-[#d9b06b]/25 disabled:opacity-60";
export const authButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d9b06b] px-6 text-[15px] font-medium text-[#181003] transition-colors hover:bg-[#e4bf7f] disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4";
export const authLink = "text-white/70 underline underline-offset-4 transition-colors hover:text-white";

export function Obrigatorio() {
  return <span className="text-[#e5484d]">*</span>;
}

interface AuthShellProps {
  eyebrow: string;
  titulo: string;
  tituloItalico: string;
  descricao: string;
  mostrarModulos?: boolean;
  children: React.ReactNode;
}

export function AuthShell({ eyebrow, titulo, tituloItalico, descricao, mostrarModulos, children }: AuthShellProps) {
  return (
    <div className={cn(serif.variable, "relative isolate flex min-h-dvh flex-col bg-[#0b0c0f] text-white")}>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=75"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      </div>

      <header className="mx-auto flex w-full max-w-[1400px] items-center gap-6 px-5 py-7 sm:px-8">
        <a href={SITE_URL} className="flex items-baseline gap-2 text-white">
          <span className={cn(SERIF, "text-[22px] leading-none tracking-[-0.025em]")}>Emobe</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/70">Financiamento</span>
        </a>
        <a
          href={SITE_URL}
          className="ml-auto inline-flex items-center gap-2 text-[13px] text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Voltar ao site
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 items-center px-5 py-10 sm:px-8 lg:py-12">
        <div className="grid w-full gap-12 lg:grid-cols-[1fr_400px] lg:items-center lg:gap-14">
          <div>
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/55">
              <ShieldCheck className="size-3.5" />
              {eyebrow}
            </p>
            <h1 className={cn(SERIF, "mt-5 max-w-2xl text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02] tracking-[-0.03em] text-white")}>
              {titulo}
              <br />
              <span className="italic text-white/80">{tituloItalico}</span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/70">{descricao}</p>

            {mostrarModulos && (
              <ul className="mt-12 hidden max-w-xl gap-x-8 gap-y-5 sm:grid sm:grid-cols-2">
                {MODULOS.map(({ Icon, label, hint }) => (
                  <li key={label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-white/45" strokeWidth={1.6} />
                    <span>
                      <span className="block text-sm text-white/90">{label}</span>
                      <span className="block text-xs text-white/50">{hint}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[22px] border border-white/15 bg-black/45 p-8 backdrop-blur-xl">
            {children}
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[1400px] px-5 pb-8 text-xs text-white/40 sm:px-8">
        © {new Date().getFullYear()} Emobe Empreendimentos Imobiliários · CRECI-MG 4682 J
      </footer>
    </div>
  );
}

/** Cabeçalho do cartão: rótulo pequeno, título serifado e texto de apoio. */
export function AuthCardHeader({ eyebrow, titulo, texto }: { eyebrow: string; titulo: string; texto?: React.ReactNode }) {
  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.05em] text-white/50">{eyebrow}</p>
      <h2 className={cn(SERIF, "mt-2 text-2xl leading-8 tracking-[-0.022em] text-white")}>{titulo}</h2>
      {texto && <p className="mt-3 text-sm leading-relaxed text-white/65">{texto}</p>}
    </>
  );
}

/** Rodapé do cartão com o contato da Emobe. */
export function AuthCardFooter({ children }: { children?: React.ReactNode }) {
  return (
    <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/45">
      {children ?? (
        <>
          Não tem acesso ou precisa de ajuda? Fale com a Emobe pelo WhatsApp{" "}
          <a href="https://wa.me/5537999251577" target="_blank" rel="noopener noreferrer" className={authLink}>
            (37) 99925-1577
          </a>{" "}
          ou{" "}
          <a href="mailto:contato@emobe.com.br" className={authLink}>contato@emobe.com.br</a>.
        </>
      )}
    </p>
  );
}

