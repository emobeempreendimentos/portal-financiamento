"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { StatsCards } from "@/components/admin/StatsCards";
import { TarefasPendentesCard } from "@/components/admin/TarefasPendentesCard";
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-green-700 to-green-900 text-white shadow-lg shadow-green-900/15 p-6 md:p-8">
          {/* Elementos decorativos */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-12 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-green-100/90 capitalize">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-0.5">Dashboard</h1>
              <p className="text-green-100/80 text-sm mt-1">
                Visão geral de todos os financiamentos
              </p>
            </div>
            <Link
              href="/admin/relatorio-geral"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-sm font-semibold text-white hover:bg-white/25 transition-colors w-fit"
            >
              <FileBarChart className="h-4 w-4" />
              Relatório Geral
            </Link>
          </div>
        </div>
      </motion.div>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCards stats={stats} onPendenciasClick={handlePendenciasClick} onCardClick={handleCardClick} />
        </motion.div>
      )}

      <TarefasPendentesCard />

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
