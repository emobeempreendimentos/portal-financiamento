"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eraser, X, AlertTriangle, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ZerarContaButtonProps {
  endpoint: string; // ex: "/api/admin/financeiro"
  escopo: string; // ex: "empresa" | "pessoal" (só para o texto)
  onCleared: () => void;
}

export function ZerarContaButton({ endpoint, escopo, onCleared }: ZerarContaButtonProps) {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  function fechar() {
    setOpen(false);
    setSenha("");
    setShowSenha(false);
  }

  async function confirmar() {
    if (!senha.trim()) {
      addToast({ title: "Digite a senha", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        addToast({ title: json.error || "Senha incorreta", variant: "error" });
        return;
      }
      addToast({ title: `Conta zerada! ${json.removidos ?? 0} lançamento(s) removido(s).`, variant: "success" });
      fechar();
      onCleared();
    } catch {
      addToast({ title: "Erro ao zerar conta", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
        title="Zerar conta"
      >
        <Eraser className="h-4 w-4" />
        Zerar Conta
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={fechar}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-zinc-900 dark:text-white">Zerar controle {escopo}</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Esta ação não pode ser desfeita</p>
                  </div>
                </div>
                <button onClick={fechar} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/60 dark:bg-red-900/10 px-4 py-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Todos os lançamentos serão <strong>apagados permanentemente</strong>. Digite a senha para confirmar.
                </p>
              </div>

              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Senha de confirmação</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmar()}
                  placeholder="Digite a senha"
                  autoFocus
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={fechar}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmar}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Zerando...</> : <><Eraser className="h-4 w-4" /> Zerar Conta</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
