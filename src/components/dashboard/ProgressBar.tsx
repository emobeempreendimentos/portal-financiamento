"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface ProgressBarProps {
  progresso: number;
}

export function ProgressBar({ progresso }: ProgressBarProps) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Progresso do Financiamento</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Acompanhe o andamento das etapas</p>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="text-right"
        >
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{progresso}</span>
          <span className="text-lg font-semibold text-zinc-400">%</span>
        </motion.div>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progresso}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 relative"
        >
          {progresso > 0 && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-white/20" />
          )}
        </motion.div>
      </div>

      <div className="mt-3 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
        <span>Início</span>
        <span className="font-medium text-green-600 dark:text-green-400">
          {progresso === 100 ? "Concluído!" : `${progresso}% concluído`}
        </span>
        <span>Entrega das Chaves</span>
      </div>

      {progresso === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center"
        >
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            🎉 Parabéns! Seu financiamento foi concluído com sucesso!
          </p>
        </motion.div>
      )}
    </div>
  );
}
