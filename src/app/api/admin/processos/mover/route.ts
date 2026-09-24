import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendEtapaNotification } from "@/lib/email";

// POST /api/admin/processos/mover — move o processo para outra etapa.
// Avançar: etapas anteriores viram "concluído" e a de destino "em andamento".
// Voltar: a de destino é reaberta e as posteriores voltam para "aguardando".
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { financiamentoId, etapaId } = await request.json();

    if (!financiamentoId || !etapaId) {
      return NextResponse.json({ success: false, error: "financiamentoId e etapaId são obrigatórios" }, { status: 400 });
    }

    const financiamento = await prisma.financiamento.findUnique({
      where: { id: financiamentoId },
      include: {
        etapas: { orderBy: { ordem: "asc" } },
        user: { select: { nome: true, email: true } },
      },
    });

    if (!financiamento) {
      return NextResponse.json({ success: false, error: "Processo não encontrado" }, { status: 404 });
    }
    if (!["em_andamento", "pausado"].includes(financiamento.statusGeral)) {
      return NextResponse.json({ success: false, error: "Só é possível mover processos ativos" }, { status: 400 });
    }

    const etapas = financiamento.etapas;
    const destinoIdx = etapas.findIndex((e) => e.id === etapaId);
    if (destinoIdx === -1) {
      return NextResponse.json({ success: false, error: "Etapa não pertence a este processo" }, { status: 400 });
    }

    const atualIdx = (() => {
      const emAndamento = etapas.findIndex((e) => e.status === "em_andamento");
      if (emAndamento !== -1) return emAndamento;
      const aguardando = etapas.findIndex((e) => e.status === "aguardando");
      return aguardando === -1 ? etapas.length - 1 : aguardando;
    })();

    if (destinoIdx === atualIdx && etapas[destinoIdx].status === "em_andamento") {
      return NextResponse.json({ success: true, data: { semAlteracao: true } });
    }

    const agora = new Date();
    const destino = etapas[destinoIdx];
    const origem = etapas[atualIdx];
    const avancou = destinoIdx >= atualIdx;

    await prisma.$transaction([
      ...etapas.slice(0, destinoIdx)
        .filter((e) => e.status !== "concluido")
        .map((e) =>
          prisma.etapa.update({
            where: { id: e.id },
            data: {
              status: "concluido",
              dataInicio: e.dataInicio ?? agora,
              dataConclusao: e.dataConclusao ?? agora,
            },
          })
        ),
      prisma.etapa.update({
        where: { id: destino.id },
        data: {
          status: "em_andamento",
          dataInicio: destino.status === "em_andamento" && destino.dataInicio ? destino.dataInicio : agora,
          dataConclusao: null,
        },
      }),
      ...etapas.slice(destinoIdx + 1)
        .filter((e) => e.status !== "aguardando")
        .map((e) =>
          prisma.etapa.update({
            where: { id: e.id },
            data: { status: "aguardando", dataInicio: null, dataConclusao: null },
          })
        ),
      prisma.historico.create({
        data: {
          financiamentoId,
          campo: "Quadro de Processos",
          valorAnterior: origem?.nome ?? null,
          valorNovo: destino.nome,
          descricao: avancou
            ? `Processo avançado de "${origem?.nome}" para "${destino.nome}"`
            : `Processo retornado de "${origem?.nome}" para "${destino.nome}"`,
          criadoPor: session.nome,
        },
      }),
      prisma.financiamento.update({
        where: { id: financiamentoId },
        data: { updatedAt: agora },
      }),
    ]);

    // Avisa o cliente quando o processo avança (falhas de e-mail são tratadas dentro do helper)
    if (avancou && destinoIdx !== atualIdx) {
      await sendEtapaNotification({
        clienteEmail: financiamento.user.email,
        clienteNome: financiamento.user.nome,
        etapaNome: destino.nome,
        status: "em_andamento",
      });
    }

    return NextResponse.json({ success: true, data: { de: origem?.nome, para: destino.nome } });
  } catch (error) {
    console.error("Mover processo error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
