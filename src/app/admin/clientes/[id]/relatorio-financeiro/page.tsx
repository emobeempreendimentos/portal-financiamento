"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface Cliente {
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  conjuge?: string | null;
  conjugeCpf?: string | null;
  banco?: string | null;
  financiamento?: {
    id: string;
    protocolo: number;
    statusGeral: string;
    createdAt: string;
    etapas?: { nome: string; status: string; dataConclusao?: string | null }[];
  } | null;
}

interface FinanceiroData {
  tipoVenda: string;
  bancoFinanciador?: string | null;
  valorFinanciado?: number | null;
  contratoDataAssinatura?: string | null;
  contratoStatus?: string | null;
  entradaValor?: number | null;
  entradaData?: string | null;
  entradaFormaPagamento?: string | null;
  usouFgts: boolean;
  fgtsValor?: number | null;
  sinalValor?: number | null;
  sinalData?: string | null;
  sinalFormaPagamento?: string | null;
  sinalStatus?: string | null;
  escrituraValorRestante?: number | null;
  escrituraDataPrevista?: string | null;
  escrituraDataQuitacao?: string | null;
  escrituraStatus?: string | null;
  comissao?: {
    percentual?: number | null;
    valor?: number | null;
    status: string;
    houveAdiantamento: boolean;
    valorAdiantado?: number | null;
    dataAdiantamento?: string | null;
    obsAdiantamento?: string | null;
    houveDivisao: boolean;
    percentualPrincipal?: number | null;
    corretores?: { nome: string; creci?: string | null; percentual?: number | null; valor?: number | null }[];
  } | null;
}

const STATUS_PT: Record<string, string> = {
  em_andamento: "Em andamento", concluido: "Concluído", pausado: "Pausado", cancelado: "Cancelado",
  pendente: "Pendente", recebida: "Recebida", parcial: "Parcial", cancelada: "Cancelada",
  em_analise: "Em análise", aprovado: "Aprovado", assinado: "Assinado", liberado: "Liberado", pago: "Pago",
};
const FP_PT: Record<string, string> = { pix: "PIX", ted: "TED", dinheiro: "Dinheiro", outro: "Outro" };

const R = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const D = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString("pt-BR") : "—";

export default function RelatorioFinanceiroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [financeiro, setFinanceiro] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cRes] = await Promise.all([fetch(`/api/clientes/${id}`)]);
        const cJson = await cRes.json();
        const c: Cliente = cJson.data;
        setCliente(c);
        if (c.financiamento?.id) {
          const fRes = await fetch(`/api/admin/financiamentos/${c.financiamento.id}/financeiro`);
          const fJson = await fRes.json();
          setFinanceiro(fJson.data ?? null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
    </div>
  );

  if (!cliente) return <p className="p-8 text-center text-gray-500">Cliente não encontrado</p>;

  const avista = financeiro?.tipoVenda === "avista";
  const protocolo = cliente.financiamento?.protocolo
    ? `EMB-${String(cliente.financiamento.protocolo).padStart(5, "0")}`
    : "—";
  const banco = financeiro?.bancoFinanciador || cliente.banco || "Não informado";

  const comissaoTotal = financeiro?.comissao?.valor ?? null;
  const comissaoRestante = comissaoTotal != null && financeiro?.comissao?.houveAdiantamento
    ? comissaoTotal - (financeiro.comissao.valorAdiantado ?? 0)
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Toolbar (não imprime) ─── */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
          ← Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* ─── Conteúdo do relatório ─── */}
      <div className="print:pt-0 pt-16 max-w-3xl mx-auto px-8 py-10 print:px-10 print:py-8">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-10 border-b border-gray-200 pb-8">
          <div>
            <div className="text-2xl font-bold text-green-700 tracking-tight mb-1">Emobe Empreendimentos</div>
            <div className="text-sm text-gray-400">Relatório Financeiro de Venda</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-0.5">Protocolo</div>
            <div className="text-sm font-mono font-semibold text-gray-700">{protocolo}</div>
            <div className="text-xs text-gray-400 mt-1">Emitido em {new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        {/* Informações da Venda */}
        <Section title="Informações da Venda">
          <Row label="Cliente"      value={cliente.nome} />
          {cliente.cpf && <Row label="CPF" value={cliente.cpf} />}
          {cliente.conjuge && <Row label="Cônjuge" value={`${cliente.conjuge}${cliente.conjugeCpf ? ` — ${cliente.conjugeCpf}` : ""}`} />}
          {cliente.telefone && <Row label="Telefone" value={cliente.telefone} />}
          <Row label="Tipo de pagamento"  value={avista ? "Pagamento à Vista" : "Financiamento Bancário"} />
          <Row label="Data de início"     value={D(cliente.financiamento?.createdAt)} />
          <Row label="Status do processo" value={STATUS_PT[cliente.financiamento?.statusGeral ?? ""] ?? "—"} />
        </Section>

        {/* Financiamento Bancário */}
        {!avista && financeiro && (
          <Section title="Financiamento Bancário">
            <Row label="Banco"                    value={banco} />
            <Row label="Valor financiado"          value={R(financeiro.valorFinanciado)} />
            {financeiro.entradaValor && <>
              <Row label="Valor da entrada"        value={R(financeiro.entradaValor)} />
              <Row label="Data da entrada"         value={D(financeiro.entradaData)} />
              <Row label="Forma de pagamento"      value={FP_PT[financeiro.entradaFormaPagamento ?? ""] ?? "—"} />
            </>}
            {financeiro.usouFgts && <>
              <Row label="FGTS utilizado"          value="Sim" />
              <Row label="Valor do FGTS"           value={R(financeiro.fgtsValor)} />
            </>}
            {financeiro.contratoDataAssinatura && <>
              <Row label="Assinatura do contrato"  value={D(financeiro.contratoDataAssinatura)} />
              <Row label="Status da aprovação"     value={STATUS_PT[financeiro.contratoStatus ?? ""] ?? "—"} />
            </>}
          </Section>
        )}

        {/* Pagamento à Vista */}
        {avista && financeiro && (
          <Section title="Pagamento à Vista">
            {financeiro.sinalValor && <>
              <Row label="Valor do sinal"          value={R(financeiro.sinalValor)} />
              <Row label="Data do sinal"           value={D(financeiro.sinalData)} />
              <Row label="Forma de pagamento"      value={FP_PT[financeiro.sinalFormaPagamento ?? ""] ?? "—"} />
              <Row label="Status do sinal"         value={STATUS_PT[financeiro.sinalStatus ?? ""] ?? "—"} />
            </>}
            {financeiro.escrituraValorRestante && <>
              <Row label="Restante na escritura"   value={R(financeiro.escrituraValorRestante)} />
              <Row label="Data prevista"           value={D(financeiro.escrituraDataPrevista)} />
              {financeiro.escrituraDataQuitacao && <Row label="Data de quitação" value={D(financeiro.escrituraDataQuitacao)} />}
              <Row label="Status da escritura"     value={STATUS_PT[financeiro.escrituraStatus ?? ""] ?? "—"} />
            </>}
          </Section>
        )}

        {/* Comissão */}
        {financeiro?.comissao && (
          <Section title="Comissão Imobiliária">
            {financeiro.comissao.percentual != null && (
              <Row label="Percentual" value={`${financeiro.comissao.percentual}%`} />
            )}
            <Row label="Valor total"   value={R(comissaoTotal)} />
            <Row label="Status"        value={STATUS_PT[financeiro.comissao.status] ?? "—"} />
            {financeiro.comissao.houveAdiantamento && <>
              <Row label="Adiantamento"        value={R(financeiro.comissao.valorAdiantado)} />
              <Row label="Data do adiantamento" value={D(financeiro.comissao.dataAdiantamento)} />
              {comissaoRestante != null && <Row label="Restante a receber" value={R(comissaoRestante)} highlight />}
              {financeiro.comissao.obsAdiantamento && <Row label="Observações" value={financeiro.comissao.obsAdiantamento} />}
            </>}
            {financeiro.comissao.houveDivisao && financeiro.comissao.corretores && financeiro.comissao.corretores.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Divisão de Comissão</div>
                {financeiro.comissao.percentualPrincipal != null && comissaoTotal != null && (
                  <div className="flex justify-between py-1.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-600">Corretor principal ({financeiro.comissao.percentualPrincipal}%)</span>
                    <span className="font-semibold text-gray-800">{R((comissaoTotal * financeiro.comissao.percentualPrincipal) / 100)}</span>
                  </div>
                )}
                {financeiro.comissao.corretores.map((c, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-gray-100 text-sm last:border-0">
                    <span className="text-gray-600">{c.nome}{c.creci ? ` (CRECI ${c.creci})` : ""}{c.percentual != null ? ` — ${c.percentual}%` : ""}</span>
                    <span className="font-semibold text-gray-800">{R(c.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Etapas */}
        {(cliente.financiamento?.etapas?.length ?? 0) > 0 && (
          <Section title="Etapas do Processo">
            {cliente.financiamento!.etapas!.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${e.status === "concluido" ? "bg-green-500" : e.status === "em_andamento" ? "bg-blue-500" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-700">{e.nome}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {e.status === "concluido" && e.dataConclusao ? D(e.dataConclusao) : STATUS_PT[e.status] ?? e.status}
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Rodapé */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Este documento é de uso interno e foi gerado automaticamente pelo Portal de Financiamento Emobe.</p>
          <p className="mt-1">Emobe Empreendimentos · {new Date().getFullYear()}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gray-200" />
        <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest whitespace-nowrap">{title}</h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-2 border-b border-gray-100 last:border-0 ${highlight ? "font-bold" : ""}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-right max-w-xs ${highlight ? "text-green-700" : "text-gray-800 font-medium"}`}>{value}</span>
    </div>
  );
}
