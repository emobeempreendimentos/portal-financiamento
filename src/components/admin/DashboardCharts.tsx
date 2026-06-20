"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { User, Financiamento, Etapa } from "@/types";

interface ClienteComFinanciamento extends User {
  financiamento?: (Financiamento & { etapas: Etapa[] }) | null;
}

interface DashboardChartsProps {
  clientes: ClienteComFinanciamento[];
}

const STATUS_COLORS: Record<string, string> = {
  "Em Andamento": "#22c55e",
  "Concluído":    "#16a34a",
  "Pausado":      "#f59e0b",
};

const ETAPAS_ORDEM = [
  "Aprovação",
  "Aprovação Engenharia",
  "Assinatura de Contrato",
  "ITBI",
  "Registro",
  "Entrega das Chaves",
];

export function DashboardCharts({ clientes }: DashboardChartsProps) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (clientes.length === 0) return null;

  // Status distribution
  const statusCount: Record<string, number> = {
    "Em Andamento": 0,
    "Concluído": 0,
    "Pausado": 0,
  };
  clientes.forEach((c) => {
    const s = c.financiamento?.statusGeral;
    if (s === "em_andamento") statusCount["Em Andamento"]++;
    else if (s === "concluido") statusCount["Concluído"]++;
    else if (s === "pausado") statusCount["Pausado"]++;
  });
  const pieData = Object.entries(statusCount)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Etapa distribution — how many clients are currently at each stage
  const etapaCount: Record<string, number> = {};
  ETAPAS_ORDEM.forEach((e) => (etapaCount[e] = 0));
  clientes.forEach((c) => {
    const etapaAtiva = c.financiamento?.etapas.find((e) => e.status === "em_andamento");
    if (etapaAtiva) {
      const nome = etapaAtiva.nome;
      etapaCount[nome] = (etapaCount[nome] ?? 0) + 1;
    }
  });
  const barData = ETAPAS_ORDEM
    .map((nome) => ({ nome: nome.length > 14 ? nome.slice(0, 13) + "…" : nome, clientes: etapaCount[nome] ?? 0 }))
    .filter((d) => d.clientes > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Status Pie */}
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">Distribuição por Status</h3>
        {pieData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-lg text-zinc-300">—</span>
            </div>
            <p className="text-sm text-zinc-400">Nenhum cliente ainda</p>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-3">
              {pieData.map((entry) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLORS[entry.name] ?? "#94a3b8" }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} cliente${Number(value) > 1 ? "s" : ""}`, ""]}
                  contentStyle={{ borderRadius: 10, border: "none", background: isDark ? "#18181b" : "#fff", color: isDark ? "#fff" : "#18181b", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Etapa Bar */}
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-4">Clientes por Etapa Atual</h3>
        {barData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-lg text-zinc-300">—</span>
            </div>
            <p className="text-sm text-zinc-400">Nenhuma etapa em andamento</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f1f5f9"} vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#71717a" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${value} cliente${Number(value) > 1 ? "s" : ""}`, "Clientes"]}
                contentStyle={{ borderRadius: 10, border: "none", background: isDark ? "#18181b" : "#fff", color: isDark ? "#fff" : "#18181b", fontSize: 12 }}
                cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="clientes" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
