"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Loader2, FileCheck, Wrench,
  PenLine, Receipt, BookOpen, KeyRound,
} from "lucide-react";
import { cn, formatDate, daysSince, daysBetween, getStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Etapa, EtapaStatus } from "@/types";

const etapaIcons: Record<string, React.ElementType> = {
  "Aprovação": FileCheck,
  "Aprovação Engenharia": Wrench,
  "Assinatura de Contrato": PenLine,
  "ITBI": Receipt,
  "Registro": BookOpen,
  "Entrega das Chaves": KeyRound,
};

function getStatusConfig(status: EtapaStatus) {
  switch (status) {
    case "concluido":
      return {
        icon: CheckCircle2,
        dotClass: "bg-green-500 shadow-[0_0_12px_#4ade8060]",
        lineClass: "bg-green-500",
        badge: "success" as const,
      };
    case "em_andamento":
      return {
        icon: Loader2,
        dotClass: "bg-blue-500 animate-pulse",
        lineClass: "bg-gradient-to-b from-blue-500 to-zinc-200",
        badge: "info" as const,
      };
    default:
      return {
        icon: Clock,
        dotClass: "bg-zinc-200 dark:bg-zinc-700",
        lineClass: "bg-zinc-200 dark:bg-zinc-700",
        badge: "secondary" as const,
      };
  }
}

interface TimelineProps {
  etapas: Etapa[];
}

export function Timeline({ etapas }: TimelineProps) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
        Timeline do Financiamento
      </h2>

      <div className="relative">
        {etapas.map((etapa, index) => {
          const config = getStatusConfig(etapa.status);
          const EtapaIcon = etapaIcons[etapa.nome] || FileCheck;
          const StatusIcon = config.icon;
          const isLast = index === etapas.length - 1;
          const diasNaEtapa = etapa.status === "concluido"
            ? daysBetween(etapa.dataInicio, etapa.dataConclusao)
            : etapa.status === "em_andamento"
            ? daysSince(etapa.dataInicio)
            : null;

          return (
            <motion.div
              key={etapa.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {/* Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[19px] top-10 w-0.5 h-full -mb-8",
                    config.lineClass
                  )}
                />
              )}

              {/* Dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                    config.dotClass
                  )}
                >
                  <EtapaIcon className={cn(
                    "h-4 w-4",
                    etapa.status === "concluido" ? "text-white" :
                    etapa.status === "em_andamento" ? "text-white" :
                    "text-zinc-400 dark:text-zinc-500"
                  )} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <motion.div
                  whileHover={{ y: -1 }}
                  className={cn(
                    "rounded-2xl border p-4 transition-all duration-200",
                    etapa.status === "concluido"
                      ? "border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10"
                      : etapa.status === "em_andamento"
                      ? "border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10 shadow-sm"
                      : "border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className={cn(
                        "font-semibold text-sm truncate",
                        etapa.status === "concluido" ? "text-green-800 dark:text-green-300" :
                        etapa.status === "em_andamento" ? "text-blue-800 dark:text-blue-300" :
                        "text-zinc-500 dark:text-zinc-400"
                      )}>
                        {etapa.nome}
                      </h3>
                      <span className="text-xs text-zinc-400 shrink-0">#{etapa.ordem}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={config.badge} className="text-xs">
                        <StatusIcon className={cn("h-3 w-3 mr-1", etapa.status === "em_andamento" && "animate-spin")} />
                        {getStatusLabel(etapa.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {etapa.dataInicio && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Início: {formatDate(etapa.dataInicio)}
                      </span>
                    )}
                    {etapa.dataConclusao && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Concluído: {formatDate(etapa.dataConclusao)}
                      </span>
                    )}
                    {diasNaEtapa !== null && diasNaEtapa >= 0 && (
                      <span className="flex items-center gap-1 font-medium">
                        {etapa.status === "concluido" ? `${diasNaEtapa} dia(s) nesta etapa` : `${diasNaEtapa} dia(s) em andamento`}
                      </span>
                    )}
                  </div>

                  {etapa.observacoes && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                      {etapa.observacoes}
                    </p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
