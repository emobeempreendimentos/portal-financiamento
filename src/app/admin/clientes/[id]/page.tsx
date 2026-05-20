"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, User as UserIcon, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EditStepForm } from "@/components/admin/EditStepForm";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { calcularProgresso, formatDateTime, getInitials } from "@/lib/utils";
import { User, Financiamento, Etapa, Historico } from "@/types";

interface ClienteDetalhado extends User {
  financiamento: (Financiamento & {
    etapas: Etapa[];
    historico: Historico[];
  }) | null;
}

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [cliente, setCliente] = useState<ClienteDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", cpf: "", conjuge: "", banco: "" });

  useEffect(() => {
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCliente(d.data);
        const u = d.data;
        setForm({
          nome: u.nome || "", email: u.email || "",
          telefone: u.telefone || "", cpf: u.cpf || "",
          conjuge: u.conjuge || "", banco: u.banco || "",
        });
      })
      .catch(() => addToast({ title: "Erro ao carregar cliente", variant: "error" }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setCliente((prev) => prev ? { ...prev, ...d.data } : prev);
      addToast({ title: "Cliente atualizado!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao salvar", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateEtapa(etapaId: string, data: Partial<Etapa>) {
    const res = await fetch(`/api/etapas/${etapaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar");
    const json = await res.json();
    setCliente((prev) => {
      if (!prev?.financiamento) return prev;
      return {
        ...prev,
        financiamento: {
          ...prev.financiamento,
          etapas: prev.financiamento.etapas.map((e) =>
            e.id === etapaId ? { ...e, ...json.data } : e
          ),
        },
      };
    });
  }

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!cliente) return <p className="text-zinc-500">Cliente não encontrado</p>;

  const etapas = cliente.financiamento?.etapas || [];
  const historico = cliente.financiamento?.historico || [];
  const progresso = calcularProgresso(etapas);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
              {getInitials(cliente.nome)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{cliente.nome}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{cliente.email}</p>
            </div>
          </div>
        </div>
        <Badge variant={progresso === 100 ? "success" : "info"}>
          {progresso}% concluído
        </Badge>
      </div>

      {/* Progress */}
      <ProgressBar progresso={progresso} />

      {/* Edit client data */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <UserIcon className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Dados do Cliente</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: "nome", label: "Nome Completo", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "telefone", label: "Telefone", type: "tel" },
            { name: "cpf", label: "CPF", type: "text" },
            { name: "conjuge", label: "Cônjuge", type: "text" },
            { name: "banco", label: "Banco Financiador", type: "text" },
          ].map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type}
                value={form[field.name as keyof typeof form]}
                onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button variant="neon" className="w-full mt-5" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </motion.div>

      {/* Etapas */}
      {etapas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Etapas do Financiamento</h2>
          <div className="space-y-3">
            {etapas.map((etapa) => (
              <EditStepForm key={etapa.id} etapa={etapa} onUpdate={handleUpdateEtapa} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-900 dark:text-white">Histórico de Alterações</h2>
          </div>
          <div className="space-y-2">
            {historico.map((h) => (
              <div key={h.id} className="flex items-start gap-3 py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{h.descricao}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {formatDateTime(h.createdAt)} · por {h.criadoPor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
