"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Upload, Trash2, Download, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Documento } from "@/types";

const TIPOS = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "renda", label: "Comprovante de Renda" },
  { value: "contrato", label: "Contrato" },
  { value: "itbi", label: "ITBI" },
  { value: "outro", label: "Outro" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR");
}

interface DocumentosPanelProps {
  financiamentoId: string;
  isAdmin?: boolean;
}

export function DocumentosPanel({ financiamentoId, isAdmin = false }: DocumentosPanelProps) {
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState("outro");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetch(`/api/documentos?financiamentoId=${financiamentoId}`)
      .then((r) => r.json())
      .then((d) => setDocumentos(d.data || []))
      .finally(() => setLoading(false));
  }, [financiamentoId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("financiamentoId", financiamentoId);
        fd.append("tipo", tipoSelecionado);
        const res = await fetch("/api/documentos", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Falha no upload");
        const json = await res.json();
        setDocumentos((prev) => [json.data, ...prev]);
      }
      addToast({ title: "Documento(s) enviado(s)!", variant: "success" });
      setShowUpload(false);
    } catch {
      addToast({ title: "Erro ao enviar documento", variant: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
      addToast({ title: "Documento removido", variant: "success" });
    } catch {
      addToast({ title: "Erro ao remover", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Documentos</h2>
          {documentos.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
              {documentos.length}
            </span>
          )}
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Enviar
          </Button>
        )}
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showUpload && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tipo do documento</label>
                  <select
                    value={tipoSelecionado}
                    onChange={(e) => setTipoSelecionado(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <Button variant="ghost" size="icon" className="mt-5" onClick={() => setShowUpload(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                className="w-full"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                  : <><Upload className="h-4 w-4 mr-2" />Selecionar arquivo(s)</>
                }
              </Button>
              <p className="text-xs text-zinc-400 text-center">PDF, JPG, PNG, DOC — máx. 10MB por arquivo</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
        </div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Nenhum documento enviado
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => {
            const tipoLabel = TIPOS.find((t) => t.value === doc.tipo)?.label || doc.tipo;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{doc.nome}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {tipoLabel} · {formatBytes(doc.tamanho)} · {formatData(doc.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/api/documentos/${doc.id}/download`}
                    download={doc.nome}
                    className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors"
                    title="Baixar"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remover"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
