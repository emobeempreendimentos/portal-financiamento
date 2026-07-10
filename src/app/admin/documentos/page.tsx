"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Trash2, Download, Eye, X, Loader2,
  Search, Plus, FolderOpen, FileType2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface DocumentoImportante {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria: string;
  nomeArquivo: string;
  tamanho: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

const CATEGORIAS = [
  { value: "contrato", label: "Contratos" },
  { value: "modelo", label: "Modelos" },
  { value: "certidao", label: "Certidões" },
  { value: "manual", label: "Manuais" },
  { value: "outro", label: "Outros" },
];

const CATEGORIA_COR: Record<string, string> = {
  contrato: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  modelo: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  certidao: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  manual: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  outro: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function fmtTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const FORM_VAZIO = { titulo: "", descricao: "", categoria: "outro" };

export default function DocumentosPage() {
  const { addToast } = useToast();
  const [documentos, setDocumentos] = useState<DocumentoImportante[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria) params.set("categoria", filtroCategoria);
      if (busca.trim()) params.set("busca", busca.trim());
      const res = await fetch(`/api/admin/documentos?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setDocumentos(json.data || []);
    } catch {
      addToast({ title: "Erro ao carregar documentos", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria, busca]);

  useEffect(() => {
    const t = setTimeout(carregar, busca ? 300 : 0);
    return () => clearTimeout(t);
  }, [carregar, busca]);

  function abrirModal() {
    setForm(FORM_VAZIO);
    setArquivo(null);
    setModalOpen(true);
  }

  function selecionarArquivo(f: File | null) {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      addToast({ title: "Arquivo muito grande. Máximo: 10MB", variant: "error" });
      return;
    }
    setArquivo(f);
    if (!form.titulo.trim()) {
      setForm((p) => ({ ...p, titulo: f.name.replace(/\.[^.]+$/, "") }));
    }
  }

  async function enviar() {
    if (!form.titulo.trim()) {
      addToast({ title: "Informe um título", variant: "error" });
      return;
    }
    if (!arquivo) {
      addToast({ title: "Selecione um arquivo", variant: "error" });
      return;
    }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append("file", arquivo);
      fd.append("titulo", form.titulo);
      fd.append("descricao", form.descricao);
      fd.append("categoria", form.categoria);

      const res = await fetch("/api/admin/documentos", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);

      addToast({ title: "Documento cadastrado!", variant: "success" });
      setModalOpen(false);
      carregar();
    } catch (e) {
      addToast({ title: e instanceof Error ? e.message : "Erro ao enviar", variant: "error" });
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(id: string, titulo: string) {
    if (!confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/documentos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocumentos((p) => p.filter((d) => d.id !== id));
      addToast({ title: "Documento excluído", variant: "success" });
    } catch {
      addToast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Documentos</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Documentos importantes e PDFs da imobiliária</p>
        </div>
        <button onClick={abrirModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="h-4 w-4" />Novo Documento
        </button>
      </motion.div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, descrição ou arquivo…"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : documentos.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-16 flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {busca || filtroCategoria ? "Nenhum documento encontrado" : "Nenhum documento cadastrado ainda"}
          </p>
          {!busca && !filtroCategoria && (
            <button onClick={abrirModal} className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium">
              + Cadastrar primeiro documento
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="group rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  {doc.mimeType === "application/pdf"
                    ? <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    : <FileType2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{doc.titulo}</p>
                  <p className="text-xs text-zinc-400 truncate">{doc.nomeArquivo}</p>
                </div>
                <button
                  onClick={() => excluir(doc.id, doc.titulo)}
                  className="shrink-0 p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {doc.descricao && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">{doc.descricao}</p>
              )}

              <div className="flex items-center gap-2 mb-4 mt-auto">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORIA_COR[doc.categoria] ?? CATEGORIA_COR.outro}`}>
                  {CATEGORIAS.find((c) => c.value === doc.categoria)?.label ?? doc.categoria}
                </span>
                <span className="text-[10px] text-zinc-400">{fmtTamanho(doc.tamanho)}</span>
                <span className="text-[10px] text-zinc-400">· {new Date(doc.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/api/admin/documentos/${doc.id}/download?inline=1`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Visualizar
                </a>
                <a
                  href={`/api/admin/documentos/${doc.id}/download`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de upload */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !enviando && setModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-zinc-900 dark:text-white">Novo Documento</h2>
                <button onClick={() => setModalOpen(false)} disabled={enviando}
                  className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); selecionarArquivo(e.dataTransfer.files?.[0] ?? null); }}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                    arquivo
                      ? "border-green-400 bg-green-50/60 dark:bg-green-900/15"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-green-300 dark:hover:border-green-800"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)}
                  />
                  {arquivo ? (
                    <>
                      <FileText className="h-7 w-7 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{arquivo.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{fmtTamanho(arquivo.size)} · clique para trocar</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 text-zinc-400 mx-auto mb-2" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">Clique ou arraste o arquivo aqui</p>
                      <p className="text-xs text-zinc-400 mt-0.5">PDF, Word, Excel ou imagem · até 10MB</p>
                    </>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título *</label>
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ex: Contrato padrão de compra e venda"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                    rows={3}
                    placeholder="Informação adicional sobre o documento (opcional)"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} disabled={enviando}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={enviar} disabled={enviando}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                  {enviando ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Upload className="h-4 w-4" /> Cadastrar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
