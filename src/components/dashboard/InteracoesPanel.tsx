"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, PenLine, Send, Loader2,
  ArrowRightLeft, CheckCircle2, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Historico } from "@/types";
import { useToast } from "@/components/ui/toast";

interface InteracoesPanelProps {
  historico: Historico[];
  clienteId?: string;
  isAdmin?: boolean;
  onNovaInteracao?: (nova: Historico) => void;
}

function getIconeInteracao(campo: string) {
  switch (campo) {
    case "nota": return { Icon: MessageSquare, cor: "bg-blue-500", texto: "Nota" };
    case "status": return { Icon: ArrowRightLeft, cor: "bg-orange-500", texto: "Status" };
    case "statusGeral": return { Icon: CheckCircle2, cor: "bg-green-500", texto: "Status Geral" };
    default: return { Icon: PenLine, cor: "bg-zinc-500", texto: "Atualização" };
  }
}

export function InteracoesPanel({ historico, clienteId, isAdmin, onNovaInteracao }: InteracoesPanelProps) {
  const { addToast } = useToast();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState<Historico[]>(historico);

  async function handleEnviar() {
    if (!texto.trim() || !clienteId) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/interacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: texto.trim() }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const nova = json.data as Historico;
      setLista((prev) => [nova, ...prev]);
      onNovaInteracao?.(nova);
      setTexto("");
      addToast({ title: "Interação registrada!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao registrar interação", variant: "error" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-zinc-400" />
        <h2 className="font-semibold text-zinc-900 dark:text-white">Interações</h2>
        <span className="ml-auto text-xs text-zinc-400">{lista.length} registro{lista.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Input para admin */}
      {isAdmin && clienteId && (
        <div className="space-y-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Registre uma nova interação, observação ou anotação..."
            rows={3}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          <div className="flex justify-end">
            <Button
              variant="neon"
              size="sm"
              onClick={handleEnviar}
              disabled={enviando || !texto.trim()}
            >
              {enviando ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Registrando...</>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1.5" /> Registrar</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {lista.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Nenhuma interação registrada ainda.
        </div>
      ) : (
        <div className="relative space-y-0">
          <AnimatePresence initial={false}>
            {lista.map((item, index) => {
              const { Icon, cor } = getIconeInteracao(item.campo);
              const isLast = index === lista.length - 1;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {/* Linha vertical */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-8 w-0.5 h-full bg-zinc-100 dark:bg-zinc-800" />
                  )}

                  {/* Ícone */}
                  <div className={`relative z-10 flex-shrink-0 h-8 w-8 rounded-full ${cor} flex items-center justify-center shadow-sm`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-2.5">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {item.descricao}
                      </p>
                      {item.valorAnterior && item.valorNovo && (
                        <p className="text-xs text-zinc-400 mt-1">
                          <span className="line-through">{item.valorAnterior}</span>
                          {" → "}
                          <span className="text-green-600 dark:text-green-400 font-medium">{item.valorNovo}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <User className="h-3 w-3 text-zinc-400" />
                      <span className="text-xs text-zinc-400">
                        {item.criadoPor} · {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
