"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, User as UserIcon, KeyRound, Eye, EyeOff, Users, XCircle, RotateCcw, FileDown, Play, PauseCircle, CheckCircle2, Hash, DollarSign, Settings, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EditStepForm } from "@/components/admin/EditStepForm";
import { PendenciasPanel } from "@/components/admin/PendenciasPanel";
import { DocumentosPanel } from "@/components/admin/DocumentosPanel";
import { FinanceiroTab } from "@/components/admin/FinanceiroTab";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { InteracoesPanel } from "@/components/dashboard/InteracoesPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { calcularProgresso, getInitials } from "@/lib/utils";
import { User, Financiamento, Etapa, Historico, Pendencia } from "@/types";

function diasSemMovimento(updatedAt?: string | null): number {
  if (!updatedAt) return 999;
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
}

function corAtividade(dias: number) {
  if (dias <= 5)  return { bg: "#dcfce7", text: "#15803d", dot: "#22c55e", label: "Ativo" };
  if (dias <= 10) return { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", label: "Atenção" };
  return           { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", label: "Parado" };
}

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
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", cpf: "", conjuge: "", conjugeCpf: "", conjugeEmail: "", conjugeTelefone: "", banco: "" });
  const [novaSenha, setNovaSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [salvandoCancelamento, setSalvandoCancelamento] = useState(false);
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<"processo" | "financeiro">("processo");
  const [editing, setEditing] = useState(false);
  const [savedForm, setSavedForm] = useState({ nome: "", email: "", telefone: "", cpf: "", conjuge: "", conjugeCpf: "", conjugeEmail: "", conjugeTelefone: "", banco: "" });

  useEffect(() => {
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then(async (d) => {
        setCliente(d.data);
        const u = d.data;
        const initialForm = {
          nome: u.nome || "", email: u.email || "",
          telefone: u.telefone || "", cpf: u.cpf || "",
          conjuge: u.conjuge || "",
          conjugeCpf: u.conjugeCpf || "",
          conjugeEmail: u.conjugeEmail || "",
          conjugeTelefone: u.conjugeTelefone || "",
          banco: u.banco || "",
        };
        setForm(initialForm);
        setSavedForm(initialForm);
        // Fetch pendências for this financiamento
        if (u.financiamento?.id) {
          const pRes = await fetch(`/api/admin/pendencias?financiamentoId=${u.financiamento.id}`);
          if (pRes.ok) {
            const pJson = await pRes.json();
            setPendencias(pJson.data || []);
          }
        }
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
      setSavedForm(form);
      setEditing(false);
      addToast({ title: "Cliente atualizado!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao salvar", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAlterarSenha() {
    if (!novaSenha.trim() || novaSenha.length < 6) {
      addToast({ title: "A senha deve ter ao menos 6 caracteres", variant: "error" });
      return;
    }
    setSavingSenha(true);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, senha: novaSenha }),
      });
      if (!res.ok) throw new Error();
      setNovaSenha("");
      addToast({ title: "Senha alterada com sucesso!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao alterar senha", variant: "error" });
    } finally {
      setSavingSenha(false);
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

  async function handleMudarStatus(action: string) {
    if (!cliente?.financiamento?.id) return;
    setSalvandoStatus(true);
    try {
      const res = await fetch(`/api/admin/financiamentos/${cliente.financiamento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCliente((prev) => prev ? { ...prev, financiamento: prev.financiamento ? { ...prev.financiamento, ...json.data } : null } : prev);
      const labels: Record<string, string> = { pausar: "Processo pausado", concluir: "Processo concluído!", em_andamento: "Processo reativado!" };
      addToast({ title: labels[action] || "Status atualizado", variant: "success" });
    } catch {
      addToast({ title: "Erro ao atualizar status", variant: "error" });
    } finally {
      setSalvandoStatus(false);
    }
  }

  function handleExportarPDF() {
    window.open(`/admin/clientes/${id}/relatorio`, "_blank");
  }

  async function handleCancelar() {
    if (!cliente?.financiamento?.id) return;
    setSalvandoCancelamento(true);
    try {
      const res = await fetch(`/api/admin/financiamentos/${cliente.financiamento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancelar", motivo: motivoCancelamento.trim() }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCliente((prev) => prev ? { ...prev, financiamento: prev.financiamento ? { ...prev.financiamento, ...json.data } : null } : prev);
      addToast({ title: "Processo cancelado", variant: "success" });
    } catch {
      addToast({ title: "Erro ao cancelar processo", variant: "error" });
    } finally {
      setSalvandoCancelamento(false);
    }
  }

  async function handleReativar() {
    if (!cliente?.financiamento?.id) return;
    setSalvandoCancelamento(true);
    try {
      const res = await fetch(`/api/admin/financiamentos/${cliente.financiamento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reativar" }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCliente((prev) => prev ? { ...prev, financiamento: prev.financiamento ? { ...prev.financiamento, ...json.data } : null } : prev);
      setMotivoCancelamento("");
      addToast({ title: "Processo reativado!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao reativar processo", variant: "error" });
    } finally {
      setSalvandoCancelamento(false);
    }
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
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">{cliente.email}</p>
                {cliente.financiamento?.protocolo && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    <Hash className="h-3 w-3" />
                    EMB-{String(cliente.financiamento.protocolo).padStart(5, "0")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={progresso === 100 ? "success" : "info"}>
            {progresso}% concluído
          </Badge>
          {cliente.financiamento && ["em_andamento", "pausado"].includes(cliente.financiamento.statusGeral) && (() => {
            const dias = diasSemMovimento(cliente.financiamento!.updatedAt);
            const cor = corAtividade(dias);
            return (
              <span
                style={{ backgroundColor: cor.bg, color: cor.text }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                title={`${dias} dia${dias !== 1 ? "s" : ""} sem movimentação`}
              >
                <span style={{ backgroundColor: cor.dot }} className="h-2 w-2 rounded-full shrink-0" />
                {cor.label} · {dias}d
              </span>
            );
          })()}
          <a
            href={`/admin/clientes/${id}/relatorio`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </a>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar progresso={progresso} />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl w-fit">
        {([
          { key: "processo", label: "Processo", icon: Settings },
          { key: "financeiro", label: "Financeiro", icon: DollarSign },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── ABA FINANCEIRO ── */}
      {activeTab === "financeiro" && cliente.financiamento && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <FinanceiroTab
            financiamentoId={cliente.financiamento.id}
            clienteId={id}
            banco={cliente.banco}
            statusGeral={cliente.financiamento.statusGeral}
            dataInicio={cliente.financiamento.createdAt}
            clienteNome={cliente.nome}
            protocolo={cliente.financiamento.protocolo}
          />
        </motion.div>
      )}

      {/* ── ABA PROCESSO ── */}
      {activeTab === "processo" && <>

      {/* Status do Processo */}
      {cliente.financiamento && cliente.financiamento.statusGeral !== "cancelado" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
        >
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Status do Processo</p>
          <div className="flex flex-wrap gap-2">
            {[
              { action: "em_andamento", label: "Em Andamento", icon: Play,         active: cliente.financiamento.statusGeral === "em_andamento", color: "bg-green-500 hover:bg-green-600 text-white" },
              { action: "pausar",       label: "Pausar",        icon: PauseCircle,  active: cliente.financiamento.statusGeral === "pausado",      color: "bg-amber-500 hover:bg-amber-600 text-white" },
              { action: "concluir",     label: "Concluído",     icon: CheckCircle2, active: cliente.financiamento.statusGeral === "concluido",    color: "bg-blue-500 hover:bg-blue-600 text-white" },
            ].map((btn) => (
              <button
                key={btn.action}
                onClick={() => !btn.active && handleMudarStatus(btn.action)}
                disabled={salvandoStatus || btn.active}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  btn.active
                    ? btn.color + " opacity-100 ring-2 ring-offset-2 ring-current cursor-default"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                } disabled:opacity-60`}
              >
                <btn.icon className="h-3.5 w-3.5" />
                {btn.label}
                {btn.active && <span className="text-xs opacity-75 ml-1">(atual)</span>}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Dados do Cliente */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <UserIcon className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Dados do Cliente</h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="ml-auto p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              title="Editar dados"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: "nome", label: "Nome Completo", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "telefone", label: "Telefone", type: "tel" },
            { name: "cpf", label: "CPF", type: "text" },
            { name: "conjuge", label: "Cônjuge (nome)", type: "text" },
            { name: "banco", label: "Banco Financiador", type: "text" },
          ].map((field) => (
            <div key={field.name} className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{field.label}</p>
              {editing ? (
                <Input
                  id={field.name}
                  type={field.type}
                  value={form[field.name as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-zinc-900 dark:text-white py-1.5 min-h-[34px] flex items-center">
                  {form[field.name as keyof typeof form] || <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Campos adicionais do cônjuge */}
        <AnimatePresence>
          {form.conjuge.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Dados do Cônjuge
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: "conjugeCpf", label: "CPF do Cônjuge", type: "text", placeholder: "000.000.000-00" },
                    { name: "conjugeEmail", label: "Email do Cônjuge", type: "email", placeholder: "email@exemplo.com" },
                    { name: "conjugeTelefone", label: "Telefone do Cônjuge", type: "tel", placeholder: "(00) 00000-0000" },
                  ].map((field) => (
                    <div key={field.name} className="space-y-1">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{field.label}</p>
                      {editing ? (
                        <Input
                          id={field.name}
                          type={field.type}
                          value={form[field.name as keyof typeof form]}
                          onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <p className="text-sm text-zinc-900 dark:text-white py-1.5 min-h-[34px] flex items-center">
                          {form[field.name as keyof typeof form] || <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-3 mt-5">
                <Button variant="neon" className="flex-1" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setForm(savedForm); setEditing(false); }}
                  disabled={saving}
                  className="px-5"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Alterar Senha */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Alterar Senha do Cliente</h2>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={showSenha ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            variant="neon"
            onClick={handleAlterarSenha}
            disabled={savingSenha || !novaSenha.trim()}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {savingSenha ? "Alterando..." : "Alterar Senha"}
          </Button>
        </div>
        <p className="text-xs text-zinc-400 mt-3">
          Somente o administrador pode alterar senhas. O cliente não tem acesso a esta função.
        </p>
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

      {/* Documentos */}
      {cliente.financiamento && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
        >
          <DocumentosPanel financiamentoId={cliente.financiamento.id} isAdmin />
        </motion.div>
      )}

      {/* Cancelamento */}
      {cliente.financiamento && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {cliente.financiamento.statusGeral === "cancelado" ? (
            /* Processo já cancelado — banner + botão reativar */
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="font-semibold text-red-700 dark:text-red-400">Processo Cancelado</h2>
                  <p className="text-xs text-red-500 mt-0.5">
                    Cancelado em {new Date(cliente.financiamento.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                  {cliente.financiamento.motivoCancelamento && (
                    <div className="mt-3 p-3 rounded-xl bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Justificativa</p>
                      <p className="text-sm text-red-800 dark:text-red-300">{cliente.financiamento.motivoCancelamento}</p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400"
                onClick={handleReativar}
                disabled={salvandoCancelamento}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {salvandoCancelamento ? "Reativando..." : "Reativar Processo"}
              </Button>
            </div>
          ) : (
            /* Processo ativo — card para cancelar */
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-white">Cancelar Processo</h2>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Justificativa do cancelamento
                </label>
                <textarea
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Descreva o motivo do cancelamento..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
                <p className="text-xs text-zinc-400">
                  A justificativa será exibida para o cliente no acesso dele.
                </p>
              </div>
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancelar}
                disabled={salvandoCancelamento || !motivoCancelamento.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {salvandoCancelamento ? "Cancelando..." : "Cancelar Processo"}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Pendências */}
      {cliente.financiamento && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PendenciasPanel
            financiamentoId={cliente.financiamento.id}
            initialPendencias={pendencias}
          />
        </motion.div>
      )}

      {/* Interações */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <InteracoesPanel
          historico={historico}
          clienteId={id}
          isAdmin
        />
      </motion.div>

      </> /* fim aba processo */}
    </div>
  );
}
