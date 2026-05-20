"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatsCards } from "@/components/admin/StatsCards";
import { ClientTable } from "@/components/admin/ClientTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { AdminStats, User, Financiamento, Etapa } from "@/types";

interface ClienteComFinanciamento extends User {
  financiamento?: (Financiamento & { etapas: Etapa[] }) | null;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [clientes, setClientes] = useState<ClienteComFinanciamento[]>([]);
  const [loading, setLoading] = useState(true);
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

  function handleDelete(id: string) {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    if (stats) {
      setStats({ ...stats, totalClientes: stats.totalClientes - 1 });
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
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
          <StatsCards stats={stats} />
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ClientTable clientes={clientes} onDelete={handleDelete} />
      </motion.div>
    </div>
  );
}
