"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ReceiptText,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Filter,
  User,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/components/ui/toast";
import { LancamentoFinanceiro, ResumoFinanceiro, GraficoMes } from "@/types";

// ─── Categorias Pessoais ─────────────────────────────────────────────────────
const CATEGORIAS_RECEITA = [
  "Salário", "Freelance", "Investimentos", "Renda Extra", "Aluguel Recebido", "Outros",
];
const CATEGORIAS_DESPESA = [
  "Alimentação", "Moradia", "Transporte", "Saúde", "Educação",
  "Lazer", "Vestuário", "Assinaturas", "Outros",
];
function todasCategorias(tipo?: string) {
  if (tipo === "receita") return CATEGORIAS_RECEITA;
  if (tipo === "despesa") return CATEGORIAS_DESPESA;
  return [...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA];
}

// ─── Formas de pagamento ─────────────────────────────────────────────────────
const FORMAS_PAGAMENTO = [
  { value: "pix",      label: "PIX",     emoji: "⚡" },
  { value: "credito",  label: "Crédito", emoji: "💳" },
  { value: "debito",   label: "Débito",  emoji: "🏧" },
  { value: "dinheiro", label: "Dinheiro",emoji: "💵" },
];
const PAGAMENTO_COLOR: Record<string, string> = {
  pix:      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  credito:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  debito:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  dinheiro: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

// ─── Formatação ──────────────────────────────────────────────────────────────
function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

// ─── Form vazio ───────────────────────────────────────────────────────────────
const FORM_VAZIO = {
  descricao: "",
  valor: "",
  tipo: "receita" as "receita" | "despesa",
  categoria: "",
  data: new Date().toISOString().slice(0, 10),
  formaPagamento: "",
  parcelas: "1",
  observacao: "",
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FinanceiroPessoalPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [grafico, setGrafico] = useState<GraficoMes[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState<"todos" | "receita" | "despesa">("todos");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<LancamentoFinanceiro | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const { addToast } = useToast();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTipo !== "todos") params.set("tipo", filtroTipo);
      if (filtroMes) params.set("mes", filtroMes);
      if (filtroCategoria) params.set("categoria", filtroCategoria);
      const res = await fetch(`/api/admin/financeiro-pessoal?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setLancamentos(json.data || []);
      setResumo(json.resumo);
      setGrafico(json.grafico || []);
    } catch {
      addToast({ title: "Erro ao carregar lançamentos", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroMes, filtroCategoria]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModalOpen(true);
  }

  function abrirEditar(l: LancamentoFinanceiro) {
    setEditando(l);
    setForm({
      descricao: l.descricao,
      valor: String(l.valor),
      tipo: l.tipo,
      categoria: l.categoria,
      data: l.data.slice(0, 10),
      formaPagamento: l.formaPagamento || "",
      parcelas: String(l.parcelas || 1),
      observacao: l.observacao || "",
    });
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
    setForm(FORM_VAZIO);
  }

  async function salvar() {
    if (!form.descricao.trim() || !form.valor || !form.categoria || !form.data) {
      addToast({ title: "Preencha todos os campos obrigatórios", variant: "error" });
      return;
    }
    setSalvando(true);
    try {
      const url = editando ? `/api/admin/financeiro-pessoal/${editando.id}` : "/api/admin/financeiro-pessoal";
      const method = editando ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      addToast({ title: editando ? "Lançamento atualizado!" : "Lançamento criado!", variant: "success" });
      fecharModal();
      carregar();
    } catch (e) {
      addToast({ title: e instanceof Error ? e.message : "Erro ao salvar", variant: "error" });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    try {
      const res = await fetch(`/api/admin/financeiro-pessoal/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      addToast({ title: "Lançamento excluído", variant: "success" });
      setDeletandoId(null);
      carregar();
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  const categoriasForm = todasCategorias(form.tipo);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Finanças Pessoais</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">Controle financeiro pessoal</p>
          </div>
        </div>
        <button onClick={abrirNovo}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm">
          <Plus className="h-4 w-4" />Novo Lançamento
        </button>
      </motion.div>

      {/* Cards de resumo */}
      {resumo && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Receita Total",       value: fmt(resumo.totalReceitas), icon: TrendingUp,  color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",   border: "border-green-100 dark:border-green-900/30" },
            { label: "Despesa Total",        value: fmt(resumo.totalDespesas), icon: TrendingDown, color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",         border: "border-red-100 dark:border-red-900/30" },
            { label: "Saldo",                value: fmt(resumo.saldo),         icon: Wallet,       color: resumo.saldo >= 0 ? "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400", border: resumo.saldo >= 0 ? "border-violet-100 dark:border-violet-900/30" : "border-orange-100 dark:border-orange-900/30" },
            { label: "Total de Lançamentos", value: String(resumo.totalLancamentos), icon: ReceiptText, color: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400", border: "border-violet-100 dark:border-violet-900/30" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`rounded-2xl border p-5 shadow-sm bg-white dark:bg-zinc-900 ${card.border}`}>
              <div className={`h-10 w-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}><card.icon className="h-5 w-5" /></div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white truncate">{card.value}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{card.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Gráfico */}
      {grafico.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Receitas vs Despesas — Últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={grafico} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#71717a" }} />
              <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
              <Tooltip formatter={(value) => [fmt(Number(value))]} contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", fontSize: "12px" }} />
              <Legend formatter={(value) => (value === "receitas" ? "Receitas" : "Despesas")} />
              <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} name="receitas" />
              <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} name="despesas" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Filtros + Tabela */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">

        {/* Barra de filtros */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium"><Filter className="h-3.5 w-3.5" />Filtros:</div>
          <div className="flex gap-1">
            {(["todos", "receita", "despesa"] as const).map((t) => (
              <button key={t} onClick={() => setFiltroTipo(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroTipo === t ? t === "receita" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : t === "despesa" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                {t === "todos" ? "Todos" : t === "receita" ? "Receitas" : "Despesas"}
              </button>
            ))}
          </div>
          <div className="relative">
            <input type="month" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            {filtroMes && <button onClick={() => setFiltroMes("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="relative">
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none">
              <option value="">Todas categorias</option>
              {todasCategorias().map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>
          {(filtroTipo !== "todos" || filtroMes || filtroCategoria) && (
            <button onClick={() => { setFiltroTipo("todos"); setFiltroMes(""); setFiltroCategoria(""); }}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline">Limpar filtros</button>
          )}
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
        ) : lancamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ReceiptText className="h-12 w-12 mb-3 text-zinc-200 dark:text-zinc-700" />
            <p className="text-sm text-zinc-400">Nenhum lançamento encontrado</p>
            <button onClick={abrirNovo} className="mt-4 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">+ Criar primeiro lançamento</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Pagamento</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {lancamentos.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{fmtData(l.data)}</td>
                    <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-white max-w-xs">
                      <div className="truncate">{l.descricao}</div>
                      {l.observacao && <div className="text-xs text-zinc-400 truncate mt-0.5">{l.observacao}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{l.categoria}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${l.tipo === "receita" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {l.tipo === "receita" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {l.formaPagamento ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PAGAMENTO_COLOR[l.formaPagamento] || "bg-zinc-100 text-zinc-600"}`}>
                            {FORMAS_PAGAMENTO.find((f) => f.value === l.formaPagamento)?.emoji}{" "}
                            {FORMAS_PAGAMENTO.find((f) => f.value === l.formaPagamento)?.label}
                          </span>
                          {l.formaPagamento === "credito" && l.parcelas && l.parcelas > 1 && (
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{l.parcelas}x</span>
                          )}
                          {l.formaPagamento === "credito" && (!l.parcelas || l.parcelas === 1) && (
                            <span className="text-xs text-zinc-400">1x</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-bold tabular-nums ${l.tipo === "receita" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                      {l.tipo === "despesa" && "- "}{fmt(l.valor)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => abrirEditar(l)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeletandoId(l.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {lancamentos.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Subtotal ({lancamentos.length} lançamentos)
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {(() => {
                        const r = lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
                        const d = lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0);
                        const s = r - d;
                        return <span className={s >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>{fmt(s)}</span>;
                      })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Modal: Novo / Editar ───────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.currentTarget === e.target) fecharModal(); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <h2 className="font-semibold text-zinc-900 dark:text-white">{editando ? "Editar Lançamento" : "Novo Lançamento Pessoal"}</h2>
                <button onClick={fecharModal} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Tipo *</label>
                  <div className="flex gap-2">
                    {(["receita", "despesa"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, tipo: t, categoria: "" }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${form.tipo === t ? t === "receita" ? "bg-green-500 text-white" : "bg-red-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                        {t === "receita" ? "💰 Receita" : "💸 Despesa"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Descrição *</label>
                  <input type="text" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                    placeholder="Ex: Salário mês de junho"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder-zinc-400" />
                </div>

                {/* Valor + Data */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Valor (R$) *</label>
                    <input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                      placeholder="0,00"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder-zinc-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Data *</label>
                    <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Categoria *</label>
                  <div className="relative">
                    <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none">
                      <option value="">Selecione uma categoria</option>
                      {categoriasForm.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Forma de Pagamento</label>
                  <div className="grid grid-cols-4 gap-2">
                    {FORMAS_PAGAMENTO.map((fp) => (
                      <button key={fp.value} type="button"
                        onClick={() => setForm((f) => ({ ...f, formaPagamento: f.formaPagamento === fp.value ? "" : fp.value, parcelas: "1" }))}
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1 border ${form.formaPagamento === fp.value ? "bg-violet-600 text-white border-violet-600" : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
                        <span className="text-base leading-none">{fp.emoji}</span>
                        <span>{fp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parcelas (só crédito) */}
                {form.formaPagamento === "credito" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Número de Parcelas</label>
                    <div className="relative">
                      <select value={form.parcelas} onChange={(e) => setForm((f) => ({ ...f, parcelas: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none">
                        {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}x {n === 1 ? "(à vista)" : ""}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Observação */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Observação</label>
                  <textarea value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                    placeholder="Detalhes adicionais (opcional)" rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder-zinc-400 resize-none" />
                </div>
              </div>

              <div className="flex gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
                <button onClick={fecharModal}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                <button onClick={salvar} disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                  {salvando ? "Salvando..." : editando ? "Atualizar" : "Salvar Lançamento"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Confirmar exclusão ─────────────────────────────────────── */}
      <AnimatePresence>
        {deletandoId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Excluir lançamento?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeletandoId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                <button onClick={() => excluir(deletandoId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
