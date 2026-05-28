"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { StatsCards } from "@/components/admin/StatsCards";
import { PendenciasModal } from "@/components/admin/PendenciasModal";
import { CanceladosPanel } from "@/components/admin/CanceladosPanel";
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Visão geral de todos os financiamentos
        </p>
      </motion.div>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCards stats={stats} onPendenciasClick={handlePendenciasClick} />
        </motion.div>
      )}

      <PendenciasModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pendencias={pendenciasAbertas}
        loading={loadingPendencias}
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ClientTable clientes={clientes} onDelete={handleDelete} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <CanceladosPanel />
      </motion.div>
    </div>
  );
}
