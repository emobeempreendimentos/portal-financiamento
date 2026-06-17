"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Avaliacao } from "@/types";

interface Props {
  onSubmitted: (avaliacao: Avaliacao) => void;
}

export function SatisfactionSurvey({ onSubmitted }: Props) {
  const { addToast } = useToast();
  const [nota, setNota] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [recomendaria, setRecomendaria] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const starLabel = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"];
  const display = hovered || nota;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nota) { addToast({ title: "Selecione uma nota", variant: "error" }); return; }
    if (recomendaria === null) { addToast({ title: "Responda se recomendaria a Emobe", variant: "error" }); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota, recomendaria, comentario }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: data.error || "Erro ao enviar avaliação", variant: "error" });
        return;
      }
      setEnviado(true);
      onSubmitted(data.data);
    } catch {
      addToast({ title: "Erro de conexão", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header bar */}
      <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />

      <AnimatePresence mode="wait">
        {enviado ? (
          <motion.div
            key="obrigado"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Obrigado pelo feedback! 🙏</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Sua avaliação nos ajuda a melhorar cada vez mais o atendimento.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >
            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">
                Processo concluído
              </p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Como foi sua experiência com a Emobe?
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Sua opinião é muito importante para nós.
              </p>
            </div>

            {/* Stars */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Avalie seu atendimento
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setNota(i)}
                    className="transition-transform active:scale-90"
                    aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
                  >
                    <Star
                      className="h-9 w-9 transition-all duration-150"
                      style={{
                        fill: i <= display ? "#f59e0b" : "transparent",
                        color: i <= display ? "#f59e0b" : "#d4d4d8",
                        transform: i === display ? "scale(1.18)" : "scale(1)",
                      }}
                    />
                  </button>
                ))}
                <AnimatePresence mode="wait">
                  {display > 0 && (
                    <motion.span
                      key={display}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium text-amber-600 dark:text-amber-400 ml-1"
                    >
                      {starLabel[display]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* NPS */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Recomendaria a Emobe a um amigo ou familiar?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRecomendaria(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    recomendaria === true
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Sim, com certeza
                </button>
                <button
                  type="button"
                  onClick={() => setRecomendaria(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    recomendaria === false
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Não
                </button>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                Comentário
                <span className="text-zinc-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Conte-nos sobre sua experiência, o que podemos melhorar..."
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
              />
              {comentario.length > 0 && (
                <p className="text-xs text-zinc-400 text-right">{comentario.length}/500</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !nota || recomendaria === null}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-semibold rounded-2xl py-3.5 transition-all text-sm shadow-md shadow-green-500/20"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                "Enviar avaliação"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
