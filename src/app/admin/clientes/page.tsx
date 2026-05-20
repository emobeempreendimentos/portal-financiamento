"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClientTable } from "@/components/admin/ClientTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { User, Financiamento, Etapa } from "@/types";

interface ClienteComFinanciamento extends User {
  financiamento?: (Financiamento & { etapas: Etapa[] }) | null;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteComFinanciamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((d) => setClientes(d.data || []))
      .catch(() => addToast({ title: "Erro ao carregar clientes", variant: "error" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Clientes</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Gerencie todos os clientes e seus financiamentos
        </p>
      </motion.div>

      <ClientTable
        clientes={clientes}
        onDelete={(id) => setClientes((prev) => prev.filter((c) => c.id !== id))}
      />
    </div>
  );
}
