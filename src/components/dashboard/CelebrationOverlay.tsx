"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Rocket } from "lucide-react";
import { Etapa } from "@/types";

interface Props {
  etapas: Etapa[];
  onDismiss: () => void;
}

const COLORS = [
  "#22c55e", "#16a34a", "#4ade80", "#86efac",
  "#fbbf24", "#f59e0b", "#fb923c",
  "#60a5fa", "#818cf8", "#a78bfa",
  "#f472b6", "#fb7185",
];

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number;
      rotation: number; rotationSpeed: number;
      shape: "rect" | "circle" | "triangle";
      opacity: number; gravity: number;
    };

    const particles: Particle[] = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 600,
      vx: (Math.random() - 0.5) * 5,
      vy: 1.5 + Math.random() * 3.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 7 + Math.random() * 9,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      shape: (["rect", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
      opacity: 1,
      gravity: 0.04 + Math.random() * 0.02,
    }));

    function drawTriangle(ctx: CanvasRenderingContext2D, size: number) {
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allDone = true;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.995;
        p.rotation += p.rotationSpeed;

        const fadeStart = canvas.height * 0.65;
        if (p.y > fadeStart) {
          p.opacity = Math.max(0, 1 - (p.y - fadeStart) / (canvas.height * 0.35));
        }
        if (p.y < canvas.height && p.opacity > 0) allDone = false;

        if (p.opacity <= 0) continue;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "triangle") {
          drawTriangle(ctx, p.size);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }

      if (!allDone) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

export function CelebrationOverlay({ etapas, onDismiss }: Props) {
  const visible = etapas.length > 0;
  const isMultiple = etapas.length > 1;
  const isAll = etapas.some((e) => e.nome === "Entrega das Chaves");

  // Auto-dismiss after 7s
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 7000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={onDismiss}
        >
          <Confetti active={visible} />

          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
            className="relative w-full max-w-sm mx-4"
            style={{ zIndex: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
              {/* Green top bar */}
              <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

              <div className="p-8 text-center">
                <button
                  onClick={onDismiss}
                  className="absolute top-5 right-5 h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.25 }}
                  className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 relative"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  {/* Ping ring */}
                  <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-30" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-[0.15em] mb-2"
                >
                  {isMultiple ? "Novas etapas concluídas!" : "Nova etapa concluída!"}
                </motion.p>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight"
                >
                  {isMultiple
                    ? `${etapas.length} etapas avançadas`
                    : etapas[0]?.nome}
                </motion.h2>

                {isMultiple && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="text-sm text-zinc-500 dark:text-zinc-400 mb-1"
                  >
                    {etapas.map((e) => e.nome).join(" · ")}
                  </motion.p>
                )}

                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-zinc-500 dark:text-zinc-400 mt-2"
                >
                  {isAll
                    ? "🎊 Parabéns! Você concluiu todo o processo!"
                    : "Seu financiamento está avançando! Continue acompanhando."}
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  onClick={onDismiss}
                  className="mt-7 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold rounded-2xl py-3.5 transition-all text-sm shadow-lg shadow-green-500/20"
                >
                  <Rocket className="h-4 w-4" />
                  Ver o progresso
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
