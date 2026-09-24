"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, CornerDownLeft, User as UserIcon, Calculator, ListTodo, FileText, FileSignature,
  LayoutDashboard, SquareKanban, Users, UserPlus, ReceiptText, Landmark, Loader2, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtProtocolo } from "@/lib/processos";

const ABRIR_EVENT = "busca-rapida:abrir";

export function abrirBuscaRapida() {
  window.dispatchEvent(new Event(ABRIR_EVENT));
}

interface Item {
  id: string;
  grupo: string;
  titulo: string;
  subtitulo?: string;
  href: string;
  icon: React.ElementType;
}

const PAGINAS: Item[] = [
  { id: "p-dash", grupo: "Ir para", titulo: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "p-quadro", grupo: "Ir para", titulo: "Quadro de Processos", href: "/admin/processos", icon: SquareKanban },
  { id: "p-clientes", grupo: "Ir para", titulo: "Clientes", href: "/admin/clientes", icon: Users },
  { id: "p-novo", grupo: "Ir para", titulo: "Novo Cliente", href: "/admin/clientes/novo", icon: UserPlus },
  { id: "p-tarefas", grupo: "Ir para", titulo: "Lista de Tarefas", href: "/admin/tarefas", icon: ListTodo },
  { id: "p-sim", grupo: "Ir para", titulo: "Simulação", href: "/admin/simulacao", icon: Calculator },
  { id: "p-recibo", grupo: "Ir para", titulo: "Gerador de Recibo", href: "/admin/recibo", icon: ReceiptText },
  { id: "p-termos", grupo: "Ir para", titulo: "Termos para Envio", href: "/admin/termos", icon: FileSignature },
  { id: "p-docs", grupo: "Ir para", titulo: "Documentos", href: "/admin/documentos", icon: FileText },
  { id: "p-fin", grupo: "Ir para", titulo: "Financeiro — Empresa", href: "/admin/financeiro", icon: Landmark },
  { id: "p-finp", grupo: "Ir para", titulo: "Financeiro — Pessoal", href: "/admin/financeiro-pessoal", icon: UserIcon },
];

const STATUS_LABEL: Record<string, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
  pausado: "Pausado",
  cancelado: "Cancelado",
};

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

interface Resultado {
  clientes: { id: string; nome: string; email: string; cpf: string | null; financiamento: { protocolo: number; statusGeral: string } | null }[];
  simulacoes: { id: string; clienteNome: string; banco: string | null; valorImovel: number | null; createdAt: string }[];
  tarefas: { id: string; titulo: string; status: string; dataLimite: string | null }[];
  documentos: { id: string; titulo: string; categoria: string }[];
  termos: { id: string; titulo: string; destinatario: string | null }[];
}

export function BuscaRapida() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const fechar = useCallback(() => {
    setAberto(false);
    setQ("");
    setResultado(null);
    setAtivo(0);
  }, []);

  // Atalho Ctrl+K / Cmd+K e evento de abertura vindo do menu
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberto((v) => !v);
      }
    }
    const onAbrir = () => setAberto(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(ABRIR_EVENT, onAbrir);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(ABRIR_EVENT, onAbrir);
    };
  }, []);

  useEffect(() => {
    if (aberto) setTimeout(() => inputRef.current?.focus(), 30);
  }, [aberto]);

  // Busca no servidor com debounce
  useEffect(() => {
    const termo = q.trim();
    if (termo.length < 2) {
      setResultado(null);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/busca?q=${encodeURIComponent(termo)}`, { signal: ctrl.signal });
        const json = await res.json();
        if (json.success) setResultado(json.data);
      } catch { /* cancelada ou falhou */ }
      finally {
        if (!ctrl.signal.aborted) setCarregando(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const itens = useMemo<Item[]>(() => {
    const termo = semAcento(q.trim());
    const paginas = termo ? PAGINAS.filter((p) => semAcento(p.titulo).includes(termo)) : PAGINAS;
    const lista: Item[] = [];
    if (resultado) {
      for (const c of resultado.clientes) {
        const partes = [
          c.financiamento ? fmtProtocolo(c.financiamento.protocolo) : null,
          c.cpf,
          c.financiamento ? STATUS_LABEL[c.financiamento.statusGeral] ?? c.financiamento.statusGeral : null,
        ].filter(Boolean);
        lista.push({ id: `c-${c.id}`, grupo: "Clientes", titulo: c.nome, subtitulo: partes.join(" · ") || c.email, href: `/admin/clientes/${c.id}`, icon: UserIcon });
      }
      for (const s of resultado.simulacoes) {
        const valor = s.valorImovel ? ` · R$ ${s.valorImovel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "";
        lista.push({ id: `s-${s.id}`, grupo: "Simulações", titulo: s.clienteNome, subtitulo: `${new Date(s.createdAt).toLocaleDateString("pt-BR")}${valor}`, href: `/admin/simulacao?id=${s.id}`, icon: Calculator });
      }
      for (const t of resultado.tarefas) {
        lista.push({ id: `t-${t.id}`, grupo: "Tarefas", titulo: t.titulo, subtitulo: t.status === "concluida" ? "Concluída" : t.dataLimite ? `Prazo ${t.dataLimite.split("-").reverse().join("/")}` : "Sem prazo", href: "/admin/tarefas", icon: ListTodo });
      }
      for (const d of resultado.documentos) {
        lista.push({ id: `d-${d.id}`, grupo: "Documentos", titulo: d.titulo, href: "/admin/documentos", icon: FileText });
      }
      for (const t of resultado.termos) {
        lista.push({ id: `tm-${t.id}`, grupo: "Termos", titulo: t.titulo, subtitulo: t.destinatario ?? undefined, href: "/admin/termos", icon: FileSignature });
      }
    }
    return [...lista, ...paginas];
  }, [q, resultado]);

  useEffect(() => setAtivo(0), [itens.length, q]);

  function escolher(item: Item) {
    fechar();
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.min(i + 1, itens.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (itens[ativo]) escolher(itens[ativo]);
    } else if (e.key === "Escape") {
      fechar();
    }
  }

  useEffect(() => {
    listaRef.current?.querySelector(`[data-idx="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativo]);

  const termoValido = q.trim().length >= 2;
  const semResultados = termoValido && !carregando && resultado && itens.length === 0;

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={fechar}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-[22px] bg-white shadow-2xl ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-white/10"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-zinc-800">
              {carregando ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#c49e62]" />
              ) : (
                <Search className="h-5 w-5 shrink-0 text-zinc-400" />
              )}
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar cliente, CPF, protocolo, simulação..."
                className="h-14 flex-1 bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
              />
              <kbd className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">ESC</kbd>
            </div>

            <div ref={listaRef} className="max-h-[55vh] overflow-y-auto p-2">
              {semResultados && (
                <p className="px-3 py-8 text-center text-sm text-zinc-400">Nada encontrado para “{q.trim()}”.</p>
              )}
              {itens.map((item, idx) => {
                const novoGrupo = idx === 0 || itens[idx - 1].grupo !== item.grupo;
                return (
                  <div key={item.id}>
                    {novoGrupo && (
                      <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                        {item.grupo}
                      </p>
                    )}
                    <button
                      data-idx={idx}
                      onMouseMove={() => setAtivo(idx)}
                      onClick={() => escolher(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        ativo === idx ? "bg-[#f9edd8] dark:bg-[#332710]" : ""
                      )}
                    >
                      <span className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        ativo === idx ? "bg-[#c49e62] text-[#1d1406]" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-white">{item.titulo}</span>
                        {item.subtitulo && (
                          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitulo}</span>
                        )}
                      </span>
                      {ativo === idx ? (
                        <CornerDownLeft className="h-4 w-4 shrink-0 text-[#8b682b] dark:text-[#d9b06b]" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-zinc-100 px-4 py-2.5 text-[11px] text-zinc-400 dark:border-zinc-800">
              <span><kbd className="font-semibold">↑ ↓</kbd> navegar</span>
              <span><kbd className="font-semibold">Enter</kbd> abrir</span>
              <span className="ml-auto">Busca por nome, e-mail, CPF, telefone ou protocolo</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
