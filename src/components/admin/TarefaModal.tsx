"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, ListTodo } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  PRIORIDADES, PRIORIDADE_LABEL, STATUS, STATUS_LABEL, Tarefa, notificarMudancaTarefas,
} from "@/lib/tarefas";

interface Props {
  open: boolean;
  tarefa: Tarefa | null; // null = nova
  onClose: () => void;
  onSaved: () => void;
}

const vazio = {
  titulo: "",
  descricao: "",
  prioridade: "media",
  status: "pendente",
  dataLimite: "",
  hora: "",
};

export function TarefaModal({ open, tarefa, onClose, onSaved }: Props) {
  const { addToast } = useToast();
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      tarefa
        ? {
            titulo: tarefa.titulo,
            descricao: tarefa.descricao || "",
            prioridade: tarefa.prioridade,
            status: tarefa.status,
            dataLimite: tarefa.dataLimite || "",
            hora: tarefa.hora || "",
          }
        : vazio
    );
  }, [open, tarefa]);

  const set = (k: keyof typeof vazio, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function salvar() {
    if (!form.titulo.trim()) {
      addToast({ title: "Informe o título da tarefa", variant: "error" });
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch(tarefa ? `/api/admin/tarefas/${tarefa.id}` : "/api/admin/tarefas", {
        method: tarefa ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          descricao: form.descricao,
          prioridade: form.prioridade,
          status: form.status,
          dataLimite: form.dataLimite || null,
          hora: form.hora || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);

      addToast({ title: tarefa ? "Tarefa atualizada!" : "Tarefa criada!", variant: "success" });
      notificarMudancaTarefas();
      onSaved();
      onClose();
    } catch (e) {
      addToast({ title: e instanceof Error ? e.message : "Erro ao salvar", variant: "error" });
    } finally {
      setSalvando(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => !salvando && onClose()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-white">
                  {tarefa ? "Editar Tarefa" : "Nova Tarefa"}
                </h2>
              </div>
              <button onClick={onClose} disabled={salvando}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => set("titulo", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && salvar()}
                  placeholder="Ex: Ligar para o cartório"
                  autoFocus
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  rows={3}
                  placeholder="Detalhes da tarefa (opcional)"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Prioridade</label>
                  <select value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)} className={inputCls}>
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                    {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data limite</label>
                  <input type="date" value={form.dataLimite} onChange={(e) => set("dataLimite", e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hora</label>
                  <input type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} disabled={salvando}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4" /> Salvar</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
