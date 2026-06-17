"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AvaliacaoComCliente } from "@/types";

interface Meta {
  total: number;
  media: number;
  recomendariam: number;
}

function Stars({ nota, size = "sm" }: { nota: number; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={h}
          style={{
            fill: i <= nota ? "#f59e0b" : "transparent",
            color: i <= nota ? "#f59e0b" : "#d4d4d8",
          }}
        />
      ))}
    </span>
  );
}

export function AvaliacoesPanel() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComCliente[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/avaliacoes");
        const json = await res.json();
        if (res.ok) {
          setAvaliacoes(json.data || []);
          setMeta(json.meta || null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!meta || meta.total === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Avaliações de Clientes</h2>
        </div>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Nenhuma avaliação recebida ainda. As avaliações aparecem quando clientes concluem o processo.
        </p>
      </div>
    );
  }

  const npsPercent = Math.round((meta.recomendariam / meta.total) * 100);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Avaliações de Clientes</h2>
        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">{meta.total} {meta.total === 1 ? "avaliação" : "avaliações"}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{meta.media.toFixed(1)}</p>
          <Stars nota={Math.round(meta.media)} size="sm" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Nota média</p>
        </div>
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{npsPercent}%</p>
          <div className="flex items-center justify-center mt-1">
            <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Recomendariam</p>
        </div>
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{meta.total}</p>
          <div className="flex items-center justify-center mt-1">
            <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Total</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {avaliacoes.map((av, i) => (
          <motion.div
            key={av.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {av.financiamento.user.nome}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                  {av.financiamento.user.email}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Stars nota={av.nota} />
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    av.recomendaria
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  {av.recomendaria
                    ? <><ThumbsUp className="h-3 w-3" /> Recomenda</>
                    : <><ThumbsDown className="h-3 w-3" /> Não recomenda</>
                  }
                </span>
              </div>
            </div>

            {av.comentario && (
              <div className="flex gap-2 pt-1">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                  "{av.comentario}"
                </p>
              </div>
            )}

            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 pt-0.5">
              {new Date(av.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
