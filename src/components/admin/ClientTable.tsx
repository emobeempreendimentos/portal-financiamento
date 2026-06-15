"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, Trash2, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { calcularProgresso, formatDate, getInitials } from "@/lib/utils";
import { User, Financiamento, Etapa } from "@/types";

function diasSemMovimento(updatedAt?: string | null): number {
  if (!updatedAt) return 999;
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
}

function corAtividade(dias: number) {
  if (dias <= 5)  return { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" };
  if (dias <= 10) return { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" };
  return           { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" };
}

interface ClienteComFinanciamento extends User {
  financiamento?: (Financiamento & { etapas: Etapa[] }) | null;
}

interface ClientTableProps {
  clientes: ClienteComFinanciamento[];
  onDelete: (id: string) => void;
}

export function ClientTable({ clientes, onDelete }: ClientTableProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = clientes.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.cpf || "").includes(search);
    const matchStatus =
      statusFiltro === "todos" ||
      c.financiamento?.statusGeral === statusFiltro ||
      (statusFiltro === "sem_processo" && !c.financiamento);
    return matchSearch && matchStatus;
  });

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clientes/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(deleteId);
      addToast({ title: "Cliente excluído", variant: "success" });
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            Todos os Clientes <span className="text-zinc-400 font-normal text-sm">({filtered.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar por nome, email, CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            {/* Filtros de status */}
            {[
              { value: "todos",        label: "Todos" },
              { value: "em_andamento", label: "Em Andamento" },
              { value: "concluido",    label: "Concluído" },
              { value: "pausado",      label: "Pausado" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFiltro(f.value)}
                className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  statusFiltro === f.value
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent"
                    : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                }`}
              >
                {f.label}
              </button>
            ))}
            <Button variant="neon" size="sm" onClick={() => router.push("/admin/clientes/novo")}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Novo
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-zinc-400 text-sm">Nenhum cliente encontrado</p>
              </div>
            ) : (
              filtered.map((cliente, i) => {
                const progresso = cliente.financiamento
                  ? calcularProgresso(cliente.financiamento.etapas)
                  : 0;
                const etapaAtual = cliente.financiamento?.etapas.find(
                  (e) => e.status === "em_andamento"
                )?.nome || (progresso === 100 ? "Concluído" : "Não iniciado");
                const statusAtivo = ["em_andamento", "pausado"].includes(
                  cliente.financiamento?.statusGeral || ""
                );
                const dias = statusAtivo ? diasSemMovimento(cliente.financiamento?.updatedAt) : null;
                const cor = dias !== null ? corAtividade(dias) : null;

                return (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {getInitials(cliente.nome)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                          {cliente.nome}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{cliente.email}</p>
                    </div>

                    {/* Progress */}
                    <div className="hidden sm:flex flex-col items-center gap-1 w-24">
                      <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-green-500 transition-all"
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{progresso}%</span>
                    </div>

                    {/* Etapa atual */}
                    <div className="hidden md:block w-36">
                      <Badge variant={progresso === 100 ? "success" : "info"} className="text-xs">
                        {etapaAtual}
                      </Badge>
                    </div>

                    {/* Atividade */}
                    {cor && dias !== null && (
                      <span
                        style={{ backgroundColor: cor.bg, color: cor.text }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                        title={`${dias} dia${dias !== 1 ? "s" : ""} sem movimentação`}
                      >
                        <span style={{ backgroundColor: cor.dot }} className="h-1.5 w-1.5 rounded-full shrink-0" />
                        {dias}d
                      </span>
                    )}

                    {/* Data */}
                    <div className="hidden lg:block text-xs text-zinc-400 w-24 text-right">
                      {formatDate(cliente.createdAt)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/admin/clientes/${cliente.id}`)}
                      >
                        <Eye className="h-4 w-4 text-zinc-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-red-500"
                        onClick={() => setDeleteId(cliente.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do financiamento serão removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
