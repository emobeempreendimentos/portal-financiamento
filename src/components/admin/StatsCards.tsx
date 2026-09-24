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
          className={`group relative overflow-hidden rounded-[20px] p-5 shadow-soft ring-1 transition-all ${card.alert ? "bg-red-50 ring-red-200/70 dark:bg-red-950/30 dark:ring-red-900/50" : "bg-white ring-zinc-900/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06]"} ${card.clickable ? "cursor-pointer hover:shadow-xl hover:shadow-zinc-900/[0.06]" : "cursor-default"}`}
        >
          <div className="flex items-start justify-between">
            <div className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight pr-2">{card.label}</div>
            <div className={`h-9 w-9 shrink-0 rounded-xl ${card.color} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
              <card.icon className="h-[18px] w-[18px]" />
            </div>
          </div>
          <div className="mt-4 font-display text-[34px] leading-none font-bold tracking-[-0.04em] text-zinc-950 dark:text-white">
            {card.value === -1 ? "—" : `${card.value}${card.suffix}`}
          </div>
          {card.clickable && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-[#8b682b] dark:group-hover:text-[#d9b06b] transition-colors">
              Ver detalhes <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
