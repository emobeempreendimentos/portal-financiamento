"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { StatsCards } from "@/components/admin/StatsCards";
import { PendenciasModal } from "@/components/admin/PendenciasModal";
import { ClientesModal } from "@/components/admin/ClientesModal";
import { CanceladosPanel } from "@/components/admin/CanceladosPanel";
import { AvaliacoesPanel } from "@/components/admin/AvaliacoesPanel";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { ClientTable } from "@/components/admin/ClientTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { AdminStats, User, Financiamento, Etapa } from "@/types";

interface ClienteComFinanciamento extends User {
  financiamento?: (Financiamento & { etapas: Etapa[] }) | null;
}

interface PendenciaAberta {
  id: string;
  descricao: string;
  criadoEm: string;
  financiamento: {
    id: string;
    user: { id: string; nome: string };
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [clientes, setClientes] = useState<ClienteComFinanciamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendenciasAbertas, setPendenciasAbertas] = useState<PendenciaAberta[]>([]);
  const [loadingPendencias, setLoadingPendencias] = useState(false);
  const [clientesModal, setClientesModal] = useState<{ open: boolean; titulo: string; lista: ClienteComFinanciamento[]; loading: boolean }>({ open: false, titulo: "", lista: [], loading: false });
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, clientesRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/clientes"),
        ]);
        const statsData = await statsRes.json();
        const clientesData = await clientesRes.json();
        setStats(statsData.data);
        setClientes(clientesData.data || []);
      } catch {
        addToast({ title: "Erro ao carregar dados", variant: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePendenciasClick = useCallback(async () => {
    setModalOpen(true);
    setLoadingPendencias(true);
    try {
      const res = await fetch("/api/admin/pendencias/abertas");
      const json = await res.json();
      setPendenciasAbertas(json.data || []);
    } catch {
      addToast({ title: "Erro ao carregar pendências", variant: "error" });
    } finally {
      setLoadingPendencias(false);
    }
  }, []);

  const handleCardClick = useCallback(async (tipo: "todos" | "aprovacao" | "concluidos" | "cancelados") => {
    const titulos = { todos: "Total de Clientes", aprovacao: "Em Aprovação", concluidos: "Concluídos", cancelados: "Processos Cancelados" };
    setClientesModal({ open: true, titulo: titulos[tipo], lista: [], loading: true });

    try {
      if (tipo === "todos") {
        const res = await fetch("/api/admin/relatorio-geral");
        const json = await res.json();
        setClientesModal((p) => ({ ...p, lista: json.data || [], loading: false }));
      } else if (tipo === "aprovacao") {
        const lista = clientes.filter((c) =>
          c.financiamento?.etapas?.some((e) => e.nome === "Aprovação" && e.status === "em_andamento")
        );
        setClientesModal((p) => ({ ...p, lista, loading: false }));
      } else if (tipo === "concluidos") {
        const res = await fetch("/api/admin/cancelados");
        const json = await res.json();
        const lista = (json.data || []).filter((f: { statusGeral: string; user: ClienteComFinanciamento }) => f.statusGeral === "concluido").map((f: { user: ClienteComFinanciamento; statusGeral: string }) => ({ ...f.user, financiamento: f }));
        setClientesModal((p) => ({ ...p, lista, loading: false }));
      } else if (tipo === "cancelados") {
        const res = await fetch("/api/admin/cancelados");
        const json = await res.json();
        const lista = (json.data || []).filter((f: { statusGeral: string; user: ClienteComFinanciamento }) => f.statusGeral === "cancelado").map((f: { user: ClienteComFinanciamento; statusGeral: string }) => ({ ...f.user, financiamento: f }));
        setClientesModal((p) => ({ ...p, lista, loading: false }));
      }
    } catch {
      addToast({ title: "Erro ao carregar clientes", variant: "error" });
      setClientesModal((p) => ({ ...p, loading: false }));
    }
  }, [clientes]);

  function handleDelete(id: string) {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    if (stats) {
      setStats({ ...stats, totalClientes: stats.totalClientes - 1 });
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Visão geral de todos os financiamentos
          </p>
        </div>
        <Link
          href="/admin/relatorio-geral"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <FileBarChart className="h-4 w-4 text-zinc-500" />
          Relatório Geral
        </Link>
      </motion.div>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCards stats={stats} onPendenciasClick={handlePendenciasClick} onCardClick={handleCardClick} />
        </motion.div>
      )}

      <PendenciasModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pendencias={pendenciasAbertas}
        loading={loadingPendencias}
      />

      <ClientesModal
        open={clientesModal.open}
        onClose={() => setClientesModal((p) => ({ ...p, open: false }))}
        titulo={clientesModal.titulo}
        clientes={clientesModal.lista}
        loading={clientesModal.loading}
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DashboardCharts clientes={clientes} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <ClientTable clientes={clientes} onDelete={handleDelete} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <CanceladosPanel />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <AvaliacoesPanel />
      </motion.div>
    </div>
  );
}
