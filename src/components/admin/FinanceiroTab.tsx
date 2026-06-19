"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, Building2, User2, Plus, Trash2,
  CheckCircle2, Clock, AlertCircle, Save, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Props {
  financiamentoId: string;
}

/* ── tipos locais para os formulários ── */
interface FormCorretor {
  id?: string;
  nome: string;
  creci: string;
  percentual: string;
  valor: string;
}

interface FormComissao {
  percentual: string;
  valor: string;
  dataPrevistaRecebimento: string;
  dataEfetivaRecebimento: string;
  status: string;
  houveAdiantamento: boolean;
  valorAdiantado: string;
  dataAdiantamento: string;
  obsAdiantamento: string;
  houveDivisao: boolean;
  percentualPrincipal: string;
  corretores: FormCorretor[];
}

interface FormVenda {
  tipoVenda: string;
  valorImovel: string;
  dataVenda: string;
  statusVenda: string;
  // À vista
  sinalValor: string;
  sinalData: string;
  sinalFormaPagamento: string;
  sinalStatus: string;
  escrituraValorRestante: string;
  escrituraDataPrevista: string;
  escrituraDataQuitacao: string;
  escrituraStatus: string;
  // Financiamento
  entradaValor: string;
  entradaData: string;
  entradaFormaPagamento: string;
  usouFgts: boolean;
  fgtsValor: string;
  bancoFinanciador: string;
  valorFinanciado: string;
  contratoDataAssinatura: string;
  contratoStatus: string;
  valorLiberadoBanco: string;
  dataLiberacaoBanco: string;
}

interface HistoricoItem {
  id: string;
  descricao: string;
  usuario: string;
  createdAt: string;
}

/* ── helpers ── */
const fmt = (v?: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

const n = (s: string): number | null => (s.trim() === "" ? null : Number(s));
const d = (s: string): string | null => (s.trim() === "" ? null : s);

function emptyVenda(): FormVenda {
  return {
    tipoVenda: "financiamento",
    valorImovel: "", dataVenda: "", statusVenda: "em_andamento",
    sinalValor: "", sinalData: "", sinalFormaPagamento: "pix", sinalStatus: "pendente",
    escrituraValorRestante: "", escrituraDataPrevista: "", escrituraDataQuitacao: "", escrituraStatus: "pendente",
    entradaValor: "", entradaData: "", entradaFormaPagamento: "pix",
    usouFgts: false, fgtsValor: "",
    bancoFinanciador: "", valorFinanciado: "", contratoDataAssinatura: "", contratoStatus: "em_analise",
    valorLiberadoBanco: "", dataLiberacaoBanco: "",
  };
}

function emptyComissao(): FormComissao {
  return {
    percentual: "", valor: "", dataPrevistaRecebimento: "", dataEfetivaRecebimento: "", status: "pendente",
    houveAdiantamento: false, valorAdiantado: "", dataAdiantamento: "", obsAdiantamento: "",
    houveDivisao: false, percentualPrincipal: "", corretores: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiToFormVenda(data: any): FormVenda {
  const s = (v: unknown) => (v != null ? String(v) : "");
  const dt = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");
  return {
    tipoVenda: data.tipoVenda ?? "financiamento",
    valorImovel: s(data.valorImovel), dataVenda: dt(data.dataVenda), statusVenda: data.statusVenda ?? "em_andamento",
    sinalValor: s(data.sinalValor), sinalData: dt(data.sinalData),
    sinalFormaPagamento: data.sinalFormaPagamento ?? "pix", sinalStatus: data.sinalStatus ?? "pendente",
    escrituraValorRestante: s(data.escrituraValorRestante), escrituraDataPrevista: dt(data.escrituraDataPrevista),
    escrituraDataQuitacao: dt(data.escrituraDataQuitacao), escrituraStatus: data.escrituraStatus ?? "pendente",
    entradaValor: s(data.entradaValor), entradaData: dt(data.entradaData),
    entradaFormaPagamento: data.entradaFormaPagamento ?? "pix",
    usouFgts: data.usouFgts ?? false, fgtsValor: s(data.fgtsValor),
    bancoFinanciador: data.bancoFinanciador ?? "", valorFinanciado: s(data.valorFinanciado),
    contratoDataAssinatura: dt(data.contratoDataAssinatura), contratoStatus: data.contratoStatus ?? "em_analise",
    valorLiberadoBanco: s(data.valorLiberadoBanco), dataLiberacaoBanco: dt(data.dataLiberacaoBanco),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiToFormComissao(c: any): FormComissao {
  const s = (v: unknown) => (v != null ? String(v) : "");
  const dt = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");
  return {
    percentual: s(c.percentual), valor: s(c.valor),
    dataPrevistaRecebimento: dt(c.dataPrevistaRecebimento), dataEfetivaRecebimento: dt(c.dataEfetivaRecebimento),
    status: c.status ?? "pendente",
    houveAdiantamento: c.houveAdiantamento ?? false,
    valorAdiantado: s(c.valorAdiantado), dataAdiantamento: dt(c.dataAdiantamento),
    obsAdiantamento: c.obsAdiantamento ?? "",
    houveDivisao: c.houveDivisao ?? false, percentualPrincipal: s(c.percentualPrincipal),
    corretores: (c.corretores ?? []).map((cr: { id?: string; nome?: string; creci?: string; percentual?: number; valor?: number }) => ({
      id: cr.id, nome: cr.nome ?? "", creci: cr.creci ?? "",
      percentual: cr.percentual != null ? String(cr.percentual) : "",
      valor: cr.valor != null ? String(cr.valor) : "",
    })),
  };
}

/* ── sub-componentes ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente:   { label: "Pendente",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    pago:       { label: "Pago",       cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    recebida:   { label: "Recebida",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    parcial:    { label: "Parcial",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    cancelada:  { label: "Cancelada",  cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    em_analise: { label: "Em análise", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
    aprovado:   { label: "Aprovado",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    assinado:   { label: "Assinado",   cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    liberado:   { label: "Liberado",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    cancelado:  { label: "Cancelado",  cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-100 text-zinc-600" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-500 dark:text-zinc-400">{label}</Label>
      {children}
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

function Divider() {
  return <div className="border-t border-zinc-100 dark:border-zinc-800" />;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">{children}</p>;
}

function SummaryCard({ label, value, color = "zinc" }: { label: string; value: string; color?: "zinc" | "green" | "amber" | "blue" }) {
  const cls: Record<string, string> = {
    zinc:  "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700 text-zinc-500 text-zinc-700 dark:text-zinc-300",
    green: "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30 text-green-600 dark:text-green-400 text-green-700 dark:text-green-300",
    amber: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400 text-amber-700 dark:text-amber-300",
    blue:  "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 text-blue-700 dark:text-blue-300",
  };
  const parts = cls[color].split(" ");
  return (
    <div className={`rounded-xl border p-3 text-center ${parts[0]} ${parts[1]} ${parts[2]}`}>
      <p className={`text-xs mb-1 ${parts[3]} ${parts[4]}`}>{label}</p>
      <p className={`font-bold ${parts[5]} ${parts[6]}`}>{value}</p>
    </div>
  );
}

/* ── componente principal ── */
export function FinanceiroTab({ financiamentoId }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [venda, setVenda]       = useState<FormVenda>(emptyVenda());
  const [comissao, setComissao] = useState<FormComissao>(emptyComissao());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/financiamentos/${financiamentoId}/financeiro`);
      const json = await res.json();
      if (json.data) {
        setVenda(apiToFormVenda(json.data));
        if (json.data.comissao) setComissao(apiToFormComissao(json.data.comissao));
        setHistorico(json.data.historico ?? []);
      }
    } catch {
      addToast({ title: "Erro ao carregar dados financeiros", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [financiamentoId]);

  useEffect(() => { load(); }, [load]);

  /* cálculos automáticos */
  const calcComissaoAuto = () => {
    const vi = n(venda.valorImovel);
    const pc = n(comissao.percentual);
    return vi && pc ? (vi * pc) / 100 : null;
  };

  const calcRestanteComissao = () => {
    const total = n(comissao.valor) ?? calcComissaoAuto() ?? 0;
    const adiant = comissao.houveAdiantamento ? (n(comissao.valorAdiantado) ?? 0) : 0;
    return total - adiant;
  };

  const totalRecebidoAvista = () => {
    const sinal     = venda.sinalStatus === "pago"     ? (n(venda.sinalValor) ?? 0) : 0;
    const escritura = venda.escrituraStatus === "pago" ? (n(venda.escrituraValorRestante) ?? 0) : 0;
    return sinal + escritura;
  };

  const totalRecebidoFin = () =>
    (n(venda.entradaValor) ?? 0) +
    (venda.usouFgts ? (n(venda.fgtsValor) ?? 0) : 0) +
    (n(venda.valorLiberadoBanco) ?? 0);

  const percentualRecebido = () => {
    const vi = n(venda.valorImovel);
    const tr = totalRecebidoAvista();
    return vi && tr ? Math.round((tr / vi) * 100) : 0;
  };

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        tipoVenda:            venda.tipoVenda,
        valorImovel:          n(venda.valorImovel),
        dataVenda:            d(venda.dataVenda),
        statusVenda:          venda.statusVenda,
        sinalValor:           n(venda.sinalValor),
        sinalData:            d(venda.sinalData),
        sinalFormaPagamento:  venda.sinalFormaPagamento,
        sinalStatus:          venda.sinalStatus,
        escrituraValorRestante: n(venda.escrituraValorRestante),
        escrituraDataPrevista:  d(venda.escrituraDataPrevista),
        escrituraDataQuitacao:  d(venda.escrituraDataQuitacao),
        escrituraStatus:        venda.escrituraStatus,
        entradaValor:          n(venda.entradaValor),
        entradaData:           d(venda.entradaData),
        entradaFormaPagamento: venda.entradaFormaPagamento,
        usouFgts:              venda.usouFgts,
        fgtsValor:             n(venda.fgtsValor),
        bancoFinanciador:      d(venda.bancoFinanciador),
        valorFinanciado:       n(venda.valorFinanciado),
        contratoDataAssinatura: d(venda.contratoDataAssinatura),
        contratoStatus:        venda.contratoStatus,
        valorLiberadoBanco:    n(venda.valorLiberadoBanco),
        dataLiberacaoBanco:    d(venda.dataLiberacaoBanco),
        comissao: {
          percentual:              n(comissao.percentual),
          valor:                   n(comissao.valor) ?? calcComissaoAuto(),
          dataPrevistaRecebimento: d(comissao.dataPrevistaRecebimento),
          dataEfetivaRecebimento:  d(comissao.dataEfetivaRecebimento),
          status:                  comissao.status,
          houveAdiantamento:       comissao.houveAdiantamento,
          valorAdiantado:          n(comissao.valorAdiantado),
          dataAdiantamento:        d(comissao.dataAdiantamento),
          obsAdiantamento:         comissao.obsAdiantamento || null,
          houveDivisao:            comissao.houveDivisao,
          percentualPrincipal:     n(comissao.percentualPrincipal),
          corretores: comissao.corretores.map((c) => ({
            id:         c.id,
            nome:       c.nome,
            creci:      c.creci || null,
            percentual: n(c.percentual),
            valor:      n(c.valor),
          })),
        },
      };

      const res = await fetch(`/api/admin/financiamentos/${financiamentoId}/financeiro`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const setV = (k: keyof FormVenda, v: FormVenda[typeof k]) =>
    setVenda((p) => ({ ...p, [k]: v }));
  const setC = (k: keyof FormComissao, v: FormComissao[typeof k]) =>
    setComissao((p) => ({ ...p, [k]: v }));

  function addCorretor() {
    setComissao((p) => ({
      ...p,
      corretores: [...p.corretores, { nome: "", creci: "", percentual: "", valor: "" }],
    }));
  }
  function updateCorretor(i: number, k: keyof FormCorretor, v: string) {
    setComissao((p) => {
      const arr = p.corretores.map((c, idx) => idx === i ? { ...c, [k]: v } : c);
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

  const avista = venda.tipoVenda === "avista";
  const comissaoCalc = calcComissaoAuto();
  const comissaoTotal = n(comissao.valor) ?? comissaoCalc;

  return (
    <div className="space-y-5">

      {/* ── INFORMAÇÕES GERAIS ── */}
      <Card title="Informações Gerais da Venda" icon={DollarSign}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Tipo de venda">
            <Sel value={venda.tipoVenda} onChange={(v) => setV("tipoVenda", v)}>
              <option value="financiamento">Financiamento Bancário</option>
              <option value="avista">Pagamento à Vista</option>
            </Sel>
          </F>
          <F label="Valor total do imóvel (R$)">
            <Input type="number" placeholder="0,00" value={venda.valorImovel}
              onChange={(e) => setV("valorImovel", e.target.value)} />
          </F>
          <F label="Data da venda">
            <Input type="date" value={venda.dataVenda} onChange={(e) => setV("dataVenda", e.target.value)} />
          </F>
          <F label="Status da venda">
            <Sel value={venda.statusVenda} onChange={(v) => setV("statusVenda", v)}>
              <option value="em_andamento">Em andamento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </Sel>
          </F>
        </div>
      </Card>

      {/* ── PAGAMENTO À VISTA ── */}
      <AnimatePresence>
        {avista && (
          <motion.div key="avista" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card title="Pagamento à Vista" icon={CheckCircle2}>
              <div className="space-y-5">
                <div>
                  <SubTitle>Sinal</SubTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor do sinal (R$)"><Input type="number" value={venda.sinalValor} onChange={(e) => setV("sinalValor", e.target.value)} /></F>
                    <F label="Data do pagamento"><Input type="date" value={venda.sinalData} onChange={(e) => setV("sinalData", e.target.value)} /></F>
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
                <Divider />
                <div>
                  <SubTitle>Escritura</SubTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor restante (R$)"><Input type="number" value={venda.escrituraValorRestante} onChange={(e) => setV("escrituraValorRestante", e.target.value)} /></F>
                    <F label="Data prevista"><Input type="date" value={venda.escrituraDataPrevista} onChange={(e) => setV("escrituraDataPrevista", e.target.value)} /></F>
                    <F label="Data da quitação"><Input type="date" value={venda.escrituraDataQuitacao} onChange={(e) => setV("escrituraDataQuitacao", e.target.value)} /></F>
                    <F label="Status">
                      <Sel value={venda.escrituraStatus} onChange={(v) => setV("escrituraStatus", v)}>
                        <option value="pendente">Pendente</option><option value="pago">Pago</option>
                      </Sel>
                    </F>
                  </div>
                </div>
                <Divider />
                <div>
                  <SubTitle>Resumo</SubTitle>
                  <div className="grid grid-cols-3 gap-3">
                    <SummaryCard color="green" label="Total recebido" value={fmt(totalRecebidoAvista())} />
                    <SummaryCard color="amber" label="Pendente" value={fmt(Math.max(0, (n(venda.valorImovel) ?? 0) - totalRecebidoAvista()))} />
                    <SummaryCard color="zinc"  label="% recebido" value={`${percentualRecebido()}%`} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FINANCIAMENTO BANCÁRIO ── */}
      <AnimatePresence>
        {!avista && (
          <motion.div key="financiamento" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card title="Financiamento Bancário" icon={Building2}>
              <div className="space-y-5">
                <div>
                  <SubTitle>Entrada</SubTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor da entrada (R$)"><Input type="number" value={venda.entradaValor} onChange={(e) => setV("entradaValor", e.target.value)} /></F>
                    <F label="Data de pagamento"><Input type="date" value={venda.entradaData} onChange={(e) => setV("entradaData", e.target.value)} /></F>
                    <F label="Forma de pagamento">
                      <Sel value={venda.entradaFormaPagamento} onChange={(v) => setV("entradaFormaPagamento", v)}>
                        <option value="pix">PIX</option><option value="ted">TED</option>
                        <option value="dinheiro">Dinheiro</option><option value="outro">Outro</option>
                      </Sel>
                    </F>
                  </div>
                </div>
                <Divider />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SubTitle>FGTS</SubTitle>
                    <Toggle checked={venda.usouFgts} onChange={(v) => setV("usouFgts", v)} label={venda.usouFgts ? "Utilizou FGTS" : "Não utilizou FGTS"} />
                  </div>
                  <AnimatePresence>
                    {venda.usouFgts && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <F label="Valor do FGTS (R$)"><Input type="number" value={venda.fgtsValor} onChange={(e) => setV("fgtsValor", e.target.value)} /></F>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Divider />
                <div>
                  <SubTitle>Contrato Bancário</SubTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Banco"><Input value={venda.bancoFinanciador} onChange={(e) => setV("bancoFinanciador", e.target.value)} placeholder="Ex: Caixa Econômica" /></F>
                    <F label="Valor financiado (R$)"><Input type="number" value={venda.valorFinanciado} onChange={(e) => setV("valorFinanciado", e.target.value)} /></F>
                    <F label="Data da assinatura"><Input type="date" value={venda.contratoDataAssinatura} onChange={(e) => setV("contratoDataAssinatura", e.target.value)} /></F>
                    <F label="Status da aprovação">
                      <Sel value={venda.contratoStatus} onChange={(v) => setV("contratoStatus", v)}>
                        <option value="em_analise">Em análise</option><option value="aprovado">Aprovado</option>
                        <option value="assinado">Assinado</option><option value="liberado">Liberado</option>
                        <option value="cancelado">Cancelado</option>
                      </Sel>
                    </F>
                  </div>
                </div>
                <Divider />
                <div>
                  <SubTitle>Recebimento da Construtora</SubTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor liberado pelo banco (R$)"><Input type="number" value={venda.valorLiberadoBanco} onChange={(e) => setV("valorLiberadoBanco", e.target.value)} /></F>
                    <F label="Data de liberação"><Input type="date" value={venda.dataLiberacaoBanco} onChange={(e) => setV("dataLiberacaoBanco", e.target.value)} /></F>
                  </div>
                </div>
                <Divider />
                <div>
                  <SubTitle>Resumo</SubTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <SummaryCard color="zinc"  label="Entrada"         value={fmt(n(venda.entradaValor))} />
                    <SummaryCard color="zinc"  label="FGTS"            value={venda.usouFgts ? fmt(n(venda.fgtsValor)) : "—"} />
                    <SummaryCard color="blue"  label="Valor financiado" value={fmt(n(venda.valorFinanciado))} />
                    <SummaryCard color="green" label="Total recebido"   value={fmt(totalRecebidoFin())} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMISSÃO IMOBILIÁRIA ── */}
      <Card title="Comissão Imobiliária" icon={TrendingUp}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Percentual (%)">
              <Input type="number" step="0.1" value={comissao.percentual}
                onChange={(e) => {
                  setC("percentual", e.target.value);
                  const vi = n(venda.valorImovel);
                  const pc = e.target.value ? Number(e.target.value) : null;
                  if (vi && pc) setC("valor", String((vi * pc) / 100));
                }} />
            </F>
            <F label="Valor da comissão (R$)">
              <Input type="number" value={comissao.valor}
                placeholder={comissaoCalc != null ? fmt(comissaoCalc) : "0,00"}
                onChange={(e) => setC("valor", e.target.value)} />
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
          </div>

          <Divider />

          {/* Adiantamento */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SubTitle>Adiantamento de Comissão</SubTitle>
              <Toggle checked={comissao.houveAdiantamento} onChange={(v) => setC("houveAdiantamento", v)}
                label={comissao.houveAdiantamento ? "Houve adiantamento" : "Sem adiantamento"} />
            </div>
            <AnimatePresence>
              {comissao.houveAdiantamento && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Valor adiantado (R$)"><Input type="number" value={comissao.valorAdiantado} onChange={(e) => setC("valorAdiantado", e.target.value)} /></F>
                    <F label="Data do adiantamento"><Input type="date" value={comissao.dataAdiantamento} onChange={(e) => setC("dataAdiantamento", e.target.value)} /></F>
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
                      <p className="font-bold text-amber-700 dark:text-amber-300">{fmt(calcRestanteComissao())}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Divider />

          {/* Divisão */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SubTitle>Divisão de Comissão</SubTitle>
              <Toggle checked={comissao.houveDivisao} onChange={(v) => setC("houveDivisao", v)}
                label={comissao.houveDivisao ? "Há divisão" : "Sem divisão"} />
            </div>
            <AnimatePresence>
              {comissao.houveDivisao && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
                  <F label="% do corretor principal">
                    <Input type="number" step="1" max="100" value={comissao.percentualPrincipal}
                      onChange={(e) => setC("percentualPrincipal", e.target.value)} placeholder="Ex: 70" />
                  </F>

                  {/* Resumo da divisão */}
                  {comissao.percentualPrincipal && comissaoTotal && (
                    <div className="grid grid-cols-2 gap-3">
                      <SummaryCard color="green"
                        label={`Corretor principal (${comissao.percentualPrincipal}%)`}
                        value={fmt((comissaoTotal * Number(comissao.percentualPrincipal)) / 100)} />
                      {comissao.corretores.map((c, i) => (
                        <SummaryCard key={i} color="blue"
                          label={`${c.nome || `Corretor ${i + 1}`} (${c.percentual || 0}%)`}
                          value={fmt(comissaoTotal && c.percentual ? (comissaoTotal * Number(c.percentual)) / 100 : 0)} />
                      ))}
                    </div>
                  )}

                  {/* Lista de corretores */}
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
                          <F label="Nome"><Input value={c.nome} onChange={(e) => updateCorretor(i, "nome", e.target.value)} placeholder="Nome completo" /></F>
                          <F label="CRECI"><Input value={c.creci} onChange={(e) => updateCorretor(i, "creci", e.target.value)} placeholder="00000-J" /></F>
                          <F label="% da divisão"><Input type="number" value={c.percentual} onChange={(e) => updateCorretor(i, "percentual", e.target.value)} placeholder="30" /></F>
                          <F label="Valor (R$)"><Input type="number" value={c.valor} onChange={(e) => updateCorretor(i, "valor", e.target.value)} /></F>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addCorretor}
                      className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar corretor participante
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {/* ── BOTÃO SALVAR ── */}
      <Button variant="neon" className="w-full" onClick={handleSave} disabled={saving}>
        {saving
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
          : <><Save className="h-4 w-4 mr-2" />Salvar dados financeiros</>}
      </Button>

      {/* ── HISTÓRICO FINANCEIRO ── */}
      {historico.length > 0 && (
        <Card title="Histórico Financeiro" icon={Clock}>
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
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {h.usuario} · {new Date(h.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* badge de status visível no topo da seção comissão */}
      {comissao.status && (
        <div className="flex justify-end">
          <StatusBadge status={comissao.status} />
        </div>
      )}
    </div>
  );
}
