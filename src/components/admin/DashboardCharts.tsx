"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
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
  "Concluído":    "#3b82f6",
  "Pausado":      "#f59e0b",
};

const ETAPA_COLOR = "#22c55e";

const ETAPAS_ORDEM = [
  "Aprovação",
  "Aprovação Engenharia",
  "Assinatura de Contrato",
  "ITBI",
  "Registro",
  "Entrega das Chaves",
];

export function DashboardCharts({ clientes }: DashboardChartsProps) {
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
    .map((nome) => ({ nome: nome.length > 14 ? nome.slice(0, 13) + "…" : nome, nomeCompleto: nome, clientes: etapaCount[nome] ?? 0 }))
    .filter((d) => d.clientes > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Status Pie */}
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-4">Distribuição por Status</h3>
        {pieData.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Sem dados</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} cliente${value > 1 ? "s" : ""}`, name]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Etapa Bar */}
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-4">Clientes por Etapa Atual</h3>
        {barData.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Nenhuma etapa em andamento</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(value: number) => [`${value} cliente${value > 1 ? "s" : ""}`, "Clientes"]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.nomeCompleto ?? label}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Bar dataKey="clientes" fill={ETAPA_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
