"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileDown, Loader2, ReceiptText, User, Home, History, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface FormRecibo {
  recebedorNome: string;
  recebedorTipoDoc: "cpf" | "cnpj";
  recebedorDoc: string;
  pagadorNome: string;
  pagadorTipoDoc: "cpf" | "cnpj";
  pagadorDoc: string;
  valor: string;
  referente: string;
  imovelMatricula: string;
  formaPagamento: string;
  cidade: string;
  data: string;
}

interface ReciboRow {
  id: string;
  numero: number;
  recebedorNome: string;
  recebedorTipoDoc?: string | null;
  recebedorDoc?: string | null;
  pagadorNome: string;
  pagadorTipoDoc?: string | null;
  pagadorDoc?: string | null;
  valor: number;
  referente?: string | null;
  imovelMatricula?: string | null;
  formaPagamento?: string | null;
  cidade?: string | null;
  data?: string | null;
  createdAt: string;
}

const FORMAS = [
  { value: "", label: "—" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência" },
  { value: "cheque", label: "Cheque" },
  { value: "cartao", label: "Cartão" },
  { value: "outro", label: "Outro" },
];

const hoje = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): FormRecibo => ({
  recebedorNome: "",
  recebedorTipoDoc: "cpf",
  recebedorDoc: "",
  pagadorNome: "",
  pagadorTipoDoc: "cpf",
  pagadorDoc: "",
  valor: "",
  referente: "",
  imovelMatricula: "",
  formaPagamento: "",
  cidade: "",
  data: hoje(),
});

const numToCurrency = (n: number | null | undefined) =>
  n == null ? "" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function reciboToForm(r: ReciboRow): FormRecibo {
  return {
    recebedorNome: r.recebedorNome || "",
    recebedorTipoDoc: (r.recebedorTipoDoc as "cpf" | "cnpj") || "cpf",
    recebedorDoc: r.recebedorDoc || "",
    pagadorNome: r.pagadorNome || "",
    pagadorTipoDoc: (r.pagadorTipoDoc as "cpf" | "cnpj") || "cpf",
    pagadorDoc: r.pagadorDoc || "",
    valor: numToCurrency(r.valor),
    referente: r.referente || "",
    imovelMatricula: r.imovelMatricula || "",
    formaPagamento: r.formaPagamento || "",
    cidade: r.cidade || "",
    data: r.data || hoje(),
  };
}

const parseCurrency = (value: string): number | null => {
  if (!value.trim()) return null;
  const num = Number(value.replace(/\./g, "").replace(",", "."));
  return isNaN(num) ? null : num;
};

const maskDoc = (value: string, tipo: "cpf" | "cnpj"): string => {
  const dg = value.replace(/\D/g, "");
  if (tipo === "cnpj") {
    return dg.slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
  }
  return dg.slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

export default function ReciboPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState<FormRecibo>(emptyForm());
  const [generating, setGenerating] = useState(false);
  const [recentes, setRecentes] = useState<ReciboRow[]>([]);
  const [current, setCurrent] = useState<{ id: string; numero: number } | null>(null);

  const set = (k: keyof FormRecibo, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const carregarRecentes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/recibo");
      const json = await res.json();
      if (json.success) setRecentes(json.data || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregarRecentes(); }, [carregarRecentes]);

  const handleValor = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return set("valor", "");
    set("valor", (parseInt(digits, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const payload = () => ({
    recebedorNome: form.recebedorNome,
    recebedorTipoDoc: form.recebedorTipoDoc,
    recebedorDoc: form.recebedorDoc,
    pagadorNome: form.pagadorNome,
    pagadorTipoDoc: form.pagadorTipoDoc,
    pagadorDoc: form.pagadorDoc,
    valor: parseCurrency(form.valor),
    referente: form.referente,
    imovelMatricula: form.imovelMatricula,
    formaPagamento: form.formaPagamento,
    cidade: form.cidade,
    data: form.data,
  });

  function baixarPDF(dados: object, nome: string) {
    return fetch("/api/admin/recibo/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then(async (res) => {
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${nome.replace(/\s+/g, "-")}.pdf`;
      a.click();
    });
  }

  async function gerarPDF() {
    if (!form.recebedorNome.trim() || !form.pagadorNome.trim()) {
      addToast({ title: "Preencha quem recebeu e quem pagou", variant: "error" });
      return;
    }
    if (!parseCurrency(form.valor)) {
      addToast({ title: "Informe o valor recebido", variant: "error" });
      return;
    }
    setGenerating(true);
    try {
      // Salva (cria novo com número, ou atualiza o carregado mantendo o número)
      const res = await fetch(
        current ? `/api/admin/recibo/${current.id}` : "/api/admin/recibo",
        { method: current ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error();
      const numero = json.data.numero as number;
      setCurrent({ id: json.data.id, numero });

      await baixarPDF({ ...payload(), numero }, form.pagadorNome);
      await carregarRecentes();
      addToast({ title: `Recibo Nº ${String(numero).padStart(4, "0")} gerado!`, variant: "success" });
    } catch {
      addToast({ title: "Erro ao gerar recibo", variant: "error" });
    } finally {
      setGenerating(false);
    }
  }

  function carregarRecibo(r: ReciboRow) {
    setForm(reciboToForm(r));
    setCurrent({ id: r.id, numero: r.numero });
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({ title: `Recibo Nº ${String(r.numero).padStart(4, "0")} carregado`, variant: "success" });
  }

  function novoRecibo() {
    setForm(emptyForm());
    setCurrent(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function reimprimir(r: ReciboRow) {
    try {
      await baixarPDF(
        {
          recebedorNome: r.recebedorNome, recebedorTipoDoc: r.recebedorTipoDoc, recebedorDoc: r.recebedorDoc,
          pagadorNome: r.pagadorNome, pagadorTipoDoc: r.pagadorTipoDoc, pagadorDoc: r.pagadorDoc,
          valor: r.valor, referente: r.referente, imovelMatricula: r.imovelMatricula,
          formaPagamento: r.formaPagamento, cidade: r.cidade, data: r.data, numero: r.numero,
        },
        r.pagadorNome
      );
    } catch {
      addToast({ title: "Erro ao gerar PDF", variant: "error" });
    }
  }

  async function excluirRecibo(id: string, numero: number) {
    try {
      const res = await fetch(`/api/admin/recibo/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRecentes((p) => p.filter((r) => r.id !== id));
      if (current?.id === id) setCurrent(null);
      addToast({ title: `Recibo Nº ${String(numero).padStart(4, "0")} excluído`, variant: "success" });
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gerador de Recibo</h1>
        {current && (
          <span className="px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold">
            Nº {String(current.numero).padStart(4, "0")}
          </span>
        )}
        <button
          onClick={novoRecibo}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title="Novo recibo"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo
        </button>
      </div>

      {/* Quem recebeu */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-5">
          <ReceiptText className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Quem recebeu (declarante)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome / Razão Social</Label>
            <Input value={form.recebedorNome} onChange={(e) => set("recebedorNome", e.target.value)} placeholder="Nome de quem recebeu" />
          </div>
          <div className="space-y-1.5">
            <Label>Documento</Label>
            <div className="flex gap-2">
              <select
                value={form.recebedorTipoDoc}
                onChange={(e) => {
                  const tipo = e.target.value as "cpf" | "cnpj";
                  setForm((p) => ({ ...p, recebedorTipoDoc: tipo, recebedorDoc: maskDoc(p.recebedorDoc, tipo) }));
                }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
              <Input
                className="flex-1"
                value={form.recebedorDoc}
                onChange={(e) => set("recebedorDoc", maskDoc(e.target.value, form.recebedorTipoDoc))}
                placeholder={form.recebedorTipoDoc === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quem pagou */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">De quem recebeu (pagador)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome / Razão Social</Label>
            <Input value={form.pagadorNome} onChange={(e) => set("pagadorNome", e.target.value)} placeholder="Nome de quem pagou" />
          </div>
          <div className="space-y-1.5">
            <Label>Documento</Label>
            <div className="flex gap-2">
              <select
                value={form.pagadorTipoDoc}
                onChange={(e) => {
                  const tipo = e.target.value as "cpf" | "cnpj";
                  setForm((p) => ({ ...p, pagadorTipoDoc: tipo, pagadorDoc: maskDoc(p.pagadorDoc, tipo) }));
                }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
              <Input
                className="flex-1"
                value={form.pagadorDoc}
                onChange={(e) => set("pagadorDoc", maskDoc(e.target.value, form.pagadorTipoDoc))}
                placeholder={form.pagadorTipoDoc === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Valor e referência */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Home className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Valor e imóvel</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Valor recebido</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R$</span>
              <Input className="pl-9" value={form.valor} onChange={(e) => handleValor(e.target.value)} placeholder="0,00" inputMode="numeric" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <select
              value={form.formaPagamento}
              onChange={(e) => set("formaPagamento", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Referente a</Label>
            <Input value={form.referente} onChange={(e) => set("referente", e.target.value)} placeholder="Ex: sinal de compra e venda, comissão, entrada…" />
          </div>
          <div className="space-y-1.5">
            <Label>Matrícula do imóvel (opcional)</Label>
            <Input value={form.imovelMatricula} onChange={(e) => set("imovelMatricula", e.target.value)} placeholder="Nº da matrícula" />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade (local do recibo)</Label>
            <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} placeholder="Ex: Divinópolis/MG" />
          </div>
        </div>
      </motion.div>

      {/* Botão */}
      <Button variant="neon" className="w-full" onClick={gerarPDF} disabled={generating}>
        {generating
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
          : <><FileDown className="h-4 w-4 mr-2" /> {current ? "Atualizar e Gerar PDF" : "Gerar Recibo (PDF)"}</>}
      </Button>

      {/* Histórico de emissões */}
      {recentes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Últimas Emissões</h2>
          </div>
          <div className="space-y-2.5">
            {recentes.map((r) => (
              <div
                key={r.id}
                className={`group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  current?.id === r.id
                    ? "border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-900/15"
                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <span className="shrink-0 h-9 w-12 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                  {String(r.numero).padStart(4, "0")}
                </span>
                <button onClick={() => carregarRecibo(r)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{r.pagadorNome}</p>
                  <p className="text-xs text-zinc-400 truncate">
                    R$ {numToCurrency(r.valor)}
                    {r.referente ? ` · ${r.referente}` : ""}
                    {" · "}
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </button>
                <button
                  onClick={() => reimprimir(r)}
                  className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  title="Baixar PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => excluirRecibo(r.id, r.numero)}
                  className="shrink-0 p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors sm:opacity-0 group-hover:opacity-100"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
