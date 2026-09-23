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
        <div className="relative overflow-hidden rounded-[22px] bg-[#16181d] text-white shadow-xl shadow-black/10">
          {/* Foto de fundo com véu escuro, no estilo do hero do site */}
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=70)" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e0f13] via-[#0e0f13]/85 to-[#0e0f13]/30" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#c49e62]/20 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 p-7 md:p-10">
            <div>
              <p className="eyebrow text-[#d9b06b] capitalize">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-normal text-white mt-3 leading-[1.05]">
                Seu painel, <em className="text-[#e4c28c]">em ordem.</em>
              </h1>
              <p className="text-white/70 text-sm md:text-base mt-3 max-w-md">
                Visão geral de todos os financiamentos, clientes e pendências.
              </p>
            </div>
            <Link
              href="/admin/relatorio-geral"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#c49e62] text-sm font-medium text-[#1d1406] hover:bg-[#d4ae70] transition-colors w-fit shrink-0"
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
