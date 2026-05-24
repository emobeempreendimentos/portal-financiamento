"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Plus, Loader2,
  Clock, CalendarCheck, Timer, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Pendencia } from "@/types";

interface PendenciasPanelProps {
  financiamentoId: string;
  initialPendencias: Pendencia[];
}

function formatarDuracao(inicio: string, fim?: string | null): string {
  const start = new Date(inicio).getTime();
  const end = fim ? new Date(fim).getTime() : Date.now();
  const diff = end - start;

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (dias > 0) return `${dias}d ${horas}h ${minutos}min`;
  if (horas > 0) return `${horas}h ${minutos}min`;
  return `${minutos}min`;
}

function formatarData(data: string): string {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function PendenciasPanel({ financiamentoId, initialPendencias }: PendenciasPanelProps) {
  const { addToast } = useToast();
  const [pendencias, setPendencias] = useState<Pendencia[]>(initialPendencias);
  const [novaPendencia, setNovaPendencia] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const abertas = pendencias.filter((p) => p.status === "aberta");
  const concluidas = pendencias.filter((p) => p.status === "concluida");

  async function handleAdicionar() {
    if (!novaPendencia.trim()) return;
    setAdicionando(true);
    try {
      const res = await fetch("/api/admin/pendencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financiamentoId, descricao: novaPendencia.trim() }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPendencias((prev) => [json.data, ...prev]);
      setNovaPendencia("");
      setShowForm(false);
      addToast({ title: "Pendência criada!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao criar pendência", variant: "error" });
    } finally {
      setAdicionando(false);
    }
  }

  async function handleConcluir(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/pendencias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "concluir" }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPendencias((prev) => prev.map((p) => p.id === id ? json.data : p));
      addToast({ title: "Pendência concluída!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao concluir pendência", variant: "error" });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleExcluir(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/pendencias/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPendencias((prev) => prev.filter((p) => p.id !== id));
      addToast({ title: "Pendência removida", variant: "success" });
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Pendências</h2>
          {abertas.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {abertas.length}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova Pendência
        </Button>
      </div>

      {/* Formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              <textarea
                value={novaPendencia}
                onChange={(e) => setNovaPendencia(e.target.value)}
                placeholder="Descreva a pendência..."
                rows={2}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleAdicionar}
                  disabled={adicionando || !novaPendencia.trim()}
                >
                  {adicionando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Adicionar"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abertas */}
      {abertas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Em Aberto</p>
          <AnimatePresence initial={false}>
            {abertas.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4"
              >
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{p.descricao}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      Criada em {formatarData(p.criadoEm)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <Timer className="h-3 w-3" />
                      Em aberto há {formatarDuracao(p.criadoEm)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleConcluir(p.id)}
                    disabled={loadingId === p.id}
                    className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingId === p.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <><CheckCircle2 className="h-3 w-3" /> Concluir</>
                    }
                  </button>
                  <button
                    onClick={() => handleExcluir(p.id)}
                    disabled={loadingId === p.id}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Concluídas */}
      {concluidas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Concluídas</p>
          {concluidas.map((p) => (
            <div
              key={p.id}
              className="flex gap-3 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10 p-4"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 line-through decoration-green-400">
                  {p.descricao}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    Criada em {formatarData(p.criadoEm)}
                  </span>
                  {p.concluidoEm && (
                    <>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <CalendarCheck className="h-3 w-3" />
                        Concluída em {formatarData(p.concluidoEm)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <Timer className="h-3 w-3" />
                        ⏱ Resolvida em {formatarDuracao(p.criadoEm, p.concluidoEm)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleExcluir(p.id)}
                disabled={loadingId === p.id}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Vazio */}
      {pendencias.length === 0 && (
        <div className="text-center py-8 text-zinc-400 text-sm">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400 opacity-50" />
          Nenhuma pendência em aberto.
        </div>
      )}
    </div>
  );
}
