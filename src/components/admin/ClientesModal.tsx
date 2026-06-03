"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { getInitials, calcularProgresso } from "@/lib/utils";
import { User, Financiamento, Etapa } from "@/types";

interface ClienteItem extends User {
  financiamento?: (Financiamento & { etapas: Etapa[] }) | null;
}

interface ClientesModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  clientes: ClienteItem[];
  loading: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  pausado: "Pausado",
  cancelado: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  em_andamento: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  concluido:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pausado:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelado:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ClientesModal({ open, onClose, titulo, clientes, loading }: ClientesModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
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
                <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-white text-sm">{titulo}</h2>
                  {!loading && (
                    <p className="text-xs text-zinc-400">
                      {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
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
            <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ))
              ) : clientes.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                  <p className="text-sm text-zinc-500">Nenhum cliente encontrado</p>
                </div>
              ) : (
                clientes.map((c) => {
                  const etapas = c.financiamento?.etapas || [];
                  const progresso = calcularProgresso(etapas);
                  const etapaAtual = etapas.find((e) => e.status === "em_andamento")?.nome;
                  const status = c.financiamento?.statusGeral || "em_andamento";

                  return (
                    <Link key={c.id} href={`/admin/clientes/${c.id}`} onClick={onClose}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group cursor-pointer">
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {getInitials(c.nome)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">{c.nome}</p>
                          <p className="text-xs text-zinc-400 truncate">{c.email}</p>
                          {etapas.length > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                <div
                                  className="h-1 rounded-full bg-green-500"
                                  style={{ width: `${progresso}%` }}
                                />
                              </div>
                              <span className="text-xs text-zinc-400 shrink-0">{progresso}%</span>
                            </div>
                          )}
                        </div>

                        {/* Status / Etapa */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status] || STATUS_COLOR.em_andamento}`}>
                            {STATUS_LABEL[status] || status}
                          </span>
                          {etapaAtual && (
                            <span className="text-xs text-zinc-400 max-w-24 truncate text-right">{etapaAtual}</span>
                          )}
                        </div>

                        <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0 group-hover:text-zinc-500 transition-colors" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
