"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, User as UserIcon, KeyRound, Eye, EyeOff, Users, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EditStepForm } from "@/components/admin/EditStepForm";
import { PendenciasPanel } from "@/components/admin/PendenciasPanel";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { InteracoesPanel } from "@/components/dashboard/InteracoesPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { calcularProgresso, getInitials } from "@/lib/utils";
import { User, Financiamento, Etapa, Historico, Pendencia } from "@/types";

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

  useEffect(() => {
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then(async (d) => {
        setCliente(d.data);
        const u = d.data;
        setForm({
          nome: u.nome || "", email: u.email || "",
          telefone: u.telefone || "", cpf: u.cpf || "",
          conjuge: u.conjuge || "",
          conjugeCpf: u.conjugeCpf || "",
          conjugeEmail: u.conjugeEmail || "",
          conjugeTelefone: u.conjugeTelefone || "",
          banco: u.banco || "",
        });
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
            { name: "conjuge", label: "Cônjuge (nome)", type: "text" },
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

        {/* Campos adicionais do cônjuge — aparecem quando o nome é preenchido */}
        <AnimatePresence>
          {form.conjuge.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Dados do Cônjuge
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: "conjugeCpf", label: "CPF do Cônjuge", type: "text" },
                    { name: "conjugeEmail", label: "Email do Cônjuge", type: "email" },
                    { name: "conjugeTelefone", label: "Telefone do Cônjuge", type: "tel" },
                  ].map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      <Input
                        id={field.name}
                        type={field.type}
                        value={form[field.name as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                        placeholder={
                          field.name === "conjugeCpf" ? "000.000.000-00" :
                          field.name === "conjugeEmail" ? "email@exemplo.com" : "(00) 00000-0000"
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button variant="neon" className="w-full mt-5" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
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
    </div>
  );
}
