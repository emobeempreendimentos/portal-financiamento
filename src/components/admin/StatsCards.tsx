"use client";

import { motion } from "framer-motion";
import { Users, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { AdminStats } from "@/types";

interface StatsCardsProps {
  stats: AdminStats;
  onPendenciasClick?: () => void;
  onCardClick?: (tipo: "todos" | "aprovacao" | "concluidos" | "cancelados") => void;
}

export function StatsCards({ stats, onPendenciasClick, onCardClick }: StatsCardsProps) {
  const cards = [
    {
      label: "Total de Clientes",
      value: stats.totalClientes,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      suffix: "",
      alert: false,
      clickable: true,
      onClick: () => onCardClick?.("todos"),
    },
    {
      label: "Em Aprovação",
      value: stats.emAprovacao,
      icon: Clock,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      suffix: "",
      alert: false,
      clickable: true,
      onClick: () => onCardClick?.("aprovacao"),
    },
    {
      label: "Concluídos",
      value: stats.concluidos,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      suffix: "",
      alert: false,
      clickable: true,
      onClick: () => onCardClick?.("concluidos"),
    },
    {
      label: "Processos Cancelados",
      value: stats.cancelados,
      icon: XCircle,
      color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      suffix: "",
      alert: false,
      clickable: true,
      onClick: () => onCardClick?.("cancelados"),
    },
    {
      label: "Pendências Abertas",
      value: stats.pendenciasAbertas,
      icon: AlertTriangle,
      color: stats.pendenciasAbertas > 0
        ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      suffix: "",
      alert: stats.pendenciasAbertas > 0,
      clickable: true,
      onClick: onPendenciasClick,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -2 }}
          onClick={card.clickable ? card.onClick : undefined}
          className={`rounded-2xl border p-5 shadow-sm dark:bg-zinc-900 ${card.alert ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10" : "border-zinc-100 bg-white dark:border-zinc-800"} ${card.clickable ? "cursor-pointer hover:shadow-md transition-shadow" : "cursor-default"}`}
        >
          <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
            <card.icon className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {card.value === -1 ? "—" : `${card.value}${card.suffix}`}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{card.label}</div>
          {card.clickable && (
            <p className="text-xs text-zinc-400 mt-1.5">Clique para ver detalhes</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
