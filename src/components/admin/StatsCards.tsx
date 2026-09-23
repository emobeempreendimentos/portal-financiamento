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
      color: "bg-[#16181d] text-[#e4c28c] dark:bg-zinc-800 dark:text-[#d9b06b]",
      suffix: "",
      alert: false,
      clickable: true,
      onClick: () => onCardClick?.("todos"),
    },
    {
      label: "Em Aprovação",
      value: stats.emAprovacao,
      icon: Clock,
      color: "bg-[#f9edd8] text-[#8b682b] dark:bg-[#332710] dark:text-[#d9b06b]",
      suffix: "",
      alert: false,
      clickable: true,
      onClick: () => onCardClick?.("aprovacao"),
    },
    {
      label: "Concluídos",
      value: stats.concluidos,
      icon: CheckCircle2,
      color: "bg-[#dcf7e2] text-[#007938] dark:bg-[#14301c] dark:text-[#4fb772]",
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
        : "bg-[#dcf7e2] text-[#007938] dark:bg-[#14301c] dark:text-[#4fb772]",
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
          whileHover={{ y: -3 }}
          onClick={card.clickable ? card.onClick : undefined}
          className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all dark:bg-zinc-900 ${card.alert ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10" : "border-zinc-200/80 bg-white dark:border-zinc-800"} ${card.clickable ? "cursor-pointer hover:shadow-lg hover:shadow-zinc-900/5 hover:border-zinc-200 dark:hover:border-zinc-700" : "cursor-default"}`}
        >
          <div className={`h-11 w-11 rounded-xl ${card.color} flex items-center justify-center mb-3.5 transition-transform group-hover:scale-105`}>
            <card.icon className="h-5 w-5" />
          </div>
          <div className="font-display text-[34px] leading-none font-normal tracking-tight text-zinc-900 dark:text-white">
            {card.value === -1 ? "—" : `${card.value}${card.suffix}`}
          </div>
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1.5">{card.label}</div>
          {card.clickable && (
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalhes <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
