"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, UserPlus, Eye, EyeOff, Calculator, Landmark, Banknote, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ETAPAS_POR_TIPO, TEXTOS_TIPO, TipoVenda } from "@/lib/tipoVenda";

const BANCO_SIMULACAO: Record<string, string> = {
  caixa: "Caixa Econômica Federal",
  banco_brasil: "Banco do Brasil",
  itau: "Banco Itaú",
};

const OPCOES: { tipo: TipoVenda; titulo: string; descricao: string; icon: React.ElementType }[] = [
  {
    tipo: "financiamento",
    titulo: "Venda financiada",
    descricao: "Compra com financiamento bancário: aprovação de crédito e engenharia do banco.",
    icon: Landmark,
  },
  {
    tipo: "avista",
    titulo: "Venda à vista",
    descricao: "Pagamento direto, sem banco: contrato, ITBI, escritura e registro.",
    icon: Banknote,
  },
];

export default function NovoClientePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [tipo, setTipo] = useState<TipoVenda | null>(null);
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", telefone: "",
    cpf: "", conjuge: "", banco: "",
  });

  const [origemSimulacao, setOrigemSimulacao] = useState<string | null>(null);

  // Pré-preenche a partir de uma simulação salva (?simulacao=<id>) — simulação é sempre financiada
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("simulacao");
    if (!id) return;
    fetch(`/api/admin/simulacao?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success || !json.data) return;
        const s = json.data;
        setForm((prev) => ({
          ...prev,
          nome: s.clienteNome || prev.nome,
          cpf: s.clienteCpf || prev.cpf,
          banco: BANCO_SIMULACAO[s.banco] ?? s.banco ?? prev.banco,
        }));
        setOrigemSimulacao(s.clienteNome);
        setTipo("financiamento");
        setEtapa(2);
      })
      .catch(() => { /* silencioso */ });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo) {
      setEtapa(1);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, banco: tipo === "avista" ? "" : form.banco, tipo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar cliente");
      addToast({ title: "Cliente criado com sucesso!", variant: "success" });
      router.push(`/admin/clientes/${data.data.id}`);
    } catch (err) {
      addToast({
        title: "Erro ao criar cliente",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const textos = tipo ? TEXTOS_TIPO[tipo] : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => (etapa === 2 && !origemSimulacao ? setEtapa(1) : router.back())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl md:text-[38px] font-extrabold tracking-[-0.035em] text-zinc-950 dark:text-white">Novo Cliente</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {textos ? `Cadastrar cliente e iniciar o ${textos.processo}` : "Escolha o tipo de venda para começar"}
          </p>
        </div>
      </div>

      {/* Indicador de passos */}
      <div className="flex items-center gap-3 text-xs font-semibold">
        {[
          { n: 1, label: "Tipo de venda" },
          { n: 2, label: "Dados do cliente" },
        ].map((p, i) => (
          <div key={p.n} className="flex items-center gap-3">
            {i > 0 && <span className="h-px w-8 bg-zinc-300 dark:bg-zinc-700" />}
            <span className={cn("flex items-center gap-2", etapa >= p.n ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                  etapa > p.n
                    ? "bg-[#c49e62] text-[#1d1406]"
                    : etapa === p.n
                    ? "bg-[#16181d] text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                )}
              >
                {etapa > p.n ? <Check className="h-3.5 w-3.5" /> : p.n}
              </span>
              {p.label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {etapa === 1 ? (
          <motion.div
            key="tipo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {OPCOES.map((op) => {
                const ativo = tipo === op.tipo;
                return (
                  <button
                    key={op.tipo}
                    type="button"
                    onClick={() => setTipo(op.tipo)}
                    className={cn(
                      "group relative flex flex-col rounded-[20px] bg-white p-5 text-left shadow-soft ring-1 transition-all dark:bg-zinc-900",
                      ativo
                        ? "ring-2 ring-[#c49e62]"
                        : "ring-zinc-900/[0.06] hover:ring-zinc-900/15 dark:ring-white/[0.08] dark:hover:ring-white/20"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
                        ativo ? "bg-[#c49e62] text-[#1d1406]" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      )}>
                        <op.icon className="h-5 w-5" />
                      </span>
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                        ativo ? "border-[#c49e62] bg-[#c49e62] text-[#1d1406]" : "border-zinc-300 dark:border-zinc-600"
                      )}>
                        {ativo && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="mt-4 text-base font-bold text-zinc-950 dark:text-white">{op.titulo}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{op.descricao}</p>
                    <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Etapas</p>
                      <ol className="space-y-1">
                        {ETAPAS_POR_TIPO[op.tipo].map((nome, i) => (
                          <li key={nome} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800">
                              {i + 1}
                            </span>
                            {nome}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button variant="neon" className="w-full" disabled={!tipo} onClick={() => setEtapa(2)}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="dados"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {origemSimulacao && (
              <div className="flex items-center gap-3 rounded-2xl bg-[#f9edd8] px-4 py-3 text-sm text-[#553e15] ring-1 ring-[#f2dbb6] dark:bg-[#332710] dark:text-[#edc889] dark:ring-[#553e15]">
                <Calculator className="h-4 w-4 shrink-0" />
                <span>
                  Dados importados da simulação de <strong>{origemSimulacao}</strong>. Complete o e-mail, o telefone e a senha para criar o acesso.
                </span>
              </div>
            )}

            {tipo && (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft ring-1 ring-zinc-900/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c49e62] text-[#1d1406]">
                    {tipo === "avista" ? <Banknote className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {tipo === "avista" ? "Venda à vista" : "Venda financiada"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {ETAPAS_POR_TIPO[tipo].length} etapas · {ETAPAS_POR_TIPO[tipo].join(" → ")}
                    </p>
                  </div>
                </div>
                {!origemSimulacao && (
                  <button type="button" onClick={() => setEtapa(1)} className="shrink-0 text-xs font-semibold text-[#8b682b] hover:underline dark:text-[#d9b06b]">
                    Alterar
                  </button>
                )}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="rounded-[20px] bg-white dark:bg-zinc-900 shadow-soft ring-1 ring-zinc-900/[0.04] dark:ring-white/[0.06] p-6 space-y-5"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  Dados Pessoais
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input id="nome" name="nome" required value={form.nome} onChange={handleChange} placeholder="João da Silva" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="conjuge">Nome do Cônjuge</Label>
                    <Input id="conjuge" name="conjuge" value={form.conjuge} onChange={handleChange} placeholder="Opcional" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  Acesso ao Sistema
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="joao@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(37) 99999-9999" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="senha" name="senha" type={showSenha ? "text" : "password"}
                        required value={form.senha} onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha(!showSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      >
                        {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {tipo === "financiamento" && (
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    Dados do Financiamento
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="banco">Banco Financiador</Label>
                    <Input id="banco" name="banco" value={form.banco} onChange={handleChange} placeholder="Ex: Caixa Econômica Federal" />
                  </div>
                </div>
              )}

              <Button type="submit" variant="neon" className="w-full" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Criando..." : "Criar Cliente"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
