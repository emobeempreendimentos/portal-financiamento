"use client";

import { motion } from "framer-motion";
import { Users, Clock, CheckCircle2, Timer } from "lucide-react";
import { AdminStats } from "@/types";

interface StatsCardsProps {
  stats: AdminStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total de Clientes",
      value: stats.totalClientes,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      suffix: "",
    },
    {
      label: "Em Aprovação",
      value: stats.emAprovacao,
      icon: Clock,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      suffix: "",
    },
    {
      label: "Concluídos",
      value: stats.concluidos,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      suffix: "",
    },
    {
      label: "Tempo Médio",
      value: stats.tempoMedioDias,
      icon: Timer,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      suffix: " dias",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -2, shadow: "lg" }}
          className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 cursor-default"
        >
          <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
            <card.icon className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {card.value}{card.suffix}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
