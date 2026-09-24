"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, GripVertical, Hourglass, Search, AlertTriangle,
  PauseCircle, Building, Loader2, X, Undo2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  ETAPAS_ORDEM, LIMITES_OPCOES, PROCESSOS_CHANGED_EVENT, Processo,
  diasDesde, fmtProtocolo, lerLimiteParado, salvarLimiteParado,
} from "@/lib/processos";

const COLUNA_COR = ["#c49e62", "#b28d21", "#d6612f", "#7c3990", "#215da5", "#1b9673"];

function colunaDe(p: Processo) {
  if (!p.etapaAtual) return p.etapas.length - 1;
  const idx = p.etapas.findIndex((e) => e.id === p.etapaAtual!.id);
  return idx === -1 ? 0 : idx;
}

interface MovimentoPendente {
  processo: Processo;
  destino: number;
}

export default function ProcessosPage() {
  const { addToast } = useToast();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [soParados, setSoParados] = useState(false);
  const [limite, setLimite] = useState(7);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<number | null>(null);
  const [movendo, setMovendo] = useState<string | null>(null);
  const [confirmarVolta, setConfirmarVolta] = useState<MovimentoPendente | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/processos");
      const json = await res.json();
      if (json.success) setProcessos(json.data);
    } catch {
      addToast({ title: "Erro ao carregar processos", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    setLimite(lerLimiteParado());
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return processos.filter((p) => {
      if (soParados && (p.statusGeral !== "em_andamento" || diasDesde(p.ultimaMovimentacao) < limite)) return false;
      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) ||
        fmtProtocolo(p.protocolo).toLowerCase().includes(q) ||
        String(p.protocolo).includes(q) ||
        (p.banco ?? "").toLowerCase().includes(q)
      );
    });
  }, [processos, busca, soParados, limite]);

  const colunas = useMemo(() => {
    const cols: Processo[][] = ETAPAS_ORDEM.map(() => []);
    for (const p of filtrados) {
      const c = Math.min(colunaDe(p), cols.length - 1);
      cols[c].push(p);
    }
    for (const col of cols) {
      col.sort((a, b) => diasDesde(b.ultimaMovimentacao) - diasDesde(a.ultimaMovimentacao));
    }
    return cols;
  }, [filtrados]);

  const totalParados = processos.filter(
    (p) => p.statusGeral === "em_andamento" && diasDesde(p.ultimaMovimentacao) >= limite
  ).length;
  const totalPausados = processos.filter((p) => p.statusGeral === "pausado").length;

  function pedirMovimento(processo: Processo, destino: number) {
    const origem = colunaDe(processo);
    if (destino === origem || destino < 0 || destino >= processo.etapas.length) return;
    if (destino < origem) {
      setConfirmarVolta({ processo, destino });
      return;
    }
    mover(processo, destino);
  }

  async function mover(processo: Processo, destino: number) {
    const etapaDestino = processo.etapas[destino];
    const anterior = processos;

    // Atualização otimista
    setProcessos((lista) =>
      lista.map((p) => {
        if (p.financiamentoId !== processo.financiamentoId) return p;
        return {
          ...p,
          etapas: p.etapas.map((e, i) => ({
            ...e,
            status: i < destino ? "concluido" : i === destino ? "em_andamento" : "aguardando",
          })),
          etapaAtual: { id: etapaDestino.id, nome: etapaDestino.nome, ordem: etapaDestino.ordem },
          ultimaMovimentacao: new Date().toISOString(),
        };
      })
    );
    setMovendo(processo.financiamentoId);

    try {
      const res = await fetch("/api/admin/processos/mover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financiamentoId: processo.financiamentoId, etapaId: etapaDestino.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erro ao mover");
      addToast({ title: `${processo.nome.split(" ")[0]} → ${etapaDestino.nome}`, variant: "success" });
      window.dispatchEvent(new Event(PROCESSOS_CHANGED_EVENT));
    } catch (err) {
      setProcessos(anterior);
      addToast({
        title: "Não foi possível mover o processo",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setMovendo(null);
    }
  }

  function onDrop(coluna: number) {
    const p = processos.find((x) => x.financiamentoId === arrastando);
    setArrastando(null);
    setColunaAlvo(null);
    if (p) pedirMovimento(p, coluna);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl md:text-[38px] font-extrabold tracking-[-0.035em] text-zinc-950 dark:text-white">
            Quadro de Processos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Arraste o card para outra etapa para avançar o processo. No celular, use as setas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar por nome, protocolo, banco"
              className="h-10 w-64 rounded-xl bg-white dark:bg-zinc-900 pl-9 pr-3 text-sm text-zinc-900 dark:text-white shadow-soft ring-1 ring-zinc-900/[0.06] dark:ring-white/[0.08] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c49e62]"
            />
          </div>
          <label className="flex h-10 items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-600 dark:text-zinc-300 shadow-soft ring-1 ring-zinc-900/[0.06] dark:ring-white/[0.08]">
            <Hourglass className="h-4 w-4 text-zinc-400" />
            Alerta após
            <select
              value={limite}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLimite(v);
                salvarLimiteParado(v);
              }}
              className="bg-transparent font-semibold text-zinc-900 dark:text-white focus:outline-none"
            >
              {LIMITES_OPCOES.map((d) => (
                <option key={d} value={d}>{d} dias</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[20px] bg-white dark:bg-zinc-900 p-4 shadow-soft ring-1 ring-zinc-900/[0.04] dark:ring-white/[0.06]">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Processos ativos</p>
          <p className="mt-1.5 font-display text-[28px] font-bold leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">{processos.length}</p>
        </div>
        <button
          onClick={() => setSoParados((v) => !v)}
          className={cn(
            "rounded-[20px] p-4 text-left shadow-soft ring-1 transition-all",
            soParados
              ? "bg-red-600 text-white ring-red-600"
              : totalParados > 0
              ? "bg-red-50 ring-red-200/70 hover:ring-red-300 dark:bg-red-950/30 dark:ring-red-900/50"
              : "bg-white ring-zinc-900/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06]"
          )}
        >
          <p className={cn("flex items-center gap-1.5 text-xs font-medium", soParados ? "text-white/80" : totalParados > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400")}>
            <AlertTriangle className="h-3.5 w-3.5" />
            Parados há {limite}+ dias
          </p>
          <p className={cn("mt-1.5 font-display text-[28px] font-bold leading-none tracking-[-0.04em]", soParados ? "text-white" : "text-zinc-950 dark:text-white")}>
            {totalParados}
          </p>
          <p className={cn("mt-1 text-[11px]", soParados ? "text-white/70" : "text-zinc-400")}>
            {soParados ? "Mostrando só parados · clique para ver todos" : "Clique para filtrar"}
          </p>
        </button>
        <div className="rounded-[20px] bg-white dark:bg-zinc-900 p-4 shadow-soft ring-1 ring-zinc-900/[0.04] dark:ring-white/[0.06]">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pausados</p>
          <p className="mt-1.5 font-display text-[28px] font-bold leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">{totalPausados}</p>
        </div>
      </div>

      {/* Quadro */}
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {ETAPAS_ORDEM.map((e) => (
            <div key={e} className="h-80 min-w-[260px] flex-1 animate-pulse rounded-[20px] bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
          <div className="flex min-w-max gap-4">
            {ETAPAS_ORDEM.map((nomeEtapa, ci) => {
              const cards = colunas[ci];
              const alvo = colunaAlvo === ci && arrastando !== null;
              return (
                <div
                  key={nomeEtapa}
                  onDragOver={(e) => {
                    if (!arrastando) return;
                    e.preventDefault();
                    if (colunaAlvo !== ci) setColunaAlvo(ci);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setColunaAlvo(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(ci);
                  }}
                  className={cn(
                    "flex w-[272px] flex-col rounded-[22px] p-2.5 transition-colors",
                    alvo
                      ? "bg-[#f9edd8] ring-2 ring-[#c49e62] dark:bg-[#332710]"
                      : "bg-zinc-200/50 dark:bg-zinc-900/60"
                  )}
                >
                  <div className="flex items-center justify-between px-2 pb-3 pt-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLUNA_COR[ci] }} />
                      <h2 className="truncate text-[13px] font-bold text-zinc-900 dark:text-white">{nomeEtapa}</h2>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
                      {cards.length}
                    </span>
                  </div>

                  <div className="flex min-h-[120px] flex-1 flex-col gap-2">
                    <AnimatePresence initial={false}>
                      {cards.map((p) => (
                        <CardProcesso
                          key={p.financiamentoId}
                          processo={p}
                          coluna={ci}
                          limite={limite}
                          movendo={movendo === p.financiamentoId}
                          arrastando={arrastando === p.financiamentoId}
                          onDragStart={() => setArrastando(p.financiamentoId)}
                          onDragEnd={() => { setArrastando(null); setColunaAlvo(null); }}
                          onMover={(destino) => pedirMovimento(p, destino)}
                        />
                      ))}
                    </AnimatePresence>
                    {cards.length === 0 && (
                      <div className={cn(
                        "flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed px-3 py-8 text-center text-xs",
                        alvo ? "border-[#c49e62] text-[#8b682b]" : "border-zinc-300/70 text-zinc-400 dark:border-zinc-700"
                      )}>
                        {alvo ? "Solte aqui" : "Nenhum processo"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmação para voltar etapa */}
      <AnimatePresence>
        {confirmarVolta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setConfirmarVolta(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  <Undo2 className="h-5 w-5" />
                </div>
                <button onClick={() => setConfirmarVolta(null)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-950 dark:text-white">Voltar etapa?</h3>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                O processo de <strong className="text-zinc-800 dark:text-zinc-200">{confirmarVolta.processo.nome}</strong> volta para{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">{confirmarVolta.processo.etapas[confirmarVolta.destino]?.nome}</strong>.
                As etapas seguintes voltam para “aguardando”.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setConfirmarVolta(null)}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const m = confirmarVolta;
                    setConfirmarVolta(null);
                    mover(m.processo, m.destino);
                  }}
                  className="flex-1 rounded-xl bg-[#16181d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#262930] dark:bg-[#c49e62] dark:text-[#1d1406]"
                >
                  Voltar etapa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardProcesso({
  processo: p, coluna, limite, movendo, arrastando, onDragStart, onDragEnd, onMover,
}: {
  processo: Processo;
  coluna: number;
  limite: number;
  movendo: boolean;
  arrastando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMover: (destino: number) => void;
}) {
  const dias = diasDesde(p.ultimaMovimentacao);
  const pausado = p.statusGeral === "pausado";
  const parado = !pausado && dias >= limite;
  const alerta = !pausado && !parado && dias >= Math.ceil(limite * 0.7);
  const concluidas = p.etapas.filter((e) => e.status === "concluido").length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: arrastando ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
    >
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", p.financiamentoId);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative cursor-grab rounded-2xl bg-white p-3.5 shadow-soft ring-1 active:cursor-grabbing dark:bg-zinc-900",
        parado ? "ring-red-300 dark:ring-red-900/70" : "ring-zinc-900/[0.05] dark:ring-white/[0.06]"
      )}
    >
      {parado && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-red-500" />}

      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-400 dark:text-zinc-600" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/clientes/${p.userId}`}
            draggable={false}
            className="block truncate text-sm font-semibold text-zinc-950 hover:text-[#8b682b] dark:text-white dark:hover:text-[#d9b06b]"
          >
            {p.nome}
          </Link>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-400">{fmtProtocolo(p.protocolo)}</p>
        </div>
        {movendo && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#c49e62]" />}
      </div>

      {p.banco && (
        <p className="mt-2.5 flex items-center gap-1.5 truncate pl-6 text-xs text-zinc-500 dark:text-zinc-400">
          <Building className="h-3 w-3 shrink-0" />
          <span className="truncate">{p.banco}</span>
        </p>
      )}

      {/* Progresso */}
      <div className="mt-3 flex gap-1 pl-6">
        {p.etapas.map((e) => (
          <span
            key={e.id}
            className={cn(
              "h-1 flex-1 rounded-full",
              e.status === "concluido" ? "bg-[#c49e62]" : e.status === "em_andamento" ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-700"
            )}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between pl-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {pausado ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <PauseCircle className="h-3 w-3" /> Pausado
            </span>
          ) : (
            <span
              title={`Última movimentação: ${new Date(p.ultimaMovimentacao).toLocaleDateString("pt-BR")}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                parado
                  ? "bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-400"
                  : alerta
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >
              {parado ? <AlertTriangle className="h-3 w-3" /> : <Hourglass className="h-3 w-3" />}
              {dias === 0 ? "hoje" : `${dias} dia${dias !== 1 ? "s" : ""}`}
              {parado && " parado"}
            </span>
          )}
          <span className="text-[10px] font-medium text-zinc-400">{concluidas}/{p.etapas.length}</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMover(coluna - 1)}
            disabled={coluna === 0 || movendo}
            title="Voltar etapa"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMover(coluna + 1)}
            disabled={coluna >= p.etapas.length - 1 || movendo}
            title="Avançar etapa"
            className="rounded-lg p-1 text-zinc-400 hover:bg-[#f9edd8] hover:text-[#8b682b] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#332710] dark:hover:text-[#d9b06b]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    </motion.div>
  );
}
