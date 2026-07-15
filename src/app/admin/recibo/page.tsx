"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileDown, Loader2, ReceiptText, User, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface FormRecibo {
  recebedorNome: string;
  recebedorDoc: string;
  pagadorNome: string;
  pagadorDoc: string;
  valor: string;
  referente: string;
  imovelEndereco: string;
  imovelMatricula: string;
  cidade: string;
  data: string;
}

const hoje = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): FormRecibo => ({
  recebedorNome: "",
  recebedorDoc: "",
  pagadorNome: "",
  pagadorDoc: "",
  valor: "",
  referente: "",
  imovelEndereco: "",
  imovelMatricula: "",
  cidade: "",
  data: hoje(),
});

const parseCurrency = (value: string): number | null => {
  if (!value.trim()) return null;
  const num = Number(value.replace(/\./g, "").replace(",", "."));
  return isNaN(num) ? null : num;
};

const maskDoc = (value: string): string => {
  const dg = value.replace(/\D/g, "").slice(0, 14);
  if (dg.length <= 11) {
    return dg
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  return dg
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
};

export default function ReciboPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState<FormRecibo>(emptyForm());
  const [generating, setGenerating] = useState(false);

  const set = (k: keyof FormRecibo, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleValor = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return set("valor", "");
    set("valor", (parseInt(digits, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

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
      const res = await fetch("/api/admin/recibo/gerar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recebedorNome: form.recebedorNome,
          recebedorDoc: form.recebedorDoc,
          pagadorNome: form.pagadorNome,
          pagadorDoc: form.pagadorDoc,
          valor: parseCurrency(form.valor),
          referente: form.referente,
          imovelEndereco: form.imovelEndereco,
          imovelMatricula: form.imovelMatricula,
          cidade: form.cidade,
          data: form.data,
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${form.pagadorNome.replace(/\s+/g, "-")}.pdf`;
      a.click();
      addToast({ title: "Recibo gerado!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao gerar recibo", variant: "error" });
    } finally {
      setGenerating(false);
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
            <Label>CPF / CNPJ</Label>
            <Input value={form.recebedorDoc} onChange={(e) => set("recebedorDoc", maskDoc(e.target.value))} placeholder="000.000.000-00" />
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
            <Label>CPF / CNPJ</Label>
            <Input value={form.pagadorDoc} onChange={(e) => set("pagadorDoc", maskDoc(e.target.value))} placeholder="000.000.000-00" />
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
            <Label>Data</Label>
            <Input type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Referente a</Label>
            <Input value={form.referente} onChange={(e) => set("referente", e.target.value)} placeholder="Ex: sinal de compra e venda, comissão, entrada…" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Endereço do imóvel (opcional)</Label>
            <Input value={form.imovelEndereco} onChange={(e) => set("imovelEndereco", e.target.value)} placeholder="Rua, nº, bairro, cidade" />
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
        {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><FileDown className="h-4 w-4 mr-2" /> Gerar Recibo (PDF)</>}
      </Button>
    </div>
  );
}
