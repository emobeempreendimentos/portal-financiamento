"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, FileDown, Loader2, ArrowLeft, DollarSign, Pencil, Lock, History, Trash2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface FormSimulacao {
  // Cliente
  clienteNome: string;
  clienteCpf: string;
  clienteRenda: string;
  clienteDataNascimento: string;
  clienteDependentes: boolean;
  clienteTemaFgts: boolean;
  clienteValorFgts: string;
  // Simulação
  tipoFinanciamento: "mcmv" | "sbpe";
  tipoImovel: "novo" | "usado" | "lote_construcao" | "lote";
  banco: string;
  valorImovel: string;
  valorEntrada: string;
  subsidio: string;
  valorParcelaInicial: string;
  valorParcelaFinal: string;
  prazo: string;
  prazoPeriodo: "anos" | "meses";
  taxaJuros: string;
  taxaPeriodo: "ano" | "mes";
  sistemaAmortizacao: "price" | "sac";
  // Observações
  observacoes: string;
}

const emptyForm = (): FormSimulacao => ({
  clienteNome: "",
  clienteCpf: "",
  clienteRenda: "",
  clienteDataNascimento: "",
  clienteDependentes: false,
  clienteTemaFgts: false,
  clienteValorFgts: "",
  tipoFinanciamento: "sbpe",
  tipoImovel: "novo",
  banco: "caixa",
  valorImovel: "",
  valorEntrada: "",
  subsidio: "",
  valorParcelaInicial: "",
  valorParcelaFinal: "",
  prazo: "",
  prazoPeriodo: "anos",
  taxaJuros: "",
  taxaPeriodo: "ano",
  sistemaAmortizacao: "price",
  observacoes: "TRANSFERÊNCIA DO IMÓVEL: A transferência do imóvel são as despesas que você gasta para transferir o imóvel para o seu nome.",
});

const parseCurrency = (value: string): number | null => {
  if (!value.trim()) return null;
  const num = Number(value.replace(/\./g, "").replace(",", "."));
  return isNaN(num) ? null : num;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SimulacaoRow extends Record<string, any> {
  id: string;
  clienteNome: string;
  tipoFinanciamento: string;
  tipoImovel: string;
  valorImovel: number | null;
  createdAt: string;
}

const numToCurrency = (n: number | null | undefined) =>
  n == null ? "" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function simToForm(s: SimulacaoRow): FormSimulacao {
  return {
    clienteNome: s.clienteNome || "",
    clienteCpf: s.clienteCpf || "",
    clienteRenda: numToCurrency(s.clienteRenda),
    clienteDataNascimento: s.clienteDataNascimento || "",
    clienteDependentes: !!s.clienteDependentes,
    clienteTemaFgts: !!s.clienteTemaFgts,
    clienteValorFgts: numToCurrency(s.clienteValorFgts),
    tipoFinanciamento: (s.tipoFinanciamento as FormSimulacao["tipoFinanciamento"]) || "sbpe",
    tipoImovel: (s.tipoImovel as FormSimulacao["tipoImovel"]) || "novo",
    banco: s.banco || "caixa",
    valorImovel: numToCurrency(s.valorImovel),
    valorEntrada: numToCurrency(s.valorEntrada),
    subsidio: numToCurrency(s.subsidio),
    valorParcelaInicial: numToCurrency(s.valorParcelaInicial),
    valorParcelaFinal: numToCurrency(s.valorParcelaFinal),
    prazo: s.prazo != null ? String(s.prazo) : "",
    prazoPeriodo: (s.prazoPeriodo as FormSimulacao["prazoPeriodo"]) || "anos",
    taxaJuros: s.taxaJuros != null ? String(s.taxaJuros) : "",
    taxaPeriodo: (s.taxaPeriodo as FormSimulacao["taxaPeriodo"]) || "ano",
    sistemaAmortizacao: (s.sistemaAmortizacao as FormSimulacao["sistemaAmortizacao"]) || "price",
    observacoes: s.observacoes || "",
  };
}

const TIPO_FIN_LABEL: Record<string, string> = { mcmv: "Minha Casa Minha Vida", sbpe: "SBPE" };

export default function SimulacaoPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState<FormSimulacao>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(true);
  const [recentes, setRecentes] = useState<SimulacaoRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const carregarRecentes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/simulacao");
      const json = await res.json();
      if (json.success) setRecentes(json.data || []);
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    carregarRecentes();
  }, [carregarRecentes]);

  const buildPayload = () => ({
    clienteNome: form.clienteNome,
    clienteCpf: form.clienteCpf,
    clienteRenda: parseCurrency(form.clienteRenda),
    clienteDataNascimento: form.clienteDataNascimento,
    clienteDependentes: form.clienteDependentes,
    clienteTemaFgts: form.clienteTemaFgts,
    clienteValorFgts: form.clienteTemaFgts ? parseCurrency(form.clienteValorFgts) : null,
    tipoFinanciamento: form.tipoFinanciamento,
    tipoImovel: form.tipoImovel,
    banco: form.banco,
    valorImovel: parseCurrency(form.valorImovel),
    valorEntrada: parseCurrency(form.valorEntrada),
    subsidio: parseCurrency(form.subsidio),
    valorParcelaInicial: parseCurrency(form.valorParcelaInicial),
    valorParcelaFinal: parseCurrency(form.valorParcelaFinal),
    prazo: parseInt(form.prazo) || 0,
    prazoPeriodo: form.prazoPeriodo,
    taxaJuros: parseFloat(form.taxaJuros) || 0,
    taxaPeriodo: form.taxaPeriodo,
    sistemaAmortizacao: form.sistemaAmortizacao,
    observacoes: form.observacoes,
  });

  function carregarSimulacao(s: SimulacaoRow) {
    setForm(simToForm(s));
    setCurrentId(s.id);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({ title: `Simulação de ${s.clienteNome} carregada`, variant: "success" });
  }

  function novaSimulacao() {
    setForm(emptyForm());
    setCurrentId(null);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirSimulacao(id: string, nome: string) {
    try {
      const res = await fetch(`/api/admin/simulacao?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRecentes((p) => p.filter((s) => s.id !== id));
      if (currentId === id) setCurrentId(null);
      addToast({ title: `Simulação de ${nome} excluída`, variant: "success" });
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  const handleCurrencyChange = (field: keyof FormSimulacao, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setForm((p) => ({ ...p, [field]: "" }));
      return;
    }
    const formatted = (parseInt(digits, 10) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setForm((p) => ({ ...p, [field]: formatted }));
  };

  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      let formatted = digits;
      if (digits.length > 3) {
        formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      }
      if (digits.length > 6) {
        formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      }
      if (digits.length > 9) {
        formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
      }
      setForm((p) => ({ ...p, clienteCpf: formatted }));
    }
  };

  async function handleSave() {
    if (!form.clienteNome.trim()) {
      addToast({ title: "Preencha o nome do cliente", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/simulacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), id: currentId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error();
      if (json.data?.id) setCurrentId(json.data.id);
      setEditing(false);
      await carregarRecentes();
      addToast({ title: "Simulação salva!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao salvar", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePDF() {
    if (!form.clienteNome.trim()) {
      addToast({ title: "Preencha os dados do cliente", variant: "error" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/simulacao/gerar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `simulacao-${form.clienteNome.replace(/\s+/g, "-")}.pdf`;
      a.click();
      addToast({ title: "PDF gerado!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao gerar PDF", variant: "error" });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Simulação de Financiamento</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={novaSimulacao}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            title="Nova simulação"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova
          </button>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              title="Editar simulação"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Simulações recentes */}
      {recentes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Simulações Recentes</h2>
            <span className="text-xs text-zinc-400">({recentes.length}/10)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentes.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  currentId === s.id
                    ? "border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-900/15"
                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <button onClick={() => carregarSimulacao(s)} className="flex-1 flex items-center gap-3 min-w-0 text-left">
                  <div className="h-9 w-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{s.clienteNome}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {TIPO_FIN_LABEL[s.tipoFinanciamento] || s.tipoFinanciamento}
                      {s.valorImovel ? ` · R$ ${numToCurrency(s.valorImovel)}` : ""}
                      {" · "}
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => excluirSimulacao(s.id, s.clienteNome)}
                  className="shrink-0 p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Aviso de simulação salva/travada */}
      {!editing && (
        <div className="flex items-center gap-2 rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/15 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Simulação salva. Clique em <span className="font-semibold">Editar</span> para alterar os dados.
        </div>
      )}

      <fieldset disabled={!editing} className="space-y-6 min-w-0 disabled:opacity-70 transition-opacity">

      {/* Dados do Cliente */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <DollarSign className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Dados do Cliente</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome Completo</Label>
            <Input
              value={form.clienteNome}
              onChange={(e) => setForm((p) => ({ ...p, clienteNome: e.target.value }))}
              placeholder="Digite o nome"
            />
          </div>
          <div className="space-y-1.5">
            <Label>CPF</Label>
            <Input
              value={form.clienteCpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor da Renda</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
              <Input
                className="pl-9"
                value={form.clienteRenda}
                onChange={(e) => handleCurrencyChange("clienteRenda", e.target.value)}
                placeholder="0,00"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Data de Nascimento</Label>
            <Input
              type="date"
              value={form.clienteDataNascimento}
              onChange={(e) => setForm((p) => ({ ...p, clienteDataNascimento: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Possui Dependentes?</Label>
            <div className="flex gap-3">
              {[
                { label: "Sim", value: true },
                { label: "Não", value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setForm((p) => ({ ...p, clienteDependentes: opt.value }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.clienteDependentes === opt.value
                      ? "bg-green-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Possui mais de 3 anos de FGTS?</Label>
            <div className="flex gap-3">
              {[
                { label: "Sim", value: true },
                { label: "Não", value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setForm((p) => ({ ...p, clienteTemaFgts: opt.value }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.clienteTemaFgts === opt.value
                      ? "bg-green-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Campo de FGTS - aparece condicionalmente */}
        <AnimatePresence>
          {form.clienteTemaFgts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Valor Disponível de FGTS</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
                    <Input
                      className="pl-9"
                      value={form.clienteValorFgts}
                      onChange={(e) => handleCurrencyChange("clienteValorFgts", e.target.value)}
                      placeholder="0,00"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dados da Simulação */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <DollarSign className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Dados da Simulação</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo de Financiamento</Label>
            <select
              value={form.tipoFinanciamento}
              onChange={(e) => setForm((p) => ({ ...p, tipoFinanciamento: e.target.value as any }))}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="sbpe">SBPE</option>
              <option value="mcmv">Plano Minha Casa Minha Vida</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de Imóvel</Label>
            <select
              value={form.tipoImovel}
              onChange={(e) => setForm((p) => ({ ...p, tipoImovel: e.target.value as any }))}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="novo">Imóvel Novo</option>
              <option value="usado">Imóvel Usado</option>
              <option value="lote_construcao">Lote + Construção</option>
              <option value="lote">Lote</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Banco</Label>
            <select
              value={form.banco}
              onChange={(e) => setForm((p) => ({ ...p, banco: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="caixa">Caixa Econômica Federal</option>
              <option value="banco_brasil">Banco do Brasil</option>
              <option value="itau">Banco Itaú</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor do Imóvel</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
              <Input
                className="pl-9"
                value={form.valorImovel}
                onChange={(e) => handleCurrencyChange("valorImovel", e.target.value)}
                placeholder="0,00"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor da Entrada</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
              <Input
                className="pl-9"
                value={form.valorEntrada}
                onChange={(e) => handleCurrencyChange("valorEntrada", e.target.value)}
                placeholder="0,00"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Subsídio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
              <Input
                className="pl-9"
                value={form.subsidio}
                onChange={(e) => handleCurrencyChange("subsidio", e.target.value)}
                placeholder="0,00"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor da Parcela Inicial</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
              <Input
                className="pl-9"
                value={form.valorParcelaInicial}
                onChange={(e) => handleCurrencyChange("valorParcelaInicial", e.target.value)}
                placeholder="0,00"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor da Parcela Final</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
              <Input
                className="pl-9"
                value={form.valorParcelaFinal}
                onChange={(e) => handleCurrencyChange("valorParcelaFinal", e.target.value)}
                placeholder="0,00"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prazo</Label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                type="number"
                value={form.prazo}
                onChange={(e) => setForm((p) => ({ ...p, prazo: e.target.value }))}
                placeholder="360"
              />
              <select
                value={form.prazoPeriodo}
                onChange={(e) => setForm((p) => ({ ...p, prazoPeriodo: e.target.value as any }))}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="anos">Anos</option>
                <option value="meses">Meses</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Taxa de Juros</Label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                type="number"
                step="0.01"
                value={form.taxaJuros}
                onChange={(e) => setForm((p) => ({ ...p, taxaJuros: e.target.value }))}
                placeholder="0,00"
              />
              <select
                value={form.taxaPeriodo}
                onChange={(e) => setForm((p) => ({ ...p, taxaPeriodo: e.target.value as any }))}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ano">% ao ano</option>
                <option value="mes">% ao mês</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sistema de Amortização */}
        <div className="mt-6 space-y-3">
          <Label>Sistema de Amortização</Label>
          <div className="space-y-2">
            {[
              { value: "price", label: "Price — Parcelas Fixas" },
              { value: "sac", label: "SAC — Parcelas Decrescentes" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((p) => ({ ...p, sistemaAmortizacao: opt.value as any }))}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  form.sistemaAmortizacao === opt.value
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-green-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    form.sistemaAmortizacao === opt.value
                      ? "border-green-500 bg-green-500"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {form.sistemaAmortizacao === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Observações */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      >
        <Label className="block mb-3">Observações</Label>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          rows={5}
        />
      </motion.div>

      </fieldset>

      {/* Botões */}
      <div className="flex gap-3">
        {editing && (
          <Button variant="neon" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Simulação
              </>
            )}
          </Button>
        )}
        <Button onClick={handleGeneratePDF} disabled={generating} className={editing ? "px-6" : "flex-1"}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 mr-2" />
              Gerar PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
