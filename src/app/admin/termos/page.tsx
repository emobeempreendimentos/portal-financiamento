"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileDown, Printer, History, Trash2, Plus,
  Bold, Italic, Underline, List, ListOrdered, ALargeSmall,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface TermoRow {
  id: string;
  titulo: string;
  tipo: string;
  tipoOutro?: string | null;
  destinatario?: string | null;
  corpo: string; // agora armazena HTML
  createdAt: string;
}

const TIPOS = [
  { value: "proposta", label: "Proposta" },
  { value: "orcamento", label: "Orçamento" },
  { value: "comunicado", label: "Comunicado" },
  { value: "outro", label: "Outro" },
] as const;

type TipoValue = (typeof TIPOS)[number]["value"];

const TITULO_TIPO: Record<string, string> = {
  proposta: "PROPOSTA COMERCIAL",
  orcamento: "ORÇAMENTO",
  comunicado: "COMUNICADO",
  outro: "DOCUMENTO",
};

function tituloDocumento(tipo: string, tipoOutro: string): string {
  if (tipo === "outro" && tipoOutro.trim()) return tipoOutro.trim().toUpperCase();
  return TITULO_TIPO[tipo] || TITULO_TIPO.outro;
}

const TAMANHOS_FONTE = [14, 16, 18, 20, 24, 28];

function tipoBadgeLabel(t: TermoRow): string {
  if (t.tipo === "outro" && t.tipoOutro?.trim()) return t.tipoOutro.trim();
  return TIPOS.find((x) => x.value === t.tipo)?.label ?? t.tipo;
}

export default function TermosPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [tipo, setTipo] = useState<TipoValue>("proposta");
  const [tipoOutro, setTipoOutro] = useState("");
  const [titulo, setTitulo] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [corpoHtml, setCorpoHtml] = useState("");
  const [incluirAssinatura, setIncluirAssinatura] = useState(true);
  const [corretor, setCorretor] = useState("");

  const [recentes, setRecentes] = useState<TermoRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  const textoPuro = corpoHtml.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  const podeGerar = titulo.trim().length > 0 && textoPuro.length > 0 && !(tipo === "outro" && !tipoOutro.trim());

  // ── Editor de texto rico (contentEditable) ──
  function setEditorHtml(html: string) {
    if (editorRef.current) editorRef.current.innerHTML = html;
    setCorpoHtml(html);
  }
  function onEditorInput() {
    if (editorRef.current) setCorpoHtml(editorRef.current.innerHTML);
  }
  function exec(cmd: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    if (editorRef.current) setCorpoHtml(editorRef.current.innerHTML);
  }
  // Aplica um tamanho de fonte (px) ao trecho selecionado, envolvendo-o num <span>.
  function aplicarTamanho(px: number) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      addToast({ title: "Selecione o texto para aplicar o tamanho", variant: "error" });
      return;
    }
    // Truque clássico: marca a seleção com um tamanho sentinela e converte para span com o px exato.
    document.execCommand("fontSize", false, "7");
    el.querySelectorAll('font[size="7"]').forEach((f) => {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      span.innerHTML = (f as HTMLElement).innerHTML;
      f.replaceWith(span);
    });
    setCorpoHtml(el.innerHTML);
  }

  // ── Persistência ──
  const carregarRecentes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/termos");
      const json = await res.json();
      if (json.success) setRecentes(json.data || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { carregarRecentes(); }, [carregarRecentes]);

  async function salvar(): Promise<boolean> {
    setSalvando(true);
    try {
      const payload = { titulo, tipo, tipoOutro, destinatario, corpo: corpoHtml };
      const res = await fetch(
        currentId ? `/api/admin/termos/${currentId}` : "/api/admin/termos",
        { method: currentId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setCurrentId(json.data.id);
      await carregarRecentes();
      return true;
    } catch {
      addToast({ title: "Erro ao salvar o documento", variant: "error" });
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function gerar() {
    if (!podeGerar) {
      addToast({ title: "Preencha o título e o conteúdo", variant: "error" });
      return;
    }
    const ok = await salvar();
    if (ok) {
      // A impressão do navegador usa apenas a folha do documento (CSS de impressão).
      // O usuário escolhe "Salvar como PDF" para baixar.
      setTimeout(() => window.print(), 120);
    }
  }

  function carregarTermo(t: TermoRow) {
    setTipo((t.tipo as TipoValue) || "proposta");
    setTipoOutro(t.tipoOutro || "");
    setTitulo(t.titulo || "");
    setDestinatario(t.destinatario || "");
    setEditorHtml(t.corpo || "");
    setCurrentId(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({ title: `"${t.titulo}" reaberto`, variant: "success" });
  }

  function novoTermo() {
    setTipo("proposta");
    setTipoOutro("");
    setTitulo("");
    setDestinatario("");
    setEditorHtml("");
    setCurrentId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirTermo(id: string, tit: string) {
    if (!confirm(`Excluir "${tit}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/termos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRecentes((p) => p.filter((t) => t.id !== id));
      if (currentId === id) setCurrentId(null);
      addToast({ title: "Documento excluído", variant: "success" });
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  const dataHoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const docTitulo = tituloDocumento(tipo, tipoOutro);

  const chipCls = (ativo: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
      ativo
        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400"
        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
    }`;

  const tbBtn =
    "p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors";

  return (
    <div className="space-y-6">
      {/* CSS de impressão: mostra só a folha do documento */}
      <style>{`
        .termo-editor:empty:before { content: attr(data-placeholder); color: #a1a1aa; }
        .termo-doc-body ul { list-style: disc; padding-left: 1.4rem; margin: 0.4rem 0; }
        .termo-doc-body ol { list-style: decimal; padding-left: 1.4rem; margin: 0.4rem 0; }
        .termo-doc-body p { margin: 0 0 0.6rem; }
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .termo-doc, .termo-doc * { visibility: visible !important; }
          .termo-doc {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border: none !important; border-radius: 0 !important;
            padding: 0 !important; margin: 0 !important;
          }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="flex items-center gap-3 no-print">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Termos para Envio</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
            Escreva uma proposta, orçamento ou comunicado no papel timbrado da EMOBE e baixe em PDF.
          </p>
        </div>
        <button
          onClick={novoTermo}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Novo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_1fr] gap-6 items-start">
        {/* ── COLUNA ESQUERDA: FORMULÁRIO ── */}
        <div className="space-y-4 no-print">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white">O documento</h2>

            {/* Tipo (chips) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button key={t.value} type="button" onClick={() => setTipo(t.value)} className={chipCls(tipo === t.value)}>
                    {t.label}
                  </button>
                ))}
              </div>
              {tipo === "outro" && (
                <input
                  value={tipoOutro}
                  onChange={(e) => setTipoOutro(e.target.value)}
                  placeholder="Nome do tipo de documento"
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Título</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Proposta de compra - Apto 302"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Destinatário */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Destinatário (opcional)</label>
              <input
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="Nome do cliente ou empresa"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Conteúdo (editor rico) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Conteúdo</label>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
                  <button type="button" onClick={() => exec("bold")} title="Negrito" className={tbBtn}><Bold className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => exec("italic")} title="Itálico" className={tbBtn}><Italic className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => exec("underline")} title="Sublinhado" className={tbBtn}><Underline className="h-3.5 w-3.5" /></button>
                  <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                  <button type="button" onClick={() => exec("insertUnorderedList")} title="Lista com marcadores" className={tbBtn}><List className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => exec("insertOrderedList")} title="Lista numerada" className={tbBtn}><ListOrdered className="h-3.5 w-3.5" /></button>
                  <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                  <div className="flex items-center gap-1 pl-1">
                    <ALargeSmall className="h-3.5 w-3.5 text-zinc-400" />
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) aplicarTamanho(Number(e.target.value)); e.target.value = ""; }}
                      title="Tamanho da fonte (selecione o texto)"
                      className="bg-transparent text-xs font-medium text-zinc-600 dark:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">Tamanho</option>
                      {TAMANHOS_FONTE.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={onEditorInput}
                  data-placeholder="Escreva aqui a proposta, o orçamento ou o comunicado…"
                  className="termo-editor min-h-[220px] max-h-[420px] overflow-y-auto px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Assinatura */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirAssinatura}
                  onChange={(e) => setIncluirAssinatura(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Incluir linha de assinatura do corretor</span>
              </label>
              {incluirAssinatura && (
                <input
                  value={corretor}
                  onChange={(e) => setCorretor(e.target.value)}
                  placeholder="Nome do corretor (opcional)"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>
          </motion.div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <button
              onClick={gerar}
              disabled={!podeGerar || salvando}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FileDown className="h-4 w-4" /> Baixar PDF
            </button>
            <button
              onClick={gerar}
              disabled={!podeGerar || salvando}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </button>
          </div>
          {!podeGerar && (
            <p className="text-xs text-zinc-400">Preencha o título e o conteúdo para liberar o PDF.</p>
          )}

          {/* Últimos documentos */}
          {recentes.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="flex items-center gap-2 mb-1">
                <History className="h-4 w-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-white">Últimos documentos</h2>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Reabra para reaproveitar o texto.</p>
              <div className="space-y-2.5">
                {recentes.map((t) => (
                  <div key={t.id} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                    currentId === t.id
                      ? "border-green-300 dark:border-green-800 bg-green-50/60 dark:bg-green-900/15"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                  }`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{t.titulo}</p>
                      <p className="text-xs text-zinc-400 truncate">
                        {tipoBadgeLabel(t)} · {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <button
                      onClick={() => carregarTermo(t)}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Reabrir
                    </button>
                    <button
                      onClick={() => excluirTermo(t.id, t.titulo)}
                      className="shrink-0 p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── COLUNA DIREITA: PRÉVIA DO DOCUMENTO ── */}
        <div className="termo-doc rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white shadow-sm p-10 md:p-14 text-zinc-800"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {/* Cabeçalho: logo */}
          <div className="flex justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="EMOBE" style={{ height: 44, width: "auto", objectFit: "contain" }} />
          </div>

          {/* Título do documento */}
          <h2 className="text-center font-bold tracking-wide mb-2" style={{ fontSize: 22 }}>{docTitulo}</h2>
          {titulo.trim() && (
            <p className="text-center mb-8" style={{ fontSize: 13, color: "#555" }}>{titulo.trim()}</p>
          )}
          {!titulo.trim() && <div className="mb-8" />}

          {/* Destinatário */}
          {destinatario.trim() && (
            <p className="mb-5" style={{ fontSize: 14 }}>
              <strong>Destinatário:</strong> {destinatario.trim()}
            </p>
          )}

          {/* Conteúdo */}
          {textoPuro ? (
            <div
              className="termo-doc-body leading-relaxed"
              style={{ fontSize: 14, lineHeight: 1.7, minHeight: 120 }}
              dangerouslySetInnerHTML={{ __html: corpoHtml }}
            />
          ) : (
            <p style={{ fontSize: 14, color: "#a1a1aa", minHeight: 120 }}>[escreva aqui o conteúdo do documento]</p>
          )}

          {/* Data */}
          <p className="mt-8" style={{ fontSize: 14 }}>Itaúna/MG, {dataHoje}.</p>

          {/* Assinatura */}
          {incluirAssinatura && (
            <div className="mt-16 mb-4 text-center">
              <div style={{ borderTop: "1px solid #333", width: 260, margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, fontWeight: "bold" }}>
                {corretor.trim() || "EMOBE Empreendimentos Imobiliários"}
              </p>
              {corretor.trim() && <p style={{ fontSize: 13 }}>EMOBE Empreendimentos Imobiliários</p>}
              <p style={{ fontSize: 13 }}>CRECI 4682J</p>
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-16 pt-4 text-center" style={{ borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>
              EMOBE Empreendimentos Imobiliários · +55 (37) 99925-1577 · contato@emobe.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
