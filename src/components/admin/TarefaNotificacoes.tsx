"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { TAREFAS_CHANGED_EVENT, hojeISO } from "@/lib/tarefas";

interface Agendada {
  id: string;
  titulo: string;
  dataLimite: string | null;
  hora: string | null;
}

const INTERVALO_MS = 30_000;
const STORAGE_KEY = "tarefas_notificadas";

/**
 * Verifica periodicamente se existe tarefa agendada para o horário atual
 * e avisa uma única vez por tarefa (por dia).
 */
export function TarefaNotificacoes() {
  const { addToast } = useToast();
  const notificadas = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Recupera as já notificadas de hoje (evita repetir ao trocar de página)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { dia, ids } = JSON.parse(raw) as { dia: string; ids: string[] };
        if (dia === hojeISO()) notificadas.current = new Set(ids);
      }
    } catch { /* ignora */ }

    let ativo = true;

    const persistir = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ dia: hojeISO(), ids: [...notificadas.current] })
        );
      } catch { /* ignora */ }
    };

    const verificar = async () => {
      try {
        const res = await fetch("/api/admin/tarefas/resumo");
        const json = await res.json();
        if (!ativo || !json.success) return;

        const agora = new Date();
        const hoje = hojeISO(agora);
        const hhmm = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

        (json.data.agendadas as Agendada[]).forEach((t) => {
          if (t.dataLimite !== hoje || !t.hora) return;
          // Dispara quando a hora marcada chega (tolerância de 1 min para trás)
          const [h, m] = t.hora.split(":").map(Number);
          const [ah, am] = hhmm.split(":").map(Number);
          const minutosTarefa = h * 60 + m;
          const minutosAgora = ah * 60 + am;
          const chegou = minutosAgora >= minutosTarefa && minutosAgora - minutosTarefa <= 1;

          if (chegou && !notificadas.current.has(t.id)) {
            notificadas.current.add(t.id);
            persistir();
            addToast({
              title: "Você possui uma tarefa agendada para agora.",
              description: t.titulo,
              variant: "warning",
            });
          }
        });
      } catch { /* silencioso */ }
    };

    verificar();
    const timer = setInterval(verificar, INTERVALO_MS);
    window.addEventListener(TAREFAS_CHANGED_EVENT, verificar);

    return () => {
      ativo = false;
      clearInterval(timer);
      window.removeEventListener(TAREFAS_CHANGED_EVENT, verificar);
    };
  }, [addToast]);

  return null;
}
