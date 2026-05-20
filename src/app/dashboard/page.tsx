"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Timeline } from "@/components/dashboard/Timeline";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { ClientInfo } from "@/components/dashboard/ClientInfo";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { calcularProgresso } from "@/lib/utils";
import { User, Financiamento, Etapa, Historico } from "@/types";

interface DashboardData extends User {
  financiamento: (Financiamento & {
    etapas: Etapa[];
    historico: Historico[];
  }) | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Erro ao carregar dados");
        const json = await res.json();
        setData(json.data);
      } catch {
        addToast({ title: "Erro ao carregar dados", variant: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpdateUser(updates: Partial<User>) {
    if (!data) return;
    const res = await fetch(`/api/clientes/${data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Erro ao salvar");
    const json = await res.json();
    setData((prev) => prev ? { ...prev, ...json.data } : prev);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="h-16 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const etapas = data.financiamento?.etapas || [];
  const progresso = calcularProgresso(etapas);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header
        user={data}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ClientInfo user={data} onUpdate={handleUpdateUser} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ProgressBar progresso={progresso} />
        </motion.div>

        {etapas.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Timeline etapas={etapas} />
          </motion.div>
        )}
      </main>
    </div>
  );
}
