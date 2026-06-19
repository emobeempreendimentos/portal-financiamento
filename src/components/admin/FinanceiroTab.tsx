"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, Building2, User2, Plus, Trash2,
  CheckCircle2, Clock, AlertCircle, XCircle, ChevronDown, ChevronUp,
  Save, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { FinanceiroVenda, ComissaoImobiliaria, CorretorParticipante } from "@/types";

interface Props {
  financiamentoId: string;
}

const fmt = (v?: number | null) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("pt-BR") : "—";

const toInput = (v?: string | null) =>
  v ? new Date(v).toISOString().slice(0, 10) : "";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente:    { label: "Pendente",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    pago:        { label: "Pago",        cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    recebida:    { label: "Recebida",    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    parcial:     { label: "Parcial",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    cancelada:   { label: "Cancelada",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    em_analise:  { label: "Em análise",  cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
    aprovado:    { label: "Aprovado",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    assinado:    { label: "Assinado",    cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    liberado:    { label: "Liberado",    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    cancelado:   { label: "Cancelado",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-100 text-zinc-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="h-7 w-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-500 dark:text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 text-sm font-medium transition-colors ${checked ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}
    >
      <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
      {label}
    </button>
  );
}

const emptyComissao = (): Partial<ComissaoImobiliaria> & { corretores: Partial<CorretorParticipante>[] } => ({
  percentual: undefined,
  valor: undefined,
  dataPrevistaRecebimento: undefined,
  dataEfetivaRecebimento: undefined,
  status: "pendente",
  houveAdiantamento: false,
  valorAdiantado: undefined,
  dataAdiantamento: undefined,
  obsAdiantamento: "",
  houveDivisao: false,
  percentualPrincipal: undefined,
  corretores: [],
});

const emptyVenda = (): Partial<FinanceiroVenda> => ({
  tipoVenda: "financiamento",
  valorImovel: undefined,
  dataVenda: undefined,
  statusVenda: "em_andamento",
  sinalValor: undefined,
  sinalData: undefined,
  sinalFormaPagamento: "pix",
  sinalStatus: "pendente",
  escrituraValorRestante: undefined,
  escrituraDataPrevista: undefined,
  escrituraDataQuitacao: undefined,
  escrituraStatus: "pendente",
  entradaValor: undefined,
  entradaData: undefined,
  entradaFormaPagamento: "pix",
  usouFgts: false,
  fgtsValor: undefined,
  bancoFinanciador: "",
  valorFinanciado: undefined,
  contratoDataAssinatura: undefined,
  contratoStatus: "em_analise",
  valorLiberadoBanco: undefined,
  dataLiberacaoBanco: undefined,
});

export function FinanceiroTab({ financiamentoId }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FinanceiroVenda | null>(null);

  const [venda, setVenda] = useState<Partial<FinanceiroVenda>>(emptyVenda());
  const [comissao, setComissao] = useState<ReturnType<typeof emptyComissao>>(emptyComissao());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/financiamentos/${financiamentoId}/financeiro`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setVenda(json.data);
        if (json.data.comissao) {
          setComissao({ ...json.data.comissao, corretores: json.data.comissao.corretores || [] });
        }
      }
    } catch {
      addToast({ title: "Erro ao carregar dados financeiros", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [financiamentoId]);

  useEffect(() => { load(); }, [load]);

  const calcComissaoValor = () => {
    if (!venda.valorImovel || !comissao.percentual) return null;
    return (venda.valorImovel * comissao.percentual) / 100;
  };

  const calcValorRestanteComissao = () => {
    const total = comissao.valor ?? calcComissaoValor() ?? 0;
    const adiant = comissao.houveAdiantamento ? (comissao.valorAdiantado ?? 0) : 0;
    return total - adiant;
  };

  const calcTotalRecebidoAvista = () => {
    const sinal = venda.sinalStatus === "pago" ? (venda.sinalValor ?? 0) : 0;
    const escritura = venda.escrituraStatus === "pago" ? (venda.escrituraValorRestante ?? 0) : 0;
    return sinal + escritura;
  };

  const calcPendenteAvista = () => {
    const total = venda.valorImovel ?? 0;
    return Math.max(0, total - calcTotalRecebidoAvista());
  };

  const calcTotalRecebidoFinanciamento = () => {
    const entrada = venda.entradaValor ?? 0;
    const fgts = venda.usouFgts ? (venda.fgtsValor ?? 0) : 0;
    const banco = venda.valorLiberadoBanco ?? 0;
    return entrada + fgts + banco;
  };

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/financiamentos/${financiamentoId}/financeiro`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...venda, comissao }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data);
      addToast({ title: "Dados financeiros salvos!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao salvar", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function setV<K extends keyof FinanceiroVenda>(k: K, v: FinanceiroVenda[K]) {
    setVenda((p) => ({ ...p, [k]: v }));
  }

  function setC<K extends keyof ReturnType<typeof emptyComissao>>(k: K, v: ReturnType<typeof emptyComissao>[K]) {
    setComissao((p) => ({ ...p, [k]: v }));
  }

  function addCorretor() {
    setComissao((p) => ({ ...p, corretores: [...p.corretores, { nome: "", creci: "", percentual: undefined, valor: undefined }] }));
  }

  function updateCorretor(i: number, field: keyof CorretorParticipante, value: unknown) {
    setComissao((p) => {
      const arr = [...p.corretores];
      arr[i] = { ...arr[i], [field]: value };
      return { ...p, corretores: arr };
    });
  }

  function removeCorretor(i: number) {
    setComissao((p) => ({ ...p, corretores: p.corretores.filter((_, idx) => idx !== i) }));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  const tipoAvista = venda.tipoVenda === "avista";
  const comissaoValorCalculado = calcComissaoValor();

  return (
    <div className="space-y-5">
      {/* ── INFORMAÇÕES GERAIS ── */}
      <SectionCard title="Informações Gerais da Venda" icon={DollarSign}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de venda">
            <Select value={venda.tipoVenda ?? "financiamento"} onChange={(v) => setV("tipoVenda", v)}>
              <option value="financiamento">Financiamento Bancário</option>
              <option value="avista">Pagamento à Vista</option>
            </Select>
          </Field>
          <Field label="Valor total do imóvel (R$)">
            <Input
              type="number"
              placeholder="0,00"
              value={venda.valorImovel ?? ""}
              onChange={(e) => setV("valorImovel", e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <Field label="Data da venda">
            <Input type="date" value={toInput(venda.dataVenda)} onChange={(e) => setV("dataVenda", e.target.value || undefined)} />
          </Field>
          <Field label="Status da venda">
            <Select value={venda.statusVenda ?? "em_andamento"} onChange={(v) => setV("statusVenda", v)}>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </Field>
        </div>
      </SectionCard>

      {/* ── PAGAMENTO À VISTA ── */}
      <AnimatePresence>
        {tipoAvista && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SectionCard title="Pagamento à Vista" icon={CheckCircle2}>
              <div className="space-y-5">
                {/* Sinal */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Sinal</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Valor do sinal (R$)">
                      <Input type="number" value={venda.sinalValor ?? ""} onChange={(e) => setV("sinalValor", e.target.value ? Number(e.target.value) : undefined)} />
                    </Field>
                    <Field label="Data do pagamento">
                      <Input type="date" value={toInput(venda.sinalData)} onChange={(e) => setV("sinalData", e.target.value || undefined)} />
                    </Field>
                    <Field label="Forma de pagamento">
                      <Select value={venda.sinalFormaPagamento ?? "pix"} onChange={(v) => setV("sinalFormaPagamento", v)}>
                        <option value="pix">PIX</option>
                        <option value="ted">TED</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="outro">Outro</option>
                      </Select>
                    </Field>
                    <Field label="Status do sinal">
                      <Select value={venda.sinalStatus ?? "pendente"} onChange={(v) => setV("sinalStatus", v)}>
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Escritura */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Escritura</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Valor restante (R$)">
                      <Input type="number" value={venda.escrituraValorRestante ?? ""} onChange={(e) => setV("escrituraValorRestante", e.target.value ? Number(e.target.value) : undefined)} />
                    </Field>
                    <Field label="Data prevista da escritura">
                      <Input type="date" value={toInput(venda.escrituraDataPrevista)} onChange={(e) => setV("escrituraDataPrevista", e.target.value || undefined)} />
                    </Field>
                    <Field label="Data da quitação">
                      <Input type="date" value={toInput(venda.escrituraDataQuitacao)} onChange={(e) => setV("escrituraDataQuitacao", e.target.value || undefined)} />
                    </Field>
                    <Field label="Status da escritura">
                      <Select value={venda.escrituraStatus ?? "pendente"} onChange={(v) => setV("escrituraStatus", v)}>
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Resumo */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Resumo</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-3 text-center">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1">Total recebido</p>
                      <p className="font-bold text-green-700 dark:text-green-300">{fmt(calcTotalRecebidoAvista())}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-3 text-center">
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Pendente</p>
                      <p className="font-bold text-amber-700 dark:text-amber-300">{fmt(calcPendenteAvista())}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-3 text-center">
                      <p className="text-xs text-zinc-500 mb-1">% recebido</p>
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">
                        {venda.valorImovel && calcTotalRecebidoAvista() > 0
                          ? `${Math.round((calcTotalRecebidoAvista() / venda.valorImovel) * 100)}%`
                          : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FINANCIAMENTO BANCÁRIO ── */}
      <AnimatePresence>
        {!tipoAvista && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SectionCard title="Financiamento Bancário" icon={Building2}>
              <div className="space-y-5">
                {/* Entrada */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Entrada</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Valor da entrada (R$)">
                      <Input type="number" value={venda.entradaValor ?? ""} onChange={(e) => setV("entradaValor", e.target.value ? Number(e.target.value) : undefined)} />
                    </Field>
                    <Field label="Data de pagamento">
                      <Input type="date" value={toInput(venda.entradaData)} onChange={(e) => setV("entradaData", e.target.value || undefined)} />
                    </Field>
                    <Field label="Forma de pagamento">
                      <Select value={venda.entradaFormaPagamento ?? "pix"} onChange={(v) => setV("entradaFormaPagamento", v)}>
                        <option value="pix">PIX</option>
                        <option value="ted">TED</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="outro">Outro</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* FGTS */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">FGTS</p>
                    <Toggle checked={venda.usouFgts ?? false} onChange={(v) => setV("usouFgts", v)} label={venda.usouFgts ? "Utilizou FGTS" : "Não utilizou FGTS"} />
                  </div>
                  <AnimatePresence>
                    {venda.usouFgts && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <Field label="Valor do FGTS (R$)">
                          <Input type="number" value={venda.fgtsValor ?? ""} onChange={(e) => setV("fgtsValor", e.target.value ? Number(e.target.value) : undefined)} />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Contrato bancário */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Contrato Bancário</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Banco">
                      <Input value={venda.bancoFinanciador ?? ""} onChange={(e) => setV("bancoFinanciador", e.target.value)} placeholder="Ex: Caixa Econômica" />
                    </Field>
                    <Field label="Valor financiado (R$)">
                      <Input type="number" value={venda.valorFinanciado ?? ""} onChange={(e) => setV("valorFinanciado", e.target.value ? Number(e.target.value) : undefined)} />
                    </Field>
                    <Field label="Data da assinatura">
                      <Input type="date" value={toInput(venda.contratoDataAssinatura)} onChange={(e) => setV("contratoDataAssinatura", e.target.value || undefined)} />
                    </Field>
                    <Field label="Status da aprovação">
                      <Select value={venda.contratoStatus ?? "em_analise"} onChange={(v) => setV("contratoStatus", v)}>
                        <option value="em_analise">Em análise</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="assinado">Assinado</option>
                        <option value="liberado">Liberado</option>
                        <option value="cancelado">Cancelado</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Recebimento da construtora */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Recebimento da Construtora</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Valor liberado pelo banco (R$)">
                      <Input type="number" value={venda.valorLiberadoBanco ?? ""} onChange={(e) => setV("valorLiberadoBanco", e.target.value ? Number(e.target.value) : undefined)} />
                    </Field>
                    <Field label="Data de liberação">
                      <Input type="date" value={toInput(venda.dataLiberacaoBanco)} onChange={(e) => setV("dataLiberacaoBanco", e.target.value || undefined)} />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Resumo */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Resumo</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Entrada", value: fmt(venda.entradaValor), color: "zinc" },
                      { label: "FGTS", value: venda.usouFgts ? fmt(venda.fgtsValor) : "—", color: "zinc" },
                      { label: "Valor financiado", value: fmt(venda.valorFinanciado), color: "blue" },
                      { label: "Total recebido", value: fmt(calcTotalRecebidoFinanciamento()), color: "green" },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-xl p-3 text-center border ${item.color === "green" ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30" : item.color === "blue" ? "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700"}`}>
                        <p className={`text-xs mb-1 ${item.color === "green" ? "text-green-600 dark:text-green-400" : item.color === "blue" ? "text-blue-600 dark:text-blue-400" : "text-zinc-500"}`}>{item.label}</p>
                        <p className={`font-bold text-sm ${item.color === "green" ? "text-green-700 dark:text-green-300" : item.color === "blue" ? "text-blue-700 dark:text-blue-300" : "text-zinc-700 dark:text-zinc-300"}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMISSÃO IMOBILIÁRIA ── */}
      <SectionCard title="Comissão Imobiliária" icon={TrendingUp}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Percentual de comissão (%)">
              <Input
                type="number"
                step="0.1"
                value={comissao.percentual ?? ""}
                onChange={(e) => {
                  const pct = e.target.value ? Number(e.target.value) : undefined;
                  setC("percentual", pct);
                  if (pct && venda.valorImovel) setC("valor", (venda.valorImovel * pct) / 100);
                }}
              />
            </Field>
            <Field label="Valor da comissão (R$)">
              <Input
                type="number"
                value={comissao.valor ?? comissaoValorCalculado ?? ""}
                onChange={(e) => setC("valor", e.target.value ? Number(e.target.value) : undefined)}
                placeholder={comissaoValorCalculado ? fmt(comissaoValorCalculado) : "0,00"}
              />
            </Field>
            <Field label="Data prevista de recebimento">
              <Input type="date" value={toInput(comissao.dataPrevistaRecebimento)} onChange={(e) => setC("dataPrevistaRecebimento", e.target.value || undefined)} />
            </Field>
            <Field label="Data efetiva de recebimento">
              <Input type="date" value={toInput(comissao.dataEfetivaRecebimento)} onChange={(e) => setC("dataEfetivaRecebimento", e.target.value || undefined)} />
            </Field>
            <Field label="Status">
              <Select value={comissao.status ?? "pendente"} onChange={(v) => setC("status", v)}>
                <option value="pendente">Pendente</option>
                <option value="recebida">Recebida</option>
                <option value="parcial">Parcial</option>
                <option value="cancelada">Cancelada</option>
              </Select>
            </Field>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Adiantamento */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Adiantamento</p>
              <Toggle
                checked={comissao.houveAdiantamento ?? false}
                onChange={(v) => setC("houveAdiantamento", v)}
                label={comissao.houveAdiantamento ? "Houve adiantamento" : "Sem adiantamento"}
              />
            </div>
            <AnimatePresence>
              {comissao.houveAdiantamento && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <Field label="Valor adiantado (R$)">
                      <Input type="number" value={comissao.valorAdiantado ?? ""} onChange={(e) => setC("valorAdiantado", e.target.value ? Number(e.target.value) : undefined)} />
                    </Field>
                    <Field label="Data do adiantamento">
                      <Input type="date" value={toInput(comissao.dataAdiantamento)} onChange={(e) => setC("dataAdiantamento", e.target.value || undefined)} />
                    </Field>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs text-zinc-500">Observações</Label>
                      <textarea
                        value={comissao.obsAdiantamento ?? ""}
                        onChange={(e) => setC("obsAdiantamento", e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  {/* Saldo restante */}
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Comissão restante após adiantamento</p>
                      <p className="font-bold text-amber-700 dark:text-amber-300">{fmt(calcValorRestanteComissao())}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Divisão de comissão */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Divisão de comissão</p>
              <Toggle
                checked={comissao.houveDivisao ?? false}
                onChange={(v) => setC("houveDivisao", v)}
                label={comissao.houveDivisao ? "Há divisão" : "Sem divisão"}
              />
            </div>
            <AnimatePresence>
              {comissao.houveDivisao && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4 pt-1">
                  <Field label="% do corretor principal">
                    <Input
                      type="number"
                      step="1"
                      max="100"
                      value={comissao.percentualPrincipal ?? ""}
                      onChange={(e) => setC("percentualPrincipal", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Ex: 70"
                    />
                  </Field>

                  {/* Resumo da divisão */}
                  {comissao.percentualPrincipal && (comissao.valor || comissaoValorCalculado) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-3">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">Corretor principal ({comissao.percentualPrincipal}%)</p>
                        <p className="font-bold text-green-700 dark:text-green-300">
                          {fmt(((comissao.valor ?? comissaoValorCalculado ?? 0) * comissao.percentualPrincipal) / 100)}
                        </p>
                      </div>
                      {comissao.corretores.map((c, i) => (
                        <div key={i} className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-3">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">{c.nome || `Corretor ${i + 1}`} ({c.percentual ?? 0}%)</p>
                          <p className="font-bold text-blue-700 dark:text-blue-300">
                            {fmt(((comissao.valor ?? comissaoValorCalculado ?? 0) * (c.percentual ?? 0)) / 100)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Corretores participantes */}
                  <div className="space-y-3">
                    {comissao.corretores.map((c, i) => (
                      <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User2 className="h-3.5 w-3.5 text-zinc-400" />
                            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Corretor participante {i + 1}</p>
                          </div>
                          <button type="button" onClick={() => removeCorretor(i)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Nome">
                            <Input value={c.nome ?? ""} onChange={(e) => updateCorretor(i, "nome", e.target.value)} placeholder="Nome completo" />
                          </Field>
                          <Field label="CRECI">
                            <Input value={c.creci ?? ""} onChange={(e) => updateCorretor(i, "creci", e.target.value)} placeholder="00000-J" />
                          </Field>
                          <Field label="% da divisão">
                            <Input type="number" value={c.percentual ?? ""} onChange={(e) => updateCorretor(i, "percentual", e.target.value ? Number(e.target.value) : undefined)} placeholder="30" />
                          </Field>
                          <Field label="Valor (R$)">
                            <Input type="number" value={c.valor ?? ""} onChange={(e) => updateCorretor(i, "valor", e.target.value ? Number(e.target.value) : undefined)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCorretor}
                      className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar corretor participante
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SectionCard>

      {/* ── BOTÃO SALVAR ── */}
      <Button variant="neon" className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar dados financeiros</>}
      </Button>

      {/* ── HISTÓRICO FINANCEIRO ── */}
      {data?.historico && data.historico.length > 0 && (
        <SectionCard title="Histórico Financeiro" icon={Clock}>
          <div className="space-y-3">
            {data.historico.map((h, i) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  {i < data.historico!.length - 1 && (
                    <div className="w-0.5 flex-1 bg-zinc-100 dark:bg-zinc-800 mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-sm text-zinc-900 dark:text-white">{h.descricao}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {h.usuario} · {fmtDate(h.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
