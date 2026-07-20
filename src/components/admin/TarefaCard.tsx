"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, CheckCircle2, Circle, Clock, CalendarDays, AlertTriangle, RotateCcw } from "lucide-react";
import {
  PRIORIDADE_COR, PRIORIDADE_LABEL, STATUS_COR, STATUS_LABEL,
  Tarefa, estaVencida, fmtData,
} from "@/lib/tarefas";

interface Props {
  tarefa: Tarefa;
  index?: number;
  onEditar: (t: Tarefa) => void;
  onAlterarStatus: (t: Tarefa, status: string) => void;
  onExcluir: (t: Tarefa) => void;
}

export function TarefaCard({ tarefa, index = 0, onEditar, onAlterarStatus, onExcluir }: Props) {
  const concluida = tarefa.status === "concluida";
  const vencida = estaVencida(tarefa);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ y: -2 }}
      className={`group rounded-2xl border bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col ${
        vencida
          ? "border-red-200 dark:border-red-900/50"
          : "border-zinc-100 dark:border-zinc-800"
      } ${concluida ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3 mb-2">
        {/* Concluir com 1 clique */}
        <button
          onClick={() => onAlterarStatus(tarefa, concluida ? "pendente" : "concluida")}
          className="shrink-0 mt-0.5 transition-colors"
          title={concluida ? "Reabrir tarefa" : "Marcar como concluída"}
        >
          {concluida
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className="h-5 w-5 text-zinc-300 hover:text-green-500" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-sm text-zinc-900 dark:text-white ${concluida ? "line-through text-zinc-400 dark:text-zinc-500" : ""}`}>
            {tarefa.titulo}
          </p>
          {tarefa.descricao && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{tarefa.descricao}</p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 pl-8">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PRIORIDADE_COR[tarefa.prioridade] ?? PRIORIDADE_COR.media}`}>
          {PRIORIDADE_LABEL[tarefa.prioridade] ?? tarefa.prioridade}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COR[tarefa.status] ?? STATUS_COR.pendente}`}>
          {STATUS_LABEL[tarefa.status] ?? tarefa.status}
        </span>
        {vencida && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-2.5 w-2.5" /> Vencida
          </span>
        )}
      </div>

      {/* Data e hora */}
      {(tarefa.dataLimite || tarefa.hora) && (
        <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4 pl-8">
          {tarefa.dataLimite && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {fmtData(tarefa.dataLimite)}
            </span>
          )}
          {tarefa.hora && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {tarefa.hora}
            </span>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 mt-auto pl-8">
        {!concluida ? (
          <button
            onClick={() => onAlterarStatus(tarefa, tarefa.status === "em_andamento" ? "concluida" : "em_andamento")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {tarefa.status === "em_andamento"
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Concluir</>
              : <><Clock className="h-3.5 w-3.5" /> Iniciar</>}
          </button>
        ) : (
          <button
            onClick={() => onAlterarStatus(tarefa, "pendente")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reabrir
          </button>
        )}
        <button
          onClick={() => onEditar(tarefa)}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onExcluir(tarefa)}
          className="p-2 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
