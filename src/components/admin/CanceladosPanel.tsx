"use client";

import { useState, useEffect } from "react";
import { XCircle, CheckCircle2, ChevronRight, Calendar, Archive } from "lucide-react";
import Link from "next/link";

interface EncerradoItem {
  id: string;
  statusGeral: string;
  motivoCancelamento: string | null;
  updatedAt: string;
  user: { id: string; nome: string; email: string };
}

export function CanceladosPanel() {
  const [encerrados, setEncerrados] = useState<EncerradoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"concluido" | "cancelado">("concluido");

  useEffect(() => {
    fetch("/api/admin/cancelados")
      .then((r) => r.json())
      .then((d) => {
        const data = d.data || [];
        setEncerrados(data);
        // Abre na aba que tiver itens
        if (data.some((i: EncerradoItem) => i.statusGeral === "concluido")) {
          setAbaAtiva("concluido");
        } else {
          setAbaAtiva("cancelado");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || encerrados.length === 0) return null;

  const concluidos = encerrados.filter((e) => e.statusGeral === "concluido");
  const cancelados = encerrados.filter((e) => e.statusGeral === "cancelado");
  const lista = abaAtiva === "concluido" ? concluidos : cancelados;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Archive className="h-4 w-4 text-zinc-500" />
        <h2 className="font-semibold text-zinc-900 dark:text-white">Processos Encerrados</h2>
        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold">
          {encerrados.length}
        </span>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        <button
          onClick={() => setAbaAtiva("concluido")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            abaAtiva === "concluido"
              ? "bg-green-500 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Concluídos
          <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-xs font-bold ${
            abaAtiva === "concluido" ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          }`}>
            {concluidos.length}
          </span>
        </button>

        <button
          onClick={() => setAbaAtiva("cancelado")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            abaAtiva === "cancelado"
              ? "bg-red-500 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancelados
          <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-xs font-bold ${
            abaAtiva === "cancelado" ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          }`}>
            {cancelados.length}
          </span>
        </button>
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-4">Nenhum processo nesta categoria</p>
      ) : (
        <div className="space-y-2">
          {lista.map((item) => {
            const isConcluido = item.statusGeral === "concluido";
            return (
              <Link key={item.id} href={`/admin/clientes/${item.user.id}`}>
                <div className={`flex items-center gap-3 rounded-xl border p-4 transition-colors cursor-pointer group ${
                  isConcluido
                    ? "border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20"
                    : "border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20"
                }`}>
                  {/* Ícone */}
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isConcluido ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                  }`}>
                    {isConcluido
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <XCircle className="h-4 w-4 text-red-500" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                      {item.user.nome}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {item.user.email}
                    </p>
                    {!isConcluido && item.motivoCancelamento && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        <span className="font-medium">Motivo:</span> {item.motivoCancelamento}
                      </p>
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs mt-1 ${
                      isConcluido ? "text-green-500" : "text-red-400"
                    }`}>
                      <Calendar className="h-3 w-3" />
                      {isConcluido ? "Concluído" : "Cancelado"} em {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${
                    isConcluido
                      ? "text-zinc-300 group-hover:text-green-400"
                      : "text-zinc-300 group-hover:text-red-400"
                  }`} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
