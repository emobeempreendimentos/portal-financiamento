"use client";

import { useState, useEffect } from "react";
import { XCircle, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

interface CanceladoItem {
  id: string;
  motivoCancelamento: string | null;
  updatedAt: string;
  user: { id: string; nome: string; email: string };
}

export function CanceladosPanel() {
  const [cancelados, setCancelados] = useState<CanceladoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cancelados")
      .then((r) => r.json())
      .then((d) => setCancelados(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading || cancelados.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-white dark:bg-zinc-900 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <XCircle className="h-4 w-4 text-red-500" />
        <h2 className="font-semibold text-zinc-900 dark:text-white">Processos Cancelados</h2>
        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
          {cancelados.length}
        </span>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {cancelados.map((item) => (
          <Link key={item.id} href={`/admin/clientes/${item.user.id}`}>
            <div className="flex items-center gap-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer group">
              <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                  {item.user.nome}
                </p>
                {item.motivoCancelamento ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">Motivo:</span>{" "}
                    {item.motivoCancelamento}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 mt-0.5 italic">Sem justificativa informada</p>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-red-400 mt-1">
                  <Calendar className="h-3 w-3" />
                  Cancelado em {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0 group-hover:text-red-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
