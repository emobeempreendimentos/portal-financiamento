"use client";

import { useEffect, useState, useCallback } from "react";
import { Etapa } from "@/types";

export function useFinanciamento(financiamentoId?: string) {
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!financiamentoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard`);
      const data = await res.json();
      setEtapas(data.data?.financiamento?.etapas || []);
    } finally {
      setLoading(false);
    }
  }, [financiamentoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateEtapa(etapaId: string, updates: Partial<Etapa>) {
    const res = await fetch(`/api/etapas/${etapaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Erro ao atualizar etapa");
    const json = await res.json();
    setEtapas((prev) => prev.map((e) => (e.id === etapaId ? { ...e, ...json.data } : e)));
    return json.data as Etapa;
  }

  return { etapas, loading, updateEtapa, reload: load };
}
