"use client";

import { useEffect, useState } from "react";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  categoria: string;
  data: string;
  formaPagamento?: string | null;
  parcelas?: number | null;
  observacao?: string | null;
}

interface Resumo { totalReceitas: number; totalDespesas: number; saldo: number; totalLancamentos: number; }
interface CatItem { categoria: string; count: number; total: number; }
interface PagItem { forma: string; label: string; count: number; total: number; }
interface MesItem { label: string; receitas: number; despesas: number; saldo: number; }
interface Periodo { dataInicio: string; dataFim: string; }

interface RelatorioData {
  lancamentos: Lancamento[];
  resumo: Resumo;
  porCategoria: { receitas: CatItem[]; despesas: CatItem[] };
  porFormaPagamento: PagItem[];
  porMes: MesItem[];
  periodo: Periodo;
}

const PAGAMENTO_EMOJI: Record<string, string> = {
  pix: "⚡", credito: "💳", debito: "🏧", dinheiro: "💵",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}
function pct(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export default function RelatorioFinanceiroPage() {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/financeiro/relatorio")
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => window.print(), 700);
    }
  }, [loading, data]);

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
        Preparando relatório financeiro...
      </div>
    );
  }
  if (!data) return null;

  const { lancamentos, resumo, porCategoria, porFormaPagamento, porMes, periodo } = data;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: white; font-size: 12px; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }

        /* ── Header ── */
        .header { display: flex; align-items: center; justify-content: space-between; padding: 22px 32px 18px; border-bottom: 3px solid #18181b; }
        .header img { height: 52px; width: auto; object-fit: contain; }
        .header-right { text-align: right; }
        .header-right h1 { font-size: 17px; font-weight: 700; color: #18181b; }
        .header-right p { font-size: 11px; color: #6b7280; margin-top: 2px; }

        .title-bar { background: #18181b; color: white; padding: 10px 32px; display: flex; justify-content: space-between; align-items: center; }
        .title-bar .title { font-size: 13px; font-weight: 600; }
        .title-bar .date  { font-size: 11px; opacity: 0.65; }

        /* ── Content ── */
        .content { padding: 24px 32px; }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 12px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }

        /* ── Summary cards ── */
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .summary-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
        .summary-card .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .summary-card .value { font-size: 16px; font-weight: 700; }
        .card-green  { border-color: #bbf7d0; } .card-green  .value { color: #16a34a; }
        .card-red    { border-color: #fecaca; } .card-red    .value { color: #dc2626; }
        .card-blue   { border-color: #bfdbfe; } .card-blue   .value { color: #2563eb; }
        .card-orange { border-color: #fed7aa; } .card-orange .value { color: #ea580c; }
        .card-purple { border-color: #e9d5ff; } .card-purple .value { color: #7c3aed; }

        /* ── Periodo ── */
        .periodo { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
        .periodo span { font-weight: 600; color: #374151; }

        /* ── Tables ── */
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead tr { background: #18181b; color: white; }
        thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.03em; }
        thead th.right { text-align: right; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        tbody tr:hover { background: #f3f4f6; }
        tbody td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
        tbody td.right { text-align: right; }
        tfoot td { padding: 8px 10px; font-weight: 700; border-top: 2px solid #d1d5db; background: #f9fafb; }
        tfoot td.right { text-align: right; }

        /* ── Badges ── */
        .badge { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 9px; font-weight: 700; }
        .badge-green  { background: #dcfce7; color: #15803d; }
        .badge-red    { background: #fee2e2; color: #b91c1c; }
        .badge-purple { background: #ede9fe; color: #6d28d9; }

        /* ── Bar visual ── */
        .bar-wrap { display: flex; align-items: center; gap: 6px; }
        .bar-bg { flex: 1; background: #e5e7eb; border-radius: 99px; height: 6px; min-width: 60px; }
        .bar-fill { height: 6px; border-radius: 99px; }

        /* ── Footer ── */
        .footer { margin-top: 32px; padding: 14px 32px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }

        /* ── Print button ── */
        .btn-print { position: fixed; bottom: 24px; right: 24px; background: #18181b; color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 999; display: flex; align-items: center; gap: 8px; }
        .btn-print:hover { background: #27272a; }
      `}</style>

      {/* Botão de impressão */}
      <button className="btn-print no-print" onClick={() => window.print()}>
        ⬇ Baixar / Imprimir PDF
      </button>

      {/* ── Cabeçalho ── */}
      <div className="header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Emobe" />
        <div className="header-right">
          <h1>Relatório Financeiro — Empresa</h1>
          <p>Emobe Empreendimentos · contato@emobe.com.br</p>
          <p>financiamento.emobe.com.br</p>
        </div>
      </div>

      <div className="title-bar">
        <span className="title">Controle Financeiro Empresarial</span>
        <span className="date">Gerado em {hoje}</span>
      </div>

      <div className="content">

        {/* Período */}
        {lancamentos.length > 0 && (
          <p className="periodo">
            Período: <span>{periodo.dataInicio}</span> até <span>{periodo.dataFim}</span>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            Total de <span>{resumo.totalLancamentos}</span> lançamentos registrados
          </p>
        )}

        {/* ── Resumo ── */}
        <div className="summary-grid">
          <div className={`summary-card card-green`}>
            <div className="label">Receita Total</div>
            <div className="value">{fmt(resumo.totalReceitas)}</div>
          </div>
          <div className={`summary-card card-red`}>
            <div className="label">Despesa Total</div>
            <div className="value">{fmt(resumo.totalDespesas)}</div>
          </div>
          <div className={`summary-card ${resumo.saldo >= 0 ? "card-blue" : "card-orange"}`}>
            <div className="label">Saldo</div>
            <div className="value">{fmt(resumo.saldo)}</div>
          </div>
          <div className="summary-card card-purple">
            <div className="label">Lançamentos</div>
            <div className="value">{resumo.totalLancamentos}</div>
          </div>
        </div>

        {/* ── Receitas por categoria ── */}
        {porCategoria.receitas.length > 0 && (
          <div className="section">
            <p className="section-title">Receitas por Categoria</p>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th className="right">Qtd</th>
                  <th className="right">Total</th>
                  <th className="right">% do Total</th>
                  <th style={{ width: "140px" }}>Participação</th>
                </tr>
              </thead>
              <tbody>
                {porCategoria.receitas.map((c) => (
                  <tr key={c.categoria}>
                    <td style={{ fontWeight: 500 }}>{c.categoria}</td>
                    <td className="right">{c.count}</td>
                    <td className="right" style={{ color: "#16a34a", fontWeight: 600 }}>{fmt(c.total)}</td>
                    <td className="right">{pct(c.total, resumo.totalReceitas)}</td>
                    <td>
                      <div className="bar-wrap">
                        <div className="bar-bg">
                          <div className="bar-fill" style={{ width: pct(c.total, resumo.totalReceitas), background: "#22c55e" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="right">{porCategoria.receitas.reduce((a, c) => a + c.count, 0)}</td>
                  <td className="right" style={{ color: "#16a34a" }}>{fmt(resumo.totalReceitas)}</td>
                  <td className="right">100%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Despesas por categoria ── */}
        {porCategoria.despesas.length > 0 && (
          <div className="section">
            <p className="section-title">Despesas por Categoria</p>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th className="right">Qtd</th>
                  <th className="right">Total</th>
                  <th className="right">% do Total</th>
                  <th style={{ width: "140px" }}>Participação</th>
                </tr>
              </thead>
              <tbody>
                {porCategoria.despesas.map((c) => (
                  <tr key={c.categoria}>
                    <td style={{ fontWeight: 500 }}>{c.categoria}</td>
                    <td className="right">{c.count}</td>
                    <td className="right" style={{ color: "#dc2626", fontWeight: 600 }}>{fmt(c.total)}</td>
                    <td className="right">{pct(c.total, resumo.totalDespesas)}</td>
                    <td>
                      <div className="bar-wrap">
                        <div className="bar-bg">
                          <div className="bar-fill" style={{ width: pct(c.total, resumo.totalDespesas), background: "#ef4444" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="right">{porCategoria.despesas.reduce((a, c) => a + c.count, 0)}</td>
                  <td className="right" style={{ color: "#dc2626" }}>{fmt(resumo.totalDespesas)}</td>
                  <td className="right">100%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Formas de pagamento ── */}
        {porFormaPagamento.length > 0 && (
          <div className="section">
            <p className="section-title">Formas de Pagamento</p>
            <table>
              <thead>
                <tr>
                  <th>Forma</th>
                  <th className="right">Qtd</th>
                  <th className="right">Total Movimentado</th>
                  <th className="right">% do Total</th>
                  <th style={{ width: "140px" }}>Participação</th>
                </tr>
              </thead>
              <tbody>
                {porFormaPagamento.map((p) => {
                  const totalGeral = porFormaPagamento.reduce((a, x) => a + x.total, 0);
                  return (
                    <tr key={p.forma}>
                      <td style={{ fontWeight: 500 }}>
                        {PAGAMENTO_EMOJI[p.forma] || ""} {p.label}
                      </td>
                      <td className="right">{p.count}</td>
                      <td className="right" style={{ fontWeight: 600 }}>{fmt(p.total)}</td>
                      <td className="right">{pct(p.total, totalGeral)}</td>
                      <td>
                        <div className="bar-wrap">
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: pct(p.total, totalGeral), background: "#6366f1" }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Evolução mensal ── */}
        {porMes.length > 0 && (
          <div className="section">
            <p className="section-title">Evolução Mensal</p>
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th className="right">Receitas</th>
                  <th className="right">Despesas</th>
                  <th className="right">Saldo do Mês</th>
                </tr>
              </thead>
              <tbody>
                {porMes.map((m) => (
                  <tr key={m.label}>
                    <td style={{ fontWeight: 500, textTransform: "capitalize" }}>{m.label}</td>
                    <td className="right" style={{ color: "#16a34a", fontWeight: 500 }}>{m.receitas > 0 ? fmt(m.receitas) : "—"}</td>
                    <td className="right" style={{ color: "#dc2626", fontWeight: 500 }}>{m.despesas > 0 ? fmt(m.despesas) : "—"}</td>
                    <td className="right">
                      <span style={{ fontWeight: 700, color: m.saldo >= 0 ? "#2563eb" : "#ea580c" }}>{fmt(m.saldo)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total Geral</td>
                  <td className="right" style={{ color: "#16a34a" }}>{fmt(resumo.totalReceitas)}</td>
                  <td className="right" style={{ color: "#dc2626" }}>{fmt(resumo.totalDespesas)}</td>
                  <td className="right" style={{ color: resumo.saldo >= 0 ? "#2563eb" : "#ea580c" }}>{fmt(resumo.saldo)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Todos os lançamentos ── */}
        {lancamentos.length > 0 && (
          <div className="section page-break">
            <p className="section-title">Todos os Lançamentos ({lancamentos.length})</p>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Pagamento</th>
                  <th className="right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: "nowrap", color: "#6b7280" }}>{fmtData(l.data)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{l.descricao}</div>
                      {l.observacao && <div style={{ fontSize: "10px", color: "#9ca3af" }}>{l.observacao}</div>}
                    </td>
                    <td>{l.categoria}</td>
                    <td>
                      <span className={`badge ${l.tipo === "receita" ? "badge-green" : "badge-red"}`}>
                        {l.tipo === "receita" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td>
                      {l.formaPagamento ? (
                        <span>
                          {PAGAMENTO_EMOJI[l.formaPagamento] || ""}{" "}
                          {l.formaPagamento === "pix" ? "PIX" : l.formaPagamento === "credito" ? `Crédito${l.parcelas && l.parcelas > 1 ? ` ${l.parcelas}x` : " 1x"}` : l.formaPagamento === "debito" ? "Débito" : "Dinheiro"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="right" style={{ fontWeight: 700, color: l.tipo === "receita" ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>
                      {l.tipo === "despesa" ? "- " : ""}{fmt(l.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>Saldo Final</td>
                  <td className="right" style={{ color: resumo.saldo >= 0 ? "#2563eb" : "#ea580c" }}>{fmt(resumo.saldo)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {lancamentos.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
            <p style={{ fontSize: 14 }}>Nenhum lançamento registrado.</p>
          </div>
        )}
      </div>

      {/* ── Rodapé ── */}
      <div className="footer">
        <span>Emobe Empreendimentos · contato@emobe.com.br · (37) 99925-1577</span>
        <span>Documento gerado automaticamente em {hoje}</span>
      </div>
    </>
  );
}
