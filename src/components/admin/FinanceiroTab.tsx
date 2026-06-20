"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, Save, Loader2, FileBarChart2,
  CheckCircle2, Clock, AlertCircle, Plus, Trash2, User2, CreditCard, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

/* ── props ── */
interface Props {
  financiamentoId: string;
  clienteId: string;
  banco?: string | null;
  statusGeral: string;
  dataInicio: string;
  clienteNome: string;
  protocolo?: number | null;
}

/* ── tipos locais ── */
interface FormCorretor { id?: string; nome: string; creci: string; percentual: string; valor: string }
interface FormComissao {
  percentual: string; valor: string;
  dataPrevistaRecebimento: string; dataEfetivaRecebimento: string; status: string;
  houveAdiantamento: boolean; valorAdiantado: string; dataAdiantamento: string; obsAdiantamento: string;
  houveDivisao: boolean; percentualPrincipal: string; corretores: FormCorretor[];
}
interface FormVenda {
  tipoVenda: string;
  valorImovel: string;
  // Financiamento bancário
  bancoFinanciador: string; valorFinanciado: string;
  contratoDataAssinatura: string; contratoStatus: string;
  // Entrada
  entradaValor: string; entradaData: string; entradaFormaPagamento: string;
  // FGTS
  usouFgts: boolean; fgtsValor: string;
  // Pagamento à vista
  sinalValor: string; sinalData: string; sinalFormaPagamento: string; sinalStatus: string;
  escrituraValorRestante: string; escrituraDataPrevista: string; escrituraDataQuitacao: string; escrituraStatus: string;
  // Dados bancários do vendedor
  pixChave: string; pixTipo: string;
  contaBanco: string; contaAgencia: string; contaNumero: string; contaTipo: string; contaTitular: string;
}
interface HistoricoItem { id: string; descricao: string; usuario: string; createdAt: string }
interface FormContaPagamento {
  tipo: "vendedor" | "imobiliaria";
  descricao: string;
  formaPagamento: string;
  pixChave: string;
  pixTipo: string;
  banco: string;
  agencia: string;
  numero: string;
  contaTipo: string;
  titular: string;
  valor: string;
}

/* ── helpers ── */
const n = (s: string): number | null => {
  if (!s.trim()) return null;
  const num = Number(s.replace(/\./g, "").replace(",", "."));
  return isNaN(num) ? null : num;
};
const brl = (v: unknown): string => {
  if (v == null) return "";
  const num = Number(v);
  if (isNaN(num) || num === 0) return "";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const d = (s: string): string | null => (s.trim() === "" ? null : s);
const fmt = (v: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

function emptyVenda(): FormVenda {
  return {
    tipoVenda: "financiamento", valorImovel: "",
    bancoFinanciador: "", valorFinanciado: "", contratoDataAssinatura: "", contratoStatus: "em_analise",
    entradaValor: "", entradaData: "", entradaFormaPagamento: "pix",
    usouFgts: false, fgtsValor: "",
    sinalValor: "", sinalData: "", sinalFormaPagamento: "pix", sinalStatus: "pendente",
    escrituraValorRestante: "", escrituraDataPrevista: "", escrituraDataQuitacao: "", escrituraStatus: "pendente",
    pixChave: "", pixTipo: "cpf", contaBanco: "", contaAgencia: "", contaNumero: "", contaTipo: "corrente", contaTitular: "",
  };
}
function emptyComissao(): FormComissao {
  return {
    percentual: "", valor: "", dataPrevistaRecebimento: "", dataEfetivaRecebimento: "", status: "pendente",
    houveAdiantamento: false, valorAdiantado: "", dataAdiantamento: "", obsAdiantamento: "",
    houveDivisao: false, percentualPrincipal: "", corretores: [],
  };
}
function emptyContaPagamento(tipo: "vendedor" | "imobiliaria"): FormContaPagamento {
  return { tipo, descricao: "", formaPagamento: "pix", pixChave: "", pixTipo: "cpf", banco: "", agencia: "", numero: "", contaTipo: "corrente", titular: "", valor: "" };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFormVenda(data: any): FormVenda {
  const dt = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");
  return {
    tipoVenda: data.tipoVenda ?? "financiamento",
    valorImovel: brl(data.valorImovel),
    bancoFinanciador: data.bancoFinanciador ?? "",
    valorFinanciado: brl(data.valorFinanciado),
    contratoDataAssinatura: dt(data.contratoDataAssinatura),
    contratoStatus: data.contratoStatus ?? "em_analise",
    entradaValor: brl(data.entradaValor), entradaData: dt(data.entradaData),
    entradaFormaPagamento: data.entradaFormaPagamento ?? "pix",
    usouFgts: data.usouFgts ?? false, fgtsValor: brl(data.fgtsValor),
    sinalValor: brl(data.sinalValor), sinalData: dt(data.sinalData),
    sinalFormaPagamento: data.sinalFormaPagamento ?? "pix", sinalStatus: data.sinalStatus ?? "pendente",
    escrituraValorRestante: brl(data.escrituraValorRestante),
    escrituraDataPrevista: dt(data.escrituraDataPrevista),
    escrituraDataQuitacao: dt(data.escrituraDataQuitacao), escrituraStatus: data.escrituraStatus ?? "pendente",
    pixChave: data.pixChave ?? "", pixTipo: data.pixTipo ?? "cpf",
    contaBanco: data.contaBanco ?? "", contaAgencia: data.contaAgencia ?? "",
    contaNumero: data.contaNumero ?? "", contaTipo: data.contaTipo ?? "corrente",
    contaTitular: data.contaTitular ?? "",
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFormComissao(c: any): FormComissao {
  const dt = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");
  return {
    percentual: c.percentual != null ? String(c.percentual) : "",
    valor: brl(c.valor), dataPrevistaRecebimento: dt(c.dataPrevistaRecebimento),
    dataEfetivaRecebimento: dt(c.dataEfetivaRecebimento), status: c.status ?? "pendente",
    houveAdiantamento: c.houveAdiantamento ?? false,
    valorAdiantado: brl(c.valorAdiantado), dataAdiantamento: dt(c.dataAdiantamento),
    obsAdiantamento: c.obsAdiantamento ?? "",
    houveDivisao: c.houveDivisao ?? false,
    percentualPrincipal: c.percentualPrincipal != null ? String(c.percentualPrincipal) : "",
    corretores: (c.corretores ?? []).map((cr: { id?: string; nome?: string; creci?: string; percentual?: number; valor?: number }) => ({
      id: cr.id, nome: cr.nome ?? "", creci: cr.creci ?? "",
      percentual: cr.percentual != null ? String(cr.percentual) : "", valor: brl(cr.valor),
    })),
  };
}

/* ── UI atoms ── */
function CurrencyInput({ value, onChange, placeholder = "0,00" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) { onChange(""); return; }
    onChange((parseInt(digits, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none select-none">R$</span>
      <Input type="text" inputMode="numeric" className="pl-9" value={value} onChange={handleChange} placeholder={placeholder} />
    </div>
  );
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
      {children}
    </select>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-500 dark:text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 text-sm font-medium transition-colors ${checked ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
      <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
      {label}
    </button>
  );
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  em_andamento: { label: "Em andamento", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  concluido:    { label: "Concluído",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  pausado:      { label: "Pausado",      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  cancelado:    { label: "Cancelado",    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  pendente:     { label: "Pendente",     cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  recebida:     { label: "Recebida",     cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  parcial:      { label: "Parcial",      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  cancelada:    { label: "Cancelada",    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  em_analise:   { label: "Em análise",   cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  aprovado:     { label: "Aprovado",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  assinado:     { label: "Assinado",     cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  liberado:     { label: "Liberado",     cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pago:         { label: "Pago",         cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

function Badge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: "bg-zinc-100 text-zinc-600" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function ContaEntryForm({ cp, onChange, onDelete }: {
  cp: FormContaPagamento;
  onChange: (updates: Partial<FormContaPagamento>) => void;
  onDelete: () => void;
}) {
  const isPix    = cp.formaPagamento === "pix";
  const isTedDoc = cp.formaPagamento === "ted" || cp.formaPagamento === "doc";
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          {cp.tipo === "vendedor" ? "Vendedor" : "Imobiliária"}
        </span>
        <button type="button" onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <F label="Descrição">
          <Input value={cp.descricao} onChange={(e) => onChange({ descricao: e.target.value })} placeholder="Ex: Entrada, Sinal, Comissão…" />
        </F>
        <F label="Forma de pagamento">
          <Sel value={cp.formaPagamento} onChange={(v) => onChange({ formaPagamento: v })}>
            <option value="pix">PIX</option>
            <option value="ted">TED</option>
            <option value="doc">DOC</option>
            <option value="dinheiro">Dinheiro</option>
          </Sel>
        </F>
        {isPix && (<>
          <F label="Tipo de chave PIX">
            <Sel value={cp.pixTipo} onChange={(v) => onChange({ pixTipo: v })}>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave aleatória</option>
            </Sel>
          </F>
          <F label="Chave PIX">
            <Input value={cp.pixChave} onChange={(e) => onChange({ pixChave: e.target.value })} placeholder="Digite a chave" />
          </F>
        </>)}
        {isTedDoc && (<>
          <F label="Banco">
            <Input value={cp.banco} onChange={(e) => onChange({ banco: e.target.value })} placeholder="Ex: Caixa Econômica" />
          </F>
          <F label="Agência">
            <Input value={cp.agencia} onChange={(e) => onChange({ agencia: e.target.value })} placeholder="0000" />
          </F>
          <F label="Conta">
            <Input value={cp.numero} onChange={(e) => onChange({ numero: e.target.value })} placeholder="00000-0" />
          </F>
          <F label="Tipo de conta">
            <Sel value={cp.contaTipo} onChange={(v) => onChange({ contaTipo: v })}>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
            </Sel>
          </F>
        </>)}
        <F label="Titular">
          <Input value={cp.titular} onChange={(e) => onChange({ titular: e.target.value })} placeholder="Nome completo ou razão social" />
        </F>
        <F label="Valor">
          <CurrencyInput value={cp.valor} onChange={(v) => onChange({ valor: v })} />
        </F>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
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

function CollapsibleCard({ title, icon: Icon, defaultOpen = true, summary, children }: {
  title: string; icon: React.ElementType; defaultOpen?: boolean; summary?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors text-left">
        <div className="h-7 w-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{title}</h3>
        {!open && summary && (
          <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[200px]">{summary}</span>
        )}
        <ChevronDown className={`ml-auto h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── componente principal ── */
export function FinanceiroTab({ financiamentoId, clienteId, banco, statusGeral, dataInicio, clienteNome, protocolo }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [venda, setVenda]         = useState<FormVenda>(emptyVenda());
  const [comissao, setComissao]   = useState<FormComissao>(emptyComissao());
  const [contas, setContas]       = useState<FormContaPagamento[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/financiamentos/${financiamentoId}/financeiro`);
      const json = await res.json();
      if (json.data) {
        setVenda(toFormVenda(json.data));
        if (json.data.comissao) setComissao(toFormComissao(json.data.comissao));
        setHistorico(json.data.historico ?? []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setContas((json.data.contasPagamento ?? []).map((cp: any) => ({
          tipo: cp.tipo as "vendedor" | "imobiliaria",
          descricao: cp.descricao ?? "",
          formaPagamento: cp.formaPagamento ?? "pix",
          pixChave: cp.pixChave ?? "",
          pixTipo: cp.pixTipo ?? "cpf",
          banco: cp.banco ?? "",
          agencia: cp.agencia ?? "",
          numero: cp.numero ?? "",
          contaTipo: cp.contaTipo ?? "corrente",
          titular: cp.titular ?? "",
          valor: brl(cp.valor),
        })));
      } else {
        // Pré-preenche banco do processo
        setVenda((p) => ({ ...p, bancoFinanciador: banco ?? "" }));
      }
    } catch {
      addToast({ title: "Erro ao carregar dados financeiros", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [financiamentoId, banco]);

  useEffect(() => { load(); }, [load]);

  /* cálculos */
  const baseCalculo = (): number | null => {
    // Campo explícito tem prioridade
    const explicit = n(venda.valorImovel);
    if (explicit && explicit > 0) return explicit;
    // Fallback: soma dos campos financeiros
    if (venda.tipoVenda === "financiamento") {
      const total = (n(venda.entradaValor) ?? 0) + (n(venda.valorFinanciado) ?? 0);
      return total > 0 ? total : null;
    }
    const total = (n(venda.sinalValor) ?? 0) + (n(venda.escrituraValorRestante) ?? 0);
    return total > 0 ? total : null;
  };
  const calcComissaoAuto = (): number | null => {
    const vi = baseCalculo();
    const pc = comissao.percentual ? Number(comissao.percentual) : null;
    return vi && pc ? (vi * pc) / 100 : null;
  };
  const calcRestante = () => {
    const total = n(comissao.valor) ?? calcComissaoAuto() ?? 0;
    const adiant = comissao.houveAdiantamento ? (n(comissao.valorAdiantado) ?? 0) : 0;
    return total - adiant;
  };

  const setV = (k: keyof FormVenda, v: FormVenda[typeof k]) => setVenda((p) => ({ ...p, [k]: v }));
  const setC = (k: keyof FormComissao, v: FormComissao[typeof k]) => setComissao((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      const comissaoCalc = calcComissaoAuto();
      const res = await fetch(`/api/admin/financiamentos/${financiamentoId}/financeiro`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoVenda: venda.tipoVenda,
          valorImovel: n(venda.valorImovel),
          bancoFinanciador: d(venda.bancoFinanciador), valorFinanciado: n(venda.valorFinanciado),
          contratoDataAssinatura: d(venda.contratoDataAssinatura), contratoStatus: venda.contratoStatus,
          entradaValor: n(venda.entradaValor), entradaData: d(venda.entradaData),
          entradaFormaPagamento: venda.entradaFormaPagamento,
          usouFgts: venda.usouFgts, fgtsValor: n(venda.fgtsValor),
          sinalValor: n(venda.sinalValor), sinalData: d(venda.sinalData),
          sinalFormaPagamento: venda.sinalFormaPagamento, sinalStatus: venda.sinalStatus,
          escrituraValorRestante: n(venda.escrituraValorRestante),
          escrituraDataPrevista: d(venda.escrituraDataPrevista),
          escrituraDataQuitacao: d(venda.escrituraDataQuitacao), escrituraStatus: venda.escrituraStatus,
          pixChave: d(venda.pixChave), pixTipo: d(venda.pixTipo),
          contaBanco: d(venda.contaBanco), contaAgencia: d(venda.contaAgencia),
          contaNumero: d(venda.contaNumero), contaTipo: d(venda.contaTipo),
          contaTitular: d(venda.contaTitular),
          contasPagamento: contas.map((cp) => ({
            tipo: cp.tipo,
            descricao: cp.descricao || null,
            formaPagamento: cp.formaPagamento || null,
            pixChave:  cp.formaPagamento === "pix" ? (cp.pixChave || null) : null,
            pixTipo:   cp.formaPagamento === "pix" ? (cp.pixTipo  || null) : null,
            banco:     (cp.formaPagamento === "ted" || cp.formaPagamento === "doc") ? (cp.banco    || null) : null,
            agencia:   (cp.formaPagamento === "ted" || cp.formaPagamento === "doc") ? (cp.agencia  || null) : null,
            numero:    (cp.formaPagamento === "ted" || cp.formaPagamento === "doc") ? (cp.numero   || null) : null,
            contaTipo: (cp.formaPagamento === "ted" || cp.formaPagamento === "doc") ? (cp.contaTipo|| null) : null,
            titular:   cp.titular || null,
            valor:     n(cp.valor),
          })),
          comissao: {
            percentual: comissao.percentual ? Number(comissao.percentual) : null,
            valor: n(comissao.valor) ?? comissaoCalc,
            dataPrevistaRecebimento: d(comissao.dataPrevistaRecebimento),
            dataEfetivaRecebimento:  d(comissao.dataEfetivaRecebimento),
            status: comissao.status,
            houveAdiantamento: comissao.houveAdiantamento,
            valorAdiantado:  n(comissao.valorAdiantado), dataAdiantamento: d(comissao.dataAdiantamento),
            obsAdiantamento: comissao.obsAdiantamento || null,
            houveDivisao: comissao.houveDivisao,
            percentualPrincipal: comissao.percentualPrincipal ? Number(comissao.percentualPrincipal) : null,
            corretores: comissao.corretores.map((c) => ({
              id: c.id, nome: c.nome, creci: c.creci || null,
              percentual: c.percentual ? Number(c.percentual) : null, valor: n(c.valor),
            })),
          },
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setHistorico(json.data?.historico ?? []);
      addToast({ title: "Dados financeiros salvos!", variant: "success" });
    } catch {
      addToast({ title: "Erro ao salvar", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse bg-zinc-50 dark:bg-zinc-800/50" />)}
      </div>
    );
  }

  const avista      = venda.tipoVenda === "avista";
  const comissaoCalc = calcComissaoAuto();
  const comissaoTotal = n(comissao.valor) ?? comissaoCalc;

  return (
    <div className="space-y-5">

      {/* ── INFO DO PROCESSO (read-only) ── */}
      <Card title="Informações da Venda" icon={DollarSign}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-zinc-400 mb-1">Banco / Tipo</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{banco || "Não informado"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Data de início</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {new Date(dataInicio).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">Status</p>
            <Badge status={statusGeral} />
          </div>
        </div>
        <F label="Valor do imóvel">
          <CurrencyInput value={venda.valorImovel} onChange={(v) => {
            setV("valorImovel", v);
            const vi = n(v);
            const pc = comissao.percentual ? Number(comissao.percentual) : null;
            if (vi && vi > 0 && pc) setC("valor", brl((vi * pc) / 100));
            else if (vi && vi > 0 && n(comissao.valor)) {
              setC("percentual", parseFloat(((n(comissao.valor)! / vi) * 100).toFixed(4)).toString());
            }
          }} />
        </F>
      </Card>

      {/* ── TOGGLE TIPO DE PAGAMENTO ── */}
      <div className="flex gap-2">
        {([
          { key: "financiamento", label: "Financiamento Bancário" },
          { key: "avista",        label: "Pagamento à Vista" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setV("tipoVenda", key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              venda.tipoVenda === key
                ? "bg-green-500 text-white border-green-500 shadow-sm"
                : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-green-300"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── FINANCIAMENTO BANCÁRIO ── */}
      <AnimatePresence mode="wait">
        {!avista ? (
          <motion.div key="fin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <CollapsibleCard title="Financiamento Bancário" icon={DollarSign} defaultOpen={true}
              summary={[venda.bancoFinanciador, venda.valorFinanciado ? `R$ ${venda.valorFinanciado}` : ""].filter(Boolean).join(" · ") || undefined}>
              <div className="space-y-4">
                {/* Banco */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Banco">
                    <Input value={venda.bancoFinanciador} onChange={(e) => setV("bancoFinanciador", e.target.value)} placeholder="Ex: Caixa Econômica" />
                  </F>
                  <F label="Valor financiado">
                    <CurrencyInput value={venda.valorFinanciado} onChange={(v) => setV("valorFinanciado", v)} />
                  </F>
                  <F label="Data da assinatura do contrato">
                    <Input type="date" value={venda.contratoDataAssinatura} onChange={(e) => setV("contratoDataAssinatura", e.target.value)} />
                  </F>
                  <F label="Status da aprovação">
                    <Sel value={venda.contratoStatus} onChange={(v) => setV("contratoStatus", v)}>
                      <option value="em_analise">Em análise</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="assinado">Assinado</option>
                      <option value="liberado">Liberado</option>
                      <option value="cancelado">Cancelado</option>
                    </Sel>
                  </F>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Entrada</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <F label="Valor da entrada">
                      <CurrencyInput value={venda.entradaValor} onChange={(v) => setV("entradaValor", v)} />
                    </F>
                    <F label="Data">
                      <Input type="date" value={venda.entradaData} onChange={(e) => setV("entradaData", e.target.value)} />
                    </F>
                    <F label="Forma de pagamento">
                      <Sel value={venda.entradaFormaPagamento} onChange={(v) => setV("entradaFormaPagamento", v)}>
                        <option value="pix">PIX</option>
                        <option value="ted">TED</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="outro">Outro</option>
                      </Sel>
                    </F>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">FGTS</p>
                    <Toggle checked={venda.usouFgts} onChange={(v) => setV("usouFgts", v)}
                      label={venda.usouFgts ? "Utilizou FGTS" : "Não utilizou FGTS"} />
                  </div>
                  <AnimatePresence>
                    {venda.usouFgts && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <F label="Valor do FGTS">
                          <CurrencyInput value={venda.fgtsValor} onChange={(v) => setV("fgtsValor", v)} />
                        </F>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CollapsibleCard>
          </motion.div>
        ) : (
          /* ── PAGAMENTO À VISTA ── */
          <motion.div key="avista" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <CollapsibleCard title="Pagamento à Vista" icon={CheckCircle2} defaultOpen={true}
              summary={venda.sinalValor ? `Sinal R$ ${venda.sinalValor}` : undefined}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Sinal</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor"><CurrencyInput value={venda.sinalValor} onChange={(v) => setV("sinalValor", v)} /></F>
                    <F label="Data"><Input type="date" value={venda.sinalData} onChange={(e) => setV("sinalData", e.target.value)} /></F>
                    <F label="Forma de pagamento">
                      <Sel value={venda.sinalFormaPagamento} onChange={(v) => setV("sinalFormaPagamento", v)}>
                        <option value="pix">PIX</option><option value="ted">TED</option>
                        <option value="dinheiro">Dinheiro</option><option value="outro">Outro</option>
                      </Sel>
                    </F>
                    <F label="Status">
                      <Sel value={venda.sinalStatus} onChange={(v) => setV("sinalStatus", v)}>
                        <option value="pendente">Pendente</option><option value="pago">Pago</option>
                      </Sel>
                    </F>
                  </div>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Escritura</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor restante"><CurrencyInput value={venda.escrituraValorRestante} onChange={(v) => setV("escrituraValorRestante", v)} /></F>
                    <F label="Data prevista"><Input type="date" value={venda.escrituraDataPrevista} onChange={(e) => setV("escrituraDataPrevista", e.target.value)} /></F>
                    <F label="Data da quitação"><Input type="date" value={venda.escrituraDataQuitacao} onChange={(e) => setV("escrituraDataQuitacao", e.target.value)} /></F>
                    <F label="Status">
                      <Sel value={venda.escrituraStatus} onChange={(v) => setV("escrituraStatus", v)}>
                        <option value="pendente">Pendente</option><option value="pago">Pago</option>
                      </Sel>
                    </F>
                  </div>
                </div>
              </div>
            </CollapsibleCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMISSÃO ── */}
      <CollapsibleCard title="Comissão Imobiliária" icon={TrendingUp} defaultOpen={true}
        summary={comissao.percentual ? `${comissao.percentual}% · ${comissao.valor || "—"} · ${comissao.status}` : undefined}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Percentual (%)">
              <div className="relative">
                <Input type="number" step="0.01" min="0" max="100" value={comissao.percentual}
                  onChange={(e) => {
                    setC("percentual", e.target.value);
                    const vi = baseCalculo();
                    const pc = e.target.value ? Number(e.target.value) : null;
                    if (vi && pc) setC("valor", brl((vi * pc) / 100));
                    else if (!e.target.value) setC("valor", "");
                  }} className="pr-8" placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">%</span>
              </div>
            </F>
            <F label="Valor da comissão">
              <CurrencyInput value={comissao.valor} placeholder="0,00"
                onChange={(v) => {
                  setC("valor", v);
                  const vi = baseCalculo();
                  const val = n(v);
                  if (vi && val && vi > 0) {
                    setC("percentual", parseFloat(((val / vi) * 100).toFixed(4)).toString());
                  } else if (!v) {
                    setC("percentual", "");
                  }
                }} />
            </F>
            <F label="Data prevista de recebimento">
              <Input type="date" value={comissao.dataPrevistaRecebimento} onChange={(e) => setC("dataPrevistaRecebimento", e.target.value)} />
            </F>
            <F label="Data efetiva de recebimento">
              <Input type="date" value={comissao.dataEfetivaRecebimento} onChange={(e) => setC("dataEfetivaRecebimento", e.target.value)} />
            </F>
            <F label="Status">
              <Sel value={comissao.status} onChange={(v) => setC("status", v)}>
                <option value="pendente">Pendente</option><option value="recebida">Recebida</option>
                <option value="parcial">Parcial</option><option value="cancelada">Cancelada</option>
              </Sel>
            </F>
            <F label="Situação">
              <div className="flex items-center h-10"><Badge status={comissao.status} /></div>
            </F>
          </div>

          {/* Adiantamento */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Adiantamento</p>
              <Toggle checked={comissao.houveAdiantamento} onChange={(v) => setC("houveAdiantamento", v)}
                label={comissao.houveAdiantamento ? "Houve adiantamento" : "Sem adiantamento"} />
            </div>
            <AnimatePresence>
              {comissao.houveAdiantamento && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor adiantado"><CurrencyInput value={comissao.valorAdiantado} onChange={(v) => setC("valorAdiantado", v)} /></F>
                    <F label="Data"><Input type="date" value={comissao.dataAdiantamento} onChange={(e) => setC("dataAdiantamento", e.target.value)} /></F>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs text-zinc-500">Observações</Label>
                      <textarea value={comissao.obsAdiantamento} onChange={(e) => setC("obsAdiantamento", e.target.value)} rows={2}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Comissão restante após adiantamento</p>
                      <p className="font-bold text-amber-700 dark:text-amber-300">{fmt(calcRestante())}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divisão */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Divisão de Comissão</p>
              <Toggle checked={comissao.houveDivisao} onChange={(v) => setC("houveDivisao", v)}
                label={comissao.houveDivisao ? "Há divisão" : "Sem divisão"} />
            </div>
            <AnimatePresence>
              {comissao.houveDivisao && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
                  <F label="% do corretor principal">
                    <div className="relative">
                      <Input type="number" step="1" min="0" max="100" value={comissao.percentualPrincipal}
                        onChange={(e) => setC("percentualPrincipal", e.target.value)} placeholder="70" className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">%</span>
                    </div>
                  </F>
                  {comissao.percentualPrincipal && comissaoTotal && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-3">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">Principal ({comissao.percentualPrincipal}%)</p>
                        <p className="font-bold text-green-700 dark:text-green-300">{fmt((comissaoTotal * Number(comissao.percentualPrincipal)) / 100)}</p>
                      </div>
                      {comissao.corretores.map((c, i) => (
                        <div key={i} className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-3">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">{c.nome || `Corretor ${i + 1}`} ({c.percentual || 0}%)</p>
                          <p className="font-bold text-blue-700 dark:text-blue-300">{fmt(c.percentual ? (comissaoTotal * Number(c.percentual)) / 100 : 0)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-3">
                    {comissao.corretores.map((c, i) => (
                      <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User2 className="h-3.5 w-3.5 text-zinc-400" />
                            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Corretor {i + 1}</p>
                          </div>
                          <button type="button" onClick={() => setComissao((p) => ({ ...p, corretores: p.corretores.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <F label="Nome"><Input value={c.nome} onChange={(e) => setComissao((p) => ({ ...p, corretores: p.corretores.map((x, idx) => idx === i ? { ...x, nome: e.target.value } : x) }))} placeholder="Nome completo" /></F>
                          <F label="CRECI"><Input value={c.creci} onChange={(e) => setComissao((p) => ({ ...p, corretores: p.corretores.map((x, idx) => idx === i ? { ...x, creci: e.target.value } : x) }))} placeholder="00000-J" /></F>
                          <F label="% da divisão">
                            <div className="relative">
                              <Input type="number" value={c.percentual} onChange={(e) => setComissao((p) => ({ ...p, corretores: p.corretores.map((x, idx) => idx === i ? { ...x, percentual: e.target.value } : x) }))} placeholder="30" className="pr-8" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">%</span>
                            </div>
                          </F>
                          <F label="Valor"><CurrencyInput value={c.valor} onChange={(v) => setComissao((p) => ({ ...p, corretores: p.corretores.map((x, idx) => idx === i ? { ...x, valor: v } : x) }))} /></F>
                        </div>
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => setComissao((p) => ({ ...p, corretores: [...p.corretores, { nome: "", creci: "", percentual: "", valor: "" }] }))}
                      className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                      <Plus className="h-3.5 w-3.5" /> Adicionar corretor
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CollapsibleCard>

      {/* ── DADOS BANCÁRIOS DO VENDEDOR ── */}
      <CollapsibleCard title="Conta e PIX do Vendedor" icon={DollarSign}
        defaultOpen={!!(venda.pixChave || venda.contaBanco)}
        summary={venda.pixChave ? `PIX ${venda.pixTipo?.toUpperCase()}: ${venda.pixChave}` : venda.contaBanco ? `Banco: ${venda.contaBanco}` : undefined}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">PIX</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Tipo de chave">
                <Sel value={venda.pixTipo} onChange={(v) => setV("pixTipo", v)}>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave aleatória</option>
                </Sel>
              </F>
              <F label="Chave PIX">
                <Input value={venda.pixChave} onChange={(e) => setV("pixChave", e.target.value)} placeholder="Digite a chave PIX" />
              </F>
            </div>
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Dados Bancários</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Titular da conta">
                <Input value={venda.contaTitular} onChange={(e) => setV("contaTitular", e.target.value)} placeholder="Nome completo ou razão social" />
              </F>
              <F label="Banco">
                <Input value={venda.contaBanco} onChange={(e) => setV("contaBanco", e.target.value)} placeholder="Ex: Caixa Econômica Federal" />
              </F>
              <F label="Agência">
                <Input value={venda.contaAgencia} onChange={(e) => setV("contaAgencia", e.target.value)} placeholder="0000" />
              </F>
              <F label="Conta">
                <Input value={venda.contaNumero} onChange={(e) => setV("contaNumero", e.target.value)} placeholder="00000-0" />
              </F>
              <F label="Tipo de conta">
                <Sel value={venda.contaTipo} onChange={(v) => setV("contaTipo", v)}>
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                </Sel>
              </F>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* ── RELATÓRIO DE PAGAMENTO AO COMPRADOR ── */}
      <CollapsibleCard title="Relatório de Pagamento ao Comprador" icon={CreditCard}
        defaultOpen={contas.length > 0}
        summary={contas.length > 0 ? `${contas.length} conta${contas.length > 1 ? "s" : ""} cadastrada${contas.length > 1 ? "s" : ""}` : undefined}>
        <div className="space-y-5">

          {/* Contas do Vendedor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Contas do Vendedor</p>
              <div className="flex items-center gap-3">
                {(venda.pixChave || venda.contaBanco) && (
                  <button type="button"
                    onClick={() => {
                      const novas: FormContaPagamento[] = [];
                      if (venda.pixChave) {
                        const cp = emptyContaPagamento("vendedor");
                        cp.descricao = "PIX do Vendedor";
                        cp.formaPagamento = "pix";
                        cp.pixChave = venda.pixChave;
                        cp.pixTipo = venda.pixTipo || "cpf";
                        cp.titular = venda.contaTitular;
                        novas.push(cp);
                      }
                      if (venda.contaBanco || venda.contaNumero) {
                        const cp = emptyContaPagamento("vendedor");
                        cp.descricao = "Conta do Vendedor";
                        cp.formaPagamento = "ted";
                        cp.banco = venda.contaBanco;
                        cp.agencia = venda.contaAgencia;
                        cp.numero = venda.contaNumero;
                        cp.contaTipo = venda.contaTipo || "corrente";
                        cp.titular = venda.contaTitular;
                        novas.push(cp);
                      }
                      if (novas.length > 0) setContas((p) => [...p, ...novas]);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                    Importar conta cadastrada
                  </button>
                )}
                <button type="button" onClick={() => setContas((p) => [...p, emptyContaPagamento("vendedor")])}
                  className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {contas.map((cp, gi) => cp.tipo !== "vendedor" ? null : (
                <ContaEntryForm key={gi} cp={cp}
                  onChange={(upd) => setContas((p) => p.map((c, i) => i === gi ? { ...c, ...upd } : c))}
                  onDelete={() => setContas((p) => p.filter((_, i) => i !== gi))} />
              ))}
              {contas.filter((c) => c.tipo === "vendedor").length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-3 italic">Nenhuma conta do vendedor adicionada</p>
              )}
            </div>
          </div>

          {/* Contas da Imobiliária */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Contas da Imobiliária</p>
              <button type="button" onClick={() => setContas((p) => [...p, emptyContaPagamento("imobiliaria")])}
                className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {contas.map((cp, gi) => cp.tipo !== "imobiliaria" ? null : (
                <ContaEntryForm key={gi} cp={cp}
                  onChange={(upd) => setContas((p) => p.map((c, i) => i === gi ? { ...c, ...upd } : c))}
                  onDelete={() => setContas((p) => p.filter((_, i) => i !== gi))} />
              ))}
              {contas.filter((c) => c.tipo === "imobiliaria").length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-3 italic">Nenhuma conta da imobiliária adicionada</p>
              )}
            </div>
          </div>

          {/* Total */}
          {contas.some((c) => n(c.valor)) && (
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total a pagar</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {fmt(contas.reduce((s, c) => s + (n(c.valor) ?? 0), 0))}
              </p>
            </div>
          )}

          {/* Botão do relatório */}
          <a href={`/admin/clientes/${clienteId}/relatorio-pagamento`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <FileBarChart2 className="h-4 w-4 text-zinc-500" />
            Gerar Relatório de Pagamento
          </a>
        </div>
      </CollapsibleCard>

      {/* ── AÇÕES ── */}
      <div className="flex gap-3">
        <Button variant="neon" className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar</>}
        </Button>
        <a
          href={`/admin/clientes/${clienteId}/relatorio-financeiro`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <FileBarChart2 className="h-4 w-4 text-zinc-500" />
          Gerar Relatório
        </a>
      </div>

      {/* ── HISTÓRICO ── */}
      {historico.length > 0 && (
        <CollapsibleCard title="Histórico Financeiro" icon={Clock} defaultOpen={false}
          summary={`${historico.length} registro${historico.length > 1 ? "s" : ""}`}>
          <div className="space-y-3">
            {historico.map((h, i) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  {i < historico.length - 1 && <div className="w-0.5 flex-1 bg-zinc-100 dark:bg-zinc-800 mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm text-zinc-900 dark:text-white">{h.descricao}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{h.usuario} · {new Date(h.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}
    </div>
  );
}
