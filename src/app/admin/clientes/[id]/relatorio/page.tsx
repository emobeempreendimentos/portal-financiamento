"use client";

import { useEffect, useState, use } from "react";
import { User, Financiamento, Etapa, Historico } from "@/types";

interface ClienteDetalhado extends User {
  financiamento: (Financiamento & { etapas: Etapa[]; historico: Historico[] }) | null;
}

const STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
};

const STATUS_COLOR: Record<string, string> = {
  aguardando: "#94a3b8",
  em_andamento: "#f59e0b",
  concluido: "#22c55e",
};

function calcProgresso(etapas: Etapa[]) {
  if (!etapas.length) return 0;
  const concluidas = etapas.filter((e) => e.status === "concluido").length;
  return Math.round((concluidas / etapas.length) * 100);
}

export default function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cliente, setCliente] = useState<ClienteDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then((d) => setCliente(d.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && cliente) {
      setTimeout(() => window.print(), 600);
    }
  }, [loading, cliente]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
        Preparando relatório...
      </div>
    );
  }

  if (!cliente) return null;

  const etapas = cliente.financiamento?.etapas || [];
  const progresso = calcProgresso(etapas);
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: white; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }

        .header { display: flex; align-items: center; justify-content: space-between; padding: 24px 32px 20px; border-bottom: 3px solid #18181b; }
        .header-logo { height: 56px; width: auto; object-fit: contain; }
        .header-right { text-align: right; }
        .header-right h1 { font-size: 18px; font-weight: 700; color: #18181b; }
        .header-right p { font-size: 11px; color: #6b7280; margin-top: 2px; }

        .title-bar { background: #18181b; color: white; padding: 10px 32px; display: flex; justify-content: space-between; align-items: center; }
        .title-bar span { font-size: 13px; }
        .title-bar .date { font-size: 11px; opacity: 0.7; }

        .content { padding: 28px 32px; }

        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 32px; margin-bottom: 28px; }
        .info-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; display: block; margin-bottom: 2px; }
        .info-item span { font-size: 13px; color: #111; font-weight: 500; }

        .progress-bar-wrap { margin-bottom: 28px; }
        .progress-bar-bg { background: #e5e7eb; border-radius: 99px; height: 10px; }
        .progress-bar-fill { background: #22c55e; border-radius: 99px; height: 10px; }
        .progress-label { font-size: 12px; color: #6b7280; margin-top: 6px; }

        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead tr { background: #18181b; color: white; }
        thead th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        tbody td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }

        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; color: white; }

        .footer { margin-top: 40px; padding: 16px 32px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }

        .btn-print { position: fixed; bottom: 24px; right: 24px; background: #18181b; color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 999; }
        .btn-print:hover { background: #27272a; }
      `}</style>

      {/* Botão de impressão manual */}
      <button className="btn-print no-print" onClick={() => window.print()}>
        ⬇ Baixar / Imprimir PDF
      </button>

      {/* Cabeçalho */}
      <div className="header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Emobe" className="header-logo" />
        <div className="header-right">
          <h1>Relatório de Financiamento</h1>
          <p>Emobe Empreendimentos · contato@emobe.com.br</p>
          <p>financiamento.emobe.com.br</p>
        </div>
      </div>

      {/* Faixa de título */}
      <div className="title-bar">
        <span>Acompanhamento de Processo</span>
        <span className="date">Gerado em {hoje}</span>
      </div>

      <div className="content">
        {/* Dados do cliente */}
        <p className="section-title">Dados do Cliente</p>
        <div className="info-grid">
          {[
            ["Nome Completo", cliente.nome],
            ["Email", cliente.email],
            ["Telefone", cliente.telefone || "—"],
            ["CPF", cliente.cpf || "—"],
            ["Cônjuge", cliente.conjuge || "—"],
            ["Banco Financiador", cliente.banco || "—"],
          ].map(([label, value]) => (
            <div className="info-item" key={label}>
              <label>{label}</label>
              <span>{value}</span>
            </div>
          ))}
        </div>

        {/* Progresso */}
        <p className="section-title">Progresso do Financiamento</p>
        <div className="progress-bar-wrap">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progresso}%` }} />
          </div>
          <p className="progress-label">{progresso}% concluído — {etapas.filter(e => e.status === "concluido").length} de {etapas.length} etapas</p>
        </div>

        {/* Etapas */}
        {etapas.length > 0 && (
          <>
            <p className="section-title">Etapas do Processo</p>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Etapa</th>
                  <th>Status</th>
                  <th>Data de Início</th>
                  <th>Data de Conclusão</th>
                </tr>
              </thead>
              <tbody>
                {etapas.map((etapa, i) => (
                  <tr key={etapa.id}>
                    <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{etapa.nome}</td>
                    <td>
                      <span className="badge" style={{ background: STATUS_COLOR[etapa.status] }}>
                        {STATUS_LABEL[etapa.status] || etapa.status}
                      </span>
                    </td>
                    <td>{etapa.dataInicio ? new Date(etapa.dataInicio).toLocaleDateString("pt-BR") : "—"}</td>
                    <td>{etapa.dataConclusao ? new Date(etapa.dataConclusao).toLocaleDateString("pt-BR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Rodapé */}
      <div className="footer">
        <span>Emobe Empreendimentos · contato@emobe.com.br · (37) 99925-1577</span>
        <span>Documento gerado automaticamente em {hoje}</span>
      </div>
    </>
  );
}
