"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ListTodo, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { TarefaCard } from "@/components/admin/TarefaCard";
import { TarefaModal } from "@/components/admin/TarefaModal";
import { ORDENACOES, STATUS_LABEL, Tarefa, notificarMudancaTarefas } from "@/lib/tarefas";

const FILTROS = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluídas" },
];

export default function TarefasPage() {
  const { addToast } = useToast();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todas");
  const [busca, setBusca] = useState("");
  const [ordenar, setOrdenar] = useState("recente");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Tarefa | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filtro, ordenar, page: String(page) });
      if (busca.trim()) params.set("busca", busca.trim());
      const res = await fetch(`/api/admin/tarefas?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTarefas(json.data || []);
      setTotalPages(json.paginacao?.totalPages ?? 1);
      setTotal(json.paginacao?.total ?? 0);
    } catch {
      addToast({ title: "Erro ao carregar tarefas", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [filtro, ordenar, page, busca]);

  // Debounce na busca; recarrega imediatamente nas demais mudanças
  useEffect(() => {
    const t = setTimeout(carregar, busca ? 300 : 0);
    return () => clearTimeout(t);
  }, [carregar, busca]);

  // Volta para a primeira página ao mudar filtro/busca/ordenação
  useEffect(() => { setPage(1); }, [filtro, busca, ordenar]);

  function abrirNova() {
    setEditando(null);
    setModalOpen(true);
  }

  function abrirEdicao(t: Tarefa) {
    setEditando(t);
    setModalOpen(true);
  }

  async function alterarStatus(t: Tarefa, status: string) {
    // Atualização otimista
    setTarefas((p) => p.map((x) => (x.id === t.id ? { ...x, status } : x)));
    try {
      const res = await fetch(`/api/admin/tarefas/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      notificarMudancaTarefas();
      carregar();
    } catch {
      addToast({ title: "Erro ao atualizar status", variant: "error" });
      carregar();
    }
  }

  async function excluir(t: Tarefa) {
    if (!confirm(`Excluir a tarefa "${t.titulo}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/tarefas/${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast({ title: "Tarefa excluída", variant: "success" });
      notificarMudancaTarefas();
      carregar();
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  const selectCls =
    "rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Lista de Tarefas</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Gerencie suas pendências e organize suas atividades.
          </p>
        </div>
        <button onClick={abrirNova}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="h-4 w-4" />Nova Tarefa
        </button>
      </motion.div>

      {/* Filtros de status */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl w-fit overflow-x-auto max-w-full">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filtro === f.value
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Busca e ordenação */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por título ou descrição…"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select value={ordenar} onChange={(e) => setOrdenar(e.target.value)} className={selectCls}>
          {ORDENACOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : tarefas.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-16 flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {busca || filtro !== "todas"
              ? "Nenhuma tarefa encontrada com esses filtros"
              : "Nenhuma tarefa cadastrada ainda"}
          </p>
          {!busca && filtro === "todas" && (
            <button onClick={abrirNova} className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium">
              + Criar primeira tarefa
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tarefas.map((t, i) => (
              <TarefaCard
                key={t.id}
                tarefa={t}
                index={i}
                onEditar={abrirEdicao}
                onAlterarStatus={alterarStatus}
                onExcluir={excluir}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-zinc-400">
                {total} tarefa{total !== 1 ? "s" : ""}
                {filtro !== "todas" ? ` · ${STATUS_LABEL[filtro] ?? filtro}` : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TarefaModal
        open={modalOpen}
        tarefa={editando}
        onClose={() => setModalOpen(false)}
        onSaved={carregar}
      />
    </div>
  );
}
