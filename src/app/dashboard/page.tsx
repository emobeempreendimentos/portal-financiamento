"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { ClientInfo } from "@/components/dashboard/ClientInfo";
import { InteracoesPanel } from "@/components/dashboard/InteracoesPanel";
import { CelebrationOverlay } from "@/components/dashboard/CelebrationOverlay";
import { SatisfactionSurvey } from "@/components/dashboard/SatisfactionSurvey";
import { DocumentosPanel } from "@/components/admin/DocumentosPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { calcularProgresso, daysBetween, daysSince, cn } from "@/lib/utils";
import { User, Financiamento, Etapa, Historico } from "@/types";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  CheckCircle2, Loader2, FileCheck, Wrench, PenLine,
  Receipt, BookOpen, KeyRound, Building, Clock, Hash,
} from "lucide-react";

interface DashboardData extends User {
  financiamento: (Financiamento & {
    etapas: Etapa[];
    historico: Historico[];
  }) | null;
}

const ETAPA_ICONS: Record<string, React.ElementType> = {
  "Aprovação": FileCheck,
  "Aprovação Engenharia": Wrench,
  "Assinatura de Contrato": PenLine,
  "ITBI": Receipt,
  "Registro": BookOpen,
  "Entrega das Chaves": KeyRound,
};

const NOME_ABREV: Record<string, string> = {
  "Aprovação Engenharia": "Apr. Eng.",
  "Assinatura de Contrato": "Contrato",
  "Entrega das Chaves": "Entrega",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [bloqueio, setBloqueio] = useState<{
    tipo: "cancelado" | "expirado";
    motivo?: string | null;
    concluidoEm?: string;
  } | null>(null);
  const [novasEtapas, setNovasEtapas] = useState<Etapa[]>([]);
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);
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
        const json = await res.json();
        if (!res.ok || json.bloqueio) {
          setBloqueio({
            tipo: json.bloqueio,
            motivo: json.motivo ?? null,
            concluidoEm: json.concluidoEm,
          });
          return;
        }
        const usuario = json.data as DashboardData;
        setData(usuario);

        // Detecta etapas concluídas desde a última visita
        const storageKey = `portal_etapas_vistas_${usuario.id}`;
        const vistas: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const concluidas = (usuario.financiamento?.etapas || []).filter(
          (e) => e.status === "concluido"
        );
        const novas = concluidas.filter((e) => !vistas.includes(e.id));
        if (novas.length > 0) {
          setNovasEtapas(novas);
        }
        localStorage.setItem(storageKey, JSON.stringify(concluidas.map((e) => e.id)));
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
    setData((prev) => (prev ? { ...prev, ...json.data } : prev));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="h-16 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (bloqueio) {
    const cancelado = bloqueio.tipo === "cancelado";
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-5">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto ${cancelado ? "bg-red-50 dark:bg-red-900/20" : "bg-zinc-100 dark:bg-zinc-800"}`}>
            {cancelado ? (
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className={`text-xl font-bold ${cancelado ? "text-red-600 dark:text-red-400" : "text-zinc-800 dark:text-zinc-200"}`}>
              {cancelado ? "Processo Cancelado" : "Acesso Encerrado"}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
              {cancelado
                ? "Infelizmente seu processo de financiamento foi cancelado. Entre em contato conosco para mais informações."
                : "Seu processo foi concluído com sucesso! O acesso ao portal expirou 3 dias após a conclusão."}
            </p>
          </div>
          {cancelado && bloqueio.motivo && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Justificativa</p>
              <p className="text-sm text-red-800 dark:text-red-300">{bloqueio.motivo}</p>
            </div>
          )}
          {!cancelado && bloqueio.concluidoEm && (
            <p className="text-xs text-zinc-400">
              Concluído em {new Date(bloqueio.concluidoEm).toLocaleDateString("pt-BR")}
            </p>
          )}
          <a
            href="https://wa.me/5537999251577"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Falar com a Emobe
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const etapas = data.financiamento?.etapas || [];

  const historico = data.financiamento?.historico || [];
  const progresso = calcularProgresso(etapas);
  const etapasConcluidas = etapas.filter((e) => e.status === "concluido").length;
  const etapaAtual = etapas.find((e) => e.status === "em_andamento");
  const totalDias = data.financiamento ? daysSince(data.financiamento.createdAt) : 0;
  const emptyFill = darkMode ? "#27272a" : "#f4f4f5";

  const chartData = etapas.map((e) => ({
    nome: NOME_ABREV[e.nome] || e.nome,
    dias:
      e.status === "concluido"
        ? daysBetween(e.dataInicio, e.dataConclusao)
        : e.status === "em_andamento"
        ? daysSince(e.dataInicio)
        : 0,
    status: e.status,
  }));

  const hasChartData = chartData.some((d) => d.dias > 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <CelebrationOverlay etapas={novasEtapas} onDismiss={() => setNovasEtapas([])} />
      <Header user={data} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Banner cancelamento */}
        {data.financiamento?.statusGeral === "cancelado" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-5">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm">Processo Cancelado</h3>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Infelizmente seu processo foi cancelado. Entre em contato conosco.
                  </p>
                  {data.financiamento.motivoCancelamento && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-800 dark:text-red-300">{data.financiamento.motivoCancelamento}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── HERO: anel de progresso + info ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center gap-6">
              {/* Donut chart */}
              <div className="relative shrink-0">
                <PieChart width={110} height={110}>
                  <Pie
                    data={[{ v: progresso }, { v: Math.max(0, 100 - progresso) }]}
                    cx={55}
                    cy={55}
                    innerRadius={36}
                    outerRadius={50}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="v"
                    strokeWidth={0}
                    paddingAngle={progresso > 0 && progresso < 100 ? 3 : 0}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill={emptyFill} />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-zinc-900 dark:text-white">{progresso}%</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">concluído</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{data.nome}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  {data.banco && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 shrink-0" />
                      {data.banco}
                    </p>
                  )}
                  {data.financiamento?.protocolo && (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
                      <Hash className="h-3 w-3 shrink-0" />
                      EMB-{String(data.financiamento.protocolo).padStart(5, "0")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.financiamento?.statusGeral === "em_andamento" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Em andamento
                    </span>
                  )}
                  {data.financiamento?.statusGeral === "pausado" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pausado
                    </span>
                  )}
                  {progresso === 100 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Concluído
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {etapasConcluidas}/{etapas.length} etapas
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {totalDias} dias
                  </span>
                </div>
              </div>
            </div>

            {progresso === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center"
              >
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  🎉 Parabéns! Seu financiamento foi concluído com sucesso!
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── CARDS DE MÉTRICAS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Etapas concluídas</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {etapasConcluidas}
                <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">/{etapas.length}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Etapa atual</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                {etapaAtual?.nome ?? (progresso === 100 ? "Concluído 🎉" : "—")}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Dias no processo</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalDias}</p>
            </div>
          </div>
        </motion.div>

        {/* ── STEPPER HORIZONTAL ── */}
        {etapas.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-6">
                Etapas do processo
              </p>
              <div className="flex items-start">
                {etapas.map((etapa, idx) => {
                  const isLast = idx === etapas.length - 1;
                  const EtapaIcon = ETAPA_ICONS[etapa.nome] || FileCheck;
                  return (
                    <div key={etapa.id} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                            etapa.status === "concluido"
                              ? "bg-green-500"
                              : etapa.status === "em_andamento"
                              ? "bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/40"
                              : "bg-zinc-100 dark:bg-zinc-800"
                          )}
                        >
                          {etapa.status === "concluido" ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          ) : etapa.status === "em_andamento" ? (
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          ) : (
                            <EtapaIcon className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[9px] mt-2 text-center leading-tight max-w-[56px] px-0.5",
                            etapa.status === "concluido"
                              ? "text-green-600 dark:text-green-400 font-medium"
                              : etapa.status === "em_andamento"
                              ? "text-blue-600 dark:text-blue-400 font-medium"
                              : "text-zinc-400 dark:text-zinc-500"
                          )}
                        >
                          {etapa.nome}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 mb-6 mx-1",
                            etapa.status === "concluido"
                              ? "bg-green-400"
                              : "bg-zinc-200 dark:bg-zinc-700"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── GRÁFICO DE DURAÇÃO POR ETAPA ── */}
        {hasChartData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                Duração por etapa
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">
                Dias gastos em cada fase do processo
              </p>
              <ResponsiveContainer width="100%" height={Math.max(etapas.length * 30, 150)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 0, right: 32, top: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={darkMode ? "#3f3f46" : "#f4f4f5"}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}d`}
                  />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip
                    cursor={{ fill: darkMode ? "#27272a" : "#f9fafb" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${darkMode ? "#3f3f46" : "#e4e4e7"}`,
                      background: darkMode ? "#18181b" : "#fff",
                      fontSize: 12,
                      padding: "6px 10px",
                      color: darkMode ? "#e4e4e7" : "#18181b",
                    }}
                    formatter={(value) => [
                      Number(value) > 0 ? `${Number(value)} dias` : "Em andamento",
                      "Duração",
                    ]}
                  />
                  <Bar dataKey="dias" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.status === "concluido"
                            ? "#22c55e"
                            : entry.status === "em_andamento"
                            ? "#3b82f6"
                            : "#e4e4e7"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-end">
                <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Concluída
                </span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Em andamento
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── AVALIAÇÃO DE SATISFAÇÃO ── */}
        {data.financiamento?.statusGeral === "concluido" &&
          !data.financiamento.avaliacao &&
          !avaliacaoEnviada && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <SatisfactionSurvey onSubmitted={(_av) => setAvaliacaoEnviada(true)} />
          </motion.div>
        )}

        {/* ── DADOS DO CLIENTE (editável) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ClientInfo user={data} onUpdate={handleUpdateUser} />
        </motion.div>

        {/* ── INTERAÇÕES ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <InteracoesPanel historico={historico} />
        </motion.div>

        {/* ── DOCUMENTOS ── */}
        {data.financiamento && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <DocumentosPanel financiamentoId={data.financiamento.id} isAdmin={false} />
          </motion.div>
        )}

        {/* ── WHATSAPP ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <a
            href="https://wa.me/5537999251577"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-green-100 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 p-5 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
          >
            <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-300 text-sm">
                Dúvidas? Converse conosco pelo WhatsApp
              </p>
              <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">
                Nossa equipe está pronta para te atender · (37) 99925-1577
              </p>
            </div>
            <svg className="h-5 w-5 text-green-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>

        <div className="h-4" />
      </main>
    </div>
  );
}
