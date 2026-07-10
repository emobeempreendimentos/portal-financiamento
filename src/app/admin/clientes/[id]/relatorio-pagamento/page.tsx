"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface Cliente {
  nome: string;
  cpf?: string | null;
  conjuge?: string | null;
  conjugeCpf?: string | null;
  financiamento?: {
    id: string;
    protocolo: number;
    statusGeral: string;
    createdAt: string;
  } | null;
}

interface ContaPagamento {
  id: string;
  tipo: string;
  descricao?: string | null;
  formaPagamento?: string | null;
  pixChave?: string | null;
  pixTipo?: string | null;
  banco?: string | null;
  agencia?: string | null;
  numero?: string | null;
  contaTipo?: string | null;
  titular?: string | null;
  documento?: string | null;
  valor?: number | null;
  ordem: number;
}

interface FinanceiroData {
  valorImovel?: number | null;
  relatorioObservacoes?: string | null;
  contasPagamento?: ContaPagamento[];
}

const PIX_PT: Record<string, string> = {
  cpf: "CPF", cnpj: "CNPJ", email: "E-mail", telefone: "Telefone", aleatoria: "Chave aleatória",
};
const FP_PT: Record<string, string> = { pix: "PIX", ted: "TED", doc: "DOC", dinheiro: "Dinheiro" };
const CT_PT: Record<string, string> = { corrente: "Corrente", poupanca: "Poupança" };

const R = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

export default function RelatorioPagamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [financeiro, setFinanceiro] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cRes = await fetch(`/api/clientes/${id}`);
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

  const protocolo = cliente.financiamento?.protocolo
    ? `EMB-${String(cliente.financiamento.protocolo).padStart(5, "0")}`
    : "—";

  const contas = financeiro?.contasPagamento ?? [];
  const vendedorContas   = contas.filter((c) => c.tipo === "vendedor");
  const imobiliariaContas = contas.filter((c) => c.tipo === "imobiliaria");
  const totalGeral = contas.reduce((s, c) => s + (c.valor ?? 0), 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar (não imprime) */}
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

      {/* Conteúdo */}
      <div className="print:pt-0 pt-16 max-w-3xl mx-auto px-8 py-10 print:px-10 print:py-8">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-10 border-b border-gray-200 pb-8">
          <div>
            <img src="/logo.png" alt="Emobe Empreendimentos" className="h-14 object-contain mb-2" />
            <div className="text-sm text-gray-400">Instruções de Pagamento</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-0.5">Protocolo</div>
            <div className="text-sm font-mono font-semibold text-gray-700">{protocolo}</div>
            <div className="text-xs text-gray-400 mt-1">Emitido em {new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        {/* Comprador */}
        <Section title="Informações do Comprador">
          <Row label="Nome" value={cliente.nome} />
          {cliente.cpf && <Row label="CPF" value={cliente.cpf} />}
          {cliente.conjuge && (
            <Row label="Cônjuge" value={`${cliente.conjuge}${cliente.conjugeCpf ? ` — ${cliente.conjugeCpf}` : ""}`} />
          )}
          {financeiro?.valorImovel && <Row label="Valor do imóvel" value={R(financeiro.valorImovel)} />}
        </Section>

        {/* Aviso se não houver contas */}
        {contas.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm italic">
            Nenhuma instrução de pagamento cadastrada.<br />
            Acesse o Financeiro do cliente para adicionar as contas.
          </div>
        )}

        {/* Contas do Vendedor */}
        {vendedorContas.length > 0 && (
          <Section title="Pagamento ao Vendedor">
            {vendedorContas.map((cp, i) => (
              <ContaBlock key={i} cp={cp} />
            ))}
          </Section>
        )}

        {/* Contas da Imobiliária */}
        {imobiliariaContas.length > 0 && (
          <Section title="Pagamento à Imobiliária">
            {imobiliariaContas.map((cp, i) => (
              <ContaBlock key={i} cp={cp} />
            ))}
          </Section>
        )}

        {/* Total */}
        {contas.length > 0 && (
          <div className="mt-8 rounded-lg bg-green-50 border border-green-100 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-green-800">Total geral de pagamentos</span>
            <span className="text-lg font-bold text-green-700">{R(totalGeral)}</span>
          </div>
        )}

        {/* Observação */}
        {financeiro?.relatorioObservacoes && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Observação</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {financeiro.relatorioObservacoes}
            </p>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Este documento contém instruções de pagamento geradas pelo Portal de Financiamento Emobe.</p>
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

function ContaBlock({ cp }: { cp: ContaPagamento }) {
  const isPix    = cp.formaPagamento === "pix";
  const isTedDoc = cp.formaPagamento === "ted" || cp.formaPagamento === "doc";

  return (
    <div className="mb-5 pb-5 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          {cp.descricao && (
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider">{cp.descricao}</span>
          )}
          {cp.formaPagamento && (
            <span className="ml-2 text-xs text-gray-400">— {FP_PT[cp.formaPagamento] ?? cp.formaPagamento}</span>
          )}
        </div>
        {cp.valor != null && (
          <span className="text-base font-bold text-gray-800">{R(cp.valor)}</span>
        )}
      </div>

      <div className="space-y-1 pl-1">
        {cp.titular && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 w-20 shrink-0">Titular</span>
            <span className="text-gray-700 font-medium">{cp.titular}</span>
          </div>
        )}

        {cp.documento && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 w-20 shrink-0">
              {cp.documento.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF"}
            </span>
            <span className="text-gray-700 font-medium">{cp.documento}</span>
          </div>
        )}

        {isPix && cp.pixChave && (
          <div className="flex gap-2 text-sm">
            <span className="text-gray-400 w-20 shrink-0">Chave PIX</span>
            <span className="text-gray-700 font-medium">
              {cp.pixTipo ? `(${PIX_PT[cp.pixTipo] ?? cp.pixTipo}) ` : ""}{cp.pixChave}
            </span>
          </div>
        )}

        {isTedDoc && (<>
          {cp.banco && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 w-20 shrink-0">Banco</span>
              <span className="text-gray-700 font-medium">{cp.banco}</span>
            </div>
          )}
          {(cp.agencia || cp.numero) && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 w-20 shrink-0">Ag / Conta</span>
              <span className="text-gray-700 font-medium">
                {[cp.agencia, cp.numero].filter(Boolean).join(" / ")}
                {cp.contaTipo ? ` (${CT_PT[cp.contaTipo] ?? cp.contaTipo})` : ""}
              </span>
            </div>
          )}
        </>)}
      </div>
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
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right max-w-xs">{value}</span>
    </div>
  );
}
