"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Hourglass } from "lucide-react";
import {
  PROCESSOS_CHANGED_EVENT, Processo, fmtProtocolo, lerLimiteParado, processosParados,
} from "@/lib/processos";

export function ProcessosParadosCard() {
  const [processos, setProcessos] = useState<Processo[] | null>(null);
  const [limite, setLimite] = useState(7);

  const carregar = useCallback(async () => {
    setLimite(lerLimiteParado());
    try {
      const res = await fetch("/api/admin/processos");
      const json = await res.json();
      if (json.success) setProcessos(json.data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    carregar();
    window.addEventListener(PROCESSOS_CHANGED_EVENT, carregar);
    return () => window.removeEventListener(PROCESSOS_CHANGED_EVENT, carregar);
  }, [carregar]);

  if (!processos) return null;

  const parados = processosParados(processos, limite);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-[20px] bg-white dark:bg-zinc-900 shadow-soft ring-1 ring-zinc-900/[0.04] dark:ring-white/[0.06] p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${parados.length > 0 ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-[#dcf7e2] text-[#007938] dark:bg-[#14301c] dark:text-[#4fb772]"}`}>
            {parados.length > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Processos Parados</h3>
            <p className="text-xs text-zinc-400">Sem movimentação há {limite}+ dias</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{parados.length}</span>
      </div>

      {parados.length === 0 ? (
        <p className="text-xs text-zinc-400 mb-4 flex-1">Todos os processos estão andando. 👏</p>
      ) : (
        <div className="space-y-1.5 mb-4 flex-1">
          {parados.slice(0, 4).map((p) => (
            <Link
              key={p.financiamentoId}
              href={`/admin/clientes/${p.userId}`}
              className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{p.nome}</p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {p.etapaAtual?.nome ?? "—"} · {fmtProtocolo(p.protocolo)}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/25 dark:text-red-400">
                <Hourglass className="h-3 w-3" />
                {p.dias}d
              </span>
            </Link>
          ))}
          {parados.length > 4 && (
            <p className="px-1 text-[11px] text-zinc-400">+ {parados.length - 4} outro{parados.length - 4 !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}

      <Link
        href="/admin/processos"
        className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        Abrir quadro de processos <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  );
}
