"use client";

import { useEffect, useState } from "react";

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  status: string;
  dataInicio?: string | null;
  dataConclusao?: string | null;
}

interface Pendencia {
  id: string;
  status: string;
}

interface Financiamento {
  id: string;
  statusGeral: string;
  motivoCancelamento?: string | null;
  createdAt: string;
  etapas: Etapa[];
  pendencias: Pendencia[];
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  banco?: string | null;
  createdAt: string;
  financiamento: Financiamento | null;
}

const STATUS_LABEL: Record<string, string> = {
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  pausado: "Pausado",
  cancelado: "Cancelado",
};

const STATUS_COR: Record<string, string> = {
  em_andamento: "#22c55e",
  concluido: "#3b82f6",
  pausado: "#f59e0b",
  cancelado: "#ef4444",
};

const ETAPA_STATUS_COR: Record<string, string> = {
  aguardando: "#94a3b8",
  em_andamento: "#f59e0b",
  concluido: "#22c55e",
};

const ETAPA_STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
};

function calcProgresso(etapas: Etapa[]) {
  if (!etapas.length) return 0;
  return Math.round((etapas.filter((e) => e.status === "concluido").length / etapas.length) * 100);
}

function etapaAtual(etapas: Etapa[]) {
  return etapas.find((e) => e.status === "em_andamento")?.nome
    || (etapas.every((e) => e.status === "concluido") ? "Concluído" : "Não iniciado");
}

function fmt(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

const ORDEM_STATUS = ["em_andamento", "pausado", "concluido", "cancelado"];

export default function RelatorioGeralPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/relatorio-geral")
      .then((r) => r.json())
      .then((d) => setClientes(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && clientes.length > 0) {
      setTimeout(() => window.print(), 700);
    }
  }, [loading, clientes]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
        Gerando relatório...
      </div>
    );
  }

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  // Estatísticas
  const stats = {
    total: clientes.length,
    em_andamento: clientes.filter((c) => c.financiamento?.statusGeral === "em_andamento").length,
    concluido: clientes.filter((c) => c.financiamento?.statusGeral === "concluido").length,
    pausado: clientes.filter((c) => c.financiamento?.statusGeral === "pausado").length,
    cancelado: clientes.filter((c) => c.financiamento?.statusGeral === "cancelado").length,
    pendencias: clientes.reduce((acc, c) => acc + (c.financiamento?.pendencias?.length || 0), 0),
  };

  // Agrupa por status
  const grupos = ORDEM_STATUS
    .map((status) => ({
      status,
      clientes: clientes.filter((c) => c.financiamento?.statusGeral === status),
    }))
    .filter((g) => g.clientes.length > 0);

  // Clientes sem financiamento
  const semFinanciamento = clientes.filter((c) => !c.financiamento);

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

        .header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px 16px; border-bottom: 3px solid #18181b; }
        .header img { height: 52px; width: auto; object-fit: contain; }
        .header-right { text-align: right; }
        .header-right h1 { font-size: 17px; font-weight: 700; color: #18181b; }
        .header-right p { font-size: 10px; color: #6b7280; margin-top: 2px; }

        .title-bar { background: #18181b; color: white; padding: 9px 28px; display: flex; justify-content: space-between; align-items: center; }
        .title-bar span { font-size: 12px; font-weight: 600; }
        .title-bar small { font-size: 10px; opacity: 0.6; }

        /* Resumo executivo */
        .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; padding: 16px 28px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .stat { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; text-align: center; }
        .stat .num { font-size: 20px; font-weight: 800; color: #18181b; }
        .stat .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-top: 2px; }

        /* Grupos */
        .grupo { padding: 16px 28px 0; }
        .grupo-titulo { display: flex; align-items: center; gap-8px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid; }

        /* Tabela */
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 24px; }
        thead tr { background: #18181b; color: white; }
        thead th { padding: 7px 10px; text-align: left; font-weight: 600; font-size: 9.5px; letter-spacing: 0.03em; }
        tbody tr { border-bottom: 1px solid #f3f4f6; }
        tbody tr:nth-child(even) { background: #fafafa; }
        tbody tr:hover { background: #f0fdf4; }
        tbody td { padding: 7px 10px; color: #374151; vertical-align: top; }

        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 700; color: white; }
        .progress-wrap { width: 60px; }
        .progress-bg { background: #e5e7eb; border-radius: 99px; height: 5px; }
        .progress-fill { background: #22c55e; border-radius: 99px; height: 5px; }
        .progress-txt { font-size: 9px; color: #6b7280; margin-top: 2px; }

        .etapas-mini { display: flex; gap: 3px; flex-wrap: wrap; }
        .etapa-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* Rodapé */
        .footer { padding: 12px 28px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }

        /* Botão flutuante */
        .btn-print { position: fixed; bottom: 20px; right: 20px; background: #18181b; color: white; border: none; padding: 11px 20px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.25); z-index: 999; }
        .btn-print:hover { background: #27272a; }
      `}</style>

      <button className="btn-print no-print" onClick={() => window.print()}>
        ⬇ Baixar / Imprimir PDF
      </button>

      {/* Cabeçalho */}
      <div className="header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Emobe" />
        <div className="header-right">
          <h1>Relatório Geral de Financiamentos</h1>
          <p>Emobe Empreendimentos · contato@emobe.com.br · (37) 99925-1577</p>
          <p>financiamento.emobe.com.br</p>
        </div>
      </div>

      {/* Faixa título */}
      <div className="title-bar">
        <span>Visão Completa da Carteira de Clientes</span>
        <small>Gerado em {hoje}</small>
      </div>

      {/* Resumo executivo */}
      <div className="stats">
        {[
          { num: stats.total,        lbl: "Total de Clientes" },
          { num: stats.em_andamento, lbl: "Em Andamento",      cor: "#22c55e" },
          { num: stats.concluido,    lbl: "Concluídos",        cor: "#3b82f6" },
          { num: stats.pausado,      lbl: "Pausados",          cor: "#f59e0b" },
          { num: stats.cancelado,    lbl: "Cancelados",        cor: "#ef4444" },
          { num: stats.pendencias,   lbl: "Pendências Abertas", cor: stats.pendencias > 0 ? "#ef4444" : "#22c55e" },
        ].map((s) => (
          <div className="stat" key={s.lbl}>
            <div className="num" style={{ color: s.cor || "#18181b" }}>{s.num}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Grupos por status */}
      {grupos.map((grupo) => {
        const cor = STATUS_COR[grupo.status];
        const label = STATUS_LABEL[grupo.status];
        return (
          <div className="grupo" key={grupo.status}>
            <div className="grupo-titulo" style={{ borderColor: cor, gap: "8px", display: "flex", alignItems: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: cor, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 12, color: cor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label} — {grupo.clientes.length} cliente{grupo.clientes.length > 1 ? "s" : ""}
              </span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Banco</th>
                  <th>Progresso</th>
                  <th>Etapas</th>
                  <th>Etapa Atual</th>
                  <th>Pendências</th>
                  <th>Cadastrado</th>
                </tr>
              </thead>
              <tbody>
                {grupo.clientes.map((c, i) => {
                  const etapas = c.financiamento?.etapas || [];
                  const prog = calcProgresso(etapas);
                  const atual = etapaAtual(etapas);
                  const pendAbertas = c.financiamento?.pendencias?.length || 0;
                  return (
                    <tr key={c.id}>
                      <td style={{ color: "#9ca3af", width: 24 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#111" }}>{c.nome}</div>
                        <div style={{ color: "#6b7280", fontSize: 9.5 }}>{c.cpf || "—"}</div>
                      </td>
                      <td>
                        <div>{c.email}</div>
                        <div style={{ color: "#6b7280" }}>{c.telefone || "—"}</div>
                      </td>
                      <td style={{ color: "#374151" }}>{c.banco || "—"}</td>
                      <td>
                        <div className="progress-wrap">
                          <div className="progress-bg">
                            <div className="progress-fill" style={{ width: `${prog}%`, background: cor }} />
                          </div>
                          <div className="progress-txt">{prog}%</div>
                        </div>
                      </td>
                      <td>
                        <div className="etapas-mini">
                          {etapas.map((e) => (
                            <div
                              key={e.id}
                              className="etapa-dot"
                              style={{ background: ETAPA_STATUS_COR[e.status] || "#94a3b8" }}
                              title={`${e.nome}: ${ETAPA_STATUS_LABEL[e.status]}`}
                            />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 10 }}>{atual}</span>
                      </td>
                      <td>
                        {pendAbertas > 0 ? (
                          <span className="badge" style={{ background: "#ef4444" }}>{pendAbertas}</span>
                        ) : (
                          <span style={{ color: "#22c55e", fontSize: 10 }}>✓</span>
                        )}
                      </td>
                      <td style={{ color: "#6b7280" }}>{fmt(c.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Sem financiamento */}
      {semFinanciamento.length > 0 && (
        <div className="grupo">
          <div className="grupo-titulo" style={{ borderColor: "#94a3b8", gap: "8px", display: "flex", alignItems: "center" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} />
            <span style={{ fontWeight: 700, fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sem Processo — {semFinanciamento.length} cliente{semFinanciamento.length > 1 ? "s" : ""}
            </span>
          </div>
          <table>
            <thead>
              <tr><th>#</th><th>Cliente</th><th>Email</th><th>Telefone</th><th>Cadastrado</th></tr>
            </thead>
            <tbody>
              {semFinanciamento.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.nome}</td>
                  <td>{c.email}</td>
                  <td>{c.telefone || "—"}</td>
                  <td style={{ color: "#6b7280" }}>{fmt(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé */}
      <div className="footer">
        <span>Emobe Empreendimentos · contato@emobe.com.br · (37) 99925-1577</span>
        <span>Documento gerado em {hoje} · {stats.total} clientes no total</span>
      </div>
    </>
  );
}
