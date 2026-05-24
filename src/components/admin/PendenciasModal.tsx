"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Timer, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface PendenciaAberta {
  id: string;
  descricao: string;
  criadoEm: string;
  financiamento: {
    id: string;
    user: { id: string; nome: string };
  };
}

interface PendenciasModalProps {
  open: boolean;
  onClose: () => void;
  pendencias: PendenciaAberta[];
  loading: boolean;
}

function formatarDuracao(inicio: string): string {
  const diff = Date.now() - new Date(inicio).getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos}min`;
  return `${minutos}min`;
}

function formatarData(data: string): string {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function PendenciasModal({ open, onClose, pendencias, loading }: PendenciasModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fechar com Esc
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Bloquear scroll do body
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-white text-sm">
                    Pendências em Aberto
                  </h2>
                  {!loading && (
                    <p className="text-xs text-zinc-400">
                      {pendencias.length === 0
                        ? "Nenhuma pendência"
                        : `${pendencias.length} pendência${pendencias.length > 1 ? "s" : ""}`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  ))}
                </div>
              ) : pendencias.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400 opacity-60" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Tudo certo!
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Não há pendências em aberto no momento.
                  </p>
                </div>
              ) : (
                pendencias.map((p) => (
                  <div
                    key={p.id}
                    className="flex gap-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-4"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {/* Cliente */}
                      <Link
                        href={`/admin/clientes/${p.financiamento.user.id}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1"
                      >
                        {p.financiamento.user.nome}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      {/* Descrição */}
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">
                        {p.descricao}
                      </p>
                      {/* Datas */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {formatarData(p.criadoEm)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                          <Timer className="h-3 w-3" />
                          Em aberto há {formatarDuracao(p.criadoEm)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
