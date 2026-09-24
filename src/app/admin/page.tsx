"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileBarChart, UserPlus, ArrowUpRight } from "lucide-react";
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

  const hojeRaw = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const hojeExtenso = hojeRaw.charAt(0).toUpperCase() + hojeRaw.slice(1);

  const taxaConclusao = stats && stats.totalClientes > 0
    ? Math.round((stats.concluidos / stats.totalClientes) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-[28px] bg-mesh-dark text-white shadow-2xl shadow-black/10 ring-1 ring-black/5">
          <div className="pointer-events-none absolute inset-0 bg-grid-faint" />

          <div className="relative grid gap-8 p-7 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1 text-xs font-medium text-white/75 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c49e62] animate-pulse" />
                {hojeExtenso}
              </span>
              <h1 className="mt-5 text-4xl md:text-[52px] font-extrabold leading-[1.02] tracking-[-0.04em]">
                Dashboard
                <span className="block bg-gradient-to-r from-[#f2dbb6] via-[#c49e62] to-[#d6612f] bg-clip-text text-transparent">
                  financiamentos
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm md:text-[15px] text-white/60">
                Visão geral de todos os processos, clientes e pendências em um só lugar.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href="/admin/clientes/novo"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c49e62] px-5 py-3 text-sm font-semibold text-[#1d1406] shadow-lg shadow-[#c49e62]/25 transition-all hover:bg-[#d4ae70] hover:-translate-y-0.5"
                >
                  <UserPlus className="h-4 w-4" />
                  Novo cliente
                </Link>
                <Link
                  href="/admin/relatorio-geral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm transition-all hover:bg-white/[0.14]"
                >
                  <FileBarChart className="h-4 w-4" />
                  Relatório geral
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-3 lg:w-[300px]">
                <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Clientes</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight">{stats.totalClientes}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Concluídos</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight">{stats.concluidos}</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Taxa de conclusão</p>
                    <p className="font-display text-sm font-bold text-[#e4c28c]">{taxaConclusao}%</p>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#e4c28c] to-[#c49e62]"
                      initial={{ width: 0 }}
                      animate={{ width: `${taxaConclusao}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>
            )}
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
