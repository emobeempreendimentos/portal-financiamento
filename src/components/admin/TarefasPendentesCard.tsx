"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ListTodo, AlertTriangle, ArrowRight, CalendarDays, Clock } from "lucide-react";
import {
  PRIORIDADE_COR, PRIORIDADE_LABEL, TAREFAS_CHANGED_EVENT, Tarefa, fmtData,
} from "@/lib/tarefas";

interface Resumo {
  pendentes: number;
  emAndamento: number;
  abertas: number;
  vencidas: number;
  proxima: Tarefa | null;
}

export function TarefasPendentesCard() {
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tarefas/resumo");
      const json = await res.json();
      if (json.success) setResumo(json.data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    carregar();
    window.addEventListener(TAREFAS_CHANGED_EVENT, carregar);
    return () => window.removeEventListener(TAREFAS_CHANGED_EVENT, carregar);
  }, [carregar]);

  if (!resumo) return null;

  const { pendentes, vencidas, proxima } = resumo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <ListTodo className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Tarefas Pendentes</h3>
            <p className="text-xs text-zinc-400">
              {pendentes} pendente{pendentes !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{pendentes}</span>
      </div>

      {vencidas > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/15 px-3.5 py-2.5 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            {vencidas} tarefa{vencidas !== 1 ? "s" : ""} vencida{vencidas !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {proxima ? (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-3 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-1.5">Próxima tarefa</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{proxima.titulo}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PRIORIDADE_COR[proxima.prioridade] ?? PRIORIDADE_COR.media}`}>
              {PRIORIDADE_LABEL[proxima.prioridade] ?? proxima.prioridade}
            </span>
            {proxima.dataLimite && (
              <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                <CalendarDays className="h-2.5 w-2.5" /> {fmtData(proxima.dataLimite)}
              </span>
            )}
            {proxima.hora && (
              <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                <Clock className="h-2.5 w-2.5" /> {proxima.hora}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-400 mb-4">Nenhuma tarefa em aberto. 🎉</p>
      )}

      <Link
        href="/admin/tarefas"
        className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        Ver todas <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  );
}
