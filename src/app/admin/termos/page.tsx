"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileDown, Loader2, FileSignature, History, Trash2, Plus, Pencil,
  Bold, Underline, ALargeSmall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface FormTermo {
  titulo: string;
  tipo: "proposta" | "orcamento" | "comunicado" | "outro";
  tipoOutro: string;
  destinatario: string;
  corpo: string;
}

interface TermoRow {
  id: string;
  titulo: string;
  tipo: string;
  tipoOutro?: string | null;
  destinatario?: string | null;
  corpo: string;
  createdAt: string;
}

const TIPOS = [
  { value: "proposta", label: "Proposta" },
  { value: "orcamento", label: "Orçamento" },
  { value: "comunicado", label: "Comunicado" },
  { value: "outro", label: "Outro" },
];

const emptyForm = (): FormTermo => ({ titulo: "", tipo: "proposta", tipoOutro: "", destinatario: "", corpo: "" });

function termoToForm(t: TermoRow): FormTermo {
  return {
    titulo: t.titulo || "",
    tipo: (t.tipo as FormTermo["tipo"]) || "proposta",
    tipoOutro: t.tipoOutro || "",
    destinatario: t.destinatario || "",
    corpo: t.corpo || "",
  };
}

function tipoBadgeLabel(t: TermoRow): string {
  if (t.tipo === "outro" && t.tipoOutro?.trim()) return t.tipoOutro.trim();
  return TIPOS.find((x) => x.value === t.tipo)?.label ?? t.tipo;
}

export default function TermosPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState<FormTermo>(emptyForm());
  const [generating, setGenerating] = useState(false);
  const [recentes, setRecentes] = useState<TermoRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const corpoRef = useRef<HTMLTextAreaElement>(null);

  const set = (k: keyof FormTermo, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Envolve o trecho selecionado no textarea com o marcador (**, __ ou ++).
  // Sem seleção, insere um texto de exemplo já selecionado, pronto para digitar por cima.
  function aplicarMarcador(marcador: string) {
    const el = corpoRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selecionado = value.slice(selectionStart, selectionEnd) || "texto";
    const antes = value.slice(0, selectionStart);
    const depois = value.slice(selectionEnd);
    const novoValor = `${antes}${marcador}${selecionado}${marcador}${depois}`;
    setForm((p) => ({ ...p, corpo: novoValor }));
    requestAnimationFrame(() => {
      el.focus();
      const novoInicio = selectionStart + marcador.length;
      el.setSelectionRange(novoInicio, novoInicio + selecionado.length);
    });
  }

  const carregarRecentes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/termos");
      const json = await res.json();
      if (json.success) setRecentes(json.data || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregarRecentes(); }, [carregarRecentes]);

  function baixarPDF(dados: object, nome: string) {
    return fetch("/api/admin/termos/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }).then(async (res) => {
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nome.replace(/\s+/g, "-")}.pdf`;
      a.click();
    });
  }

  async function gerarPDF() {
    if (!form.titulo.trim() || !form.corpo.trim()) {
      addToast({ title: "Preencha o título e o conteúdo do termo", variant: "error" });
      return;
    }
    if (form.tipo === "outro" && !form.tipoOutro.trim()) {
      addToast({ title: "Informe o nome do tipo de documento", variant: "error" });
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        titulo: form.titulo,
        tipo: form.tipo,
        tipoOutro: form.tipoOutro,
        destinatario: form.destinatario,
        corpo: form.corpo,
      };

      const res = await fetch(
        currentId ? `/api/admin/termos/${currentId}` : "/api/admin/termos",
        { method: currentId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setCurrentId(json.data.id);

      await baixarPDF(payload, form.titulo);
      await carregarRecentes();
      addToast({ title: "Termo gerado!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao gerar termo", variant: "error" });
    } finally {
      setGenerating(false);
    }
  }

  function carregarTermo(t: TermoRow) {
    setForm(termoToForm(t));
    setCurrentId(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({ title: `"${t.titulo}" carregado`, variant: "success" });
  }

  function novoTermo() {
    setForm(emptyForm());
    setCurrentId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function reimprimir(t: TermoRow) {
    try {
      await baixarPDF({ titulo: t.titulo, tipo: t.tipo, tipoOutro: t.tipoOutro, destinatario: t.destinatario, corpo: t.corpo }, t.titulo);
    } catch {
      addToast({ title: "Erro ao gerar PDF", variant: "error" });
    }
  }

  async function excluirTermo(id: string, titulo: string) {
    if (!confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/termos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRecentes((p) => p.filter((t) => t.id !== id));
      if (currentId === id) setCurrentId(null);
      addToast({ title: "Termo excluído", variant: "success" });
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  const selectCls =
    "w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Termos para Envio</h1>
        {currentId && (
          <span className="px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold">
            Editando
          </span>
        )}
        <button
          onClick={novoTermo}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title="Novo termo"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo
        </button>
      </div>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm -mt-4">
        Escreva uma proposta, orçamento ou comunicado e gere o PDF para enviar ao cliente.
      </p>

      {/* Formulário */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileSignature className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Conteúdo do Termo</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex: Proposta de Compra - Apto 302" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} className={selectCls}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {form.tipo === "outro" && (
          <div className="space-y-1.5 mb-4">
            <Label>Nome do tipo de documento</Label>
            <Input
              value={form.tipoOutro}
              onChange={(e) => set("tipoOutro", e.target.value)}
              placeholder="Ex: Termo de Confidencialidade"
            />
          </div>
        )}

        <div className="space-y-1.5 mb-4">
          <Label>Destinatário (opcional)</Label>
          <Input value={form.destinatario} onChange={(e) => set("destinatario", e.target.value)} placeholder="Nome do cliente ou empresa" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Conteúdo</Label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => aplicarMarcador("**")}
                title="Negrito (selecione o texto)"
                className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => aplicarMarcador("__")}
                title="Sublinhado (selecione o texto)"
                className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => aplicarMarcador("++")}
                title="Aumentar fonte (selecione o texto)"
                className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ALargeSmall className="h-4 w-4" />
              </button>
            </div>
          </div>
          <textarea
            ref={corpoRef}
            value={form.corpo}
            onChange={(e) => set("corpo", e.target.value)}
            rows={14}
            placeholder="Escreva aqui o texto da proposta, orçamento ou comunicado…"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y font-mono"
          />
          <p className="text-xs text-zinc-400">
            Use uma linha em branco para separar parágrafos. Selecione um trecho e clique em <strong>B</strong>, <strong>S</strong> ou <strong>A+</strong> para formatar.
          </p>
        </div>
      </motion.div>

      {/* Botão */}
      <Button variant="neon" className="w-full" onClick={gerarPDF} disabled={generating}>
        {generating
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
          : <><FileDown className="h-4 w-4 mr-2" /> {currentId ? "Atualizar e Gerar PDF" : "Gerar PDF"}</>}
      </Button>

      {/* Histórico */}
      {recentes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Últimos Termos</h2>
          </div>
          <div className="space-y-2.5">
            {recentes.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  currentId === t.id
                    ? "border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-900/15"
                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <span className="shrink-0 h-9 px-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[10px] font-bold uppercase text-center">
                  {tipoBadgeLabel(t)}
                </span>
                <button onClick={() => carregarTermo(t)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{t.titulo}</p>
                  <p className="text-xs text-zinc-400 truncate">
                    {t.destinatario ? `${t.destinatario} · ` : ""}
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </button>
                <button
                  onClick={() => carregarTermo(t)}
                  className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => reimprimir(t)}
                  className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  title="Baixar PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => excluirTermo(t.id, t.titulo)}
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
