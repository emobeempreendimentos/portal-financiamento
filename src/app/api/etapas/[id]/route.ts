import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendEtapaNotification } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, observacoes, observacoesInternas, dataInicio, dataConclusao } = body;

    const etapaAtual = await prisma.etapa.findUnique({
      where: { id },
      include: {
        financiamento: {
          include: { user: { select: { nome: true, email: true } } },
        },
      },
    });

    if (!etapaAtual) {
      return NextResponse.json({ success: false, error: "Etapa não encontrada" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (observacoes !== undefined) data.observacoes = observacoes;
    if (observacoesInternas !== undefined) data.observacoesInternas = observacoesInternas;
    if (dataInicio !== undefined) data.dataInicio = dataInicio ? new Date(dataInicio) : null;
    if (dataConclusao !== undefined) data.dataConclusao = dataConclusao ? new Date(dataConclusao) : null;

    // Auto-set dates based on status transitions
    if (status === "em_andamento" && !etapaAtual.dataInicio && !dataInicio) {
      data.dataInicio = new Date();
    }
    if (status === "concluido" && !etapaAtual.dataConclusao && !dataConclusao) {
      data.dataConclusao = new Date();
    }

    const etapaAtualizada = await prisma.etapa.update({ where: { id }, data });

    // Log history
    if (status && status !== etapaAtual.status) {
      await prisma.historico.create({
        data: {
          financiamentoId: etapaAtual.financiamentoId,
          campo: `Etapa: ${etapaAtual.nome}`,
          valorAnterior: etapaAtual.status,
          valorNovo: status,
          descricao: `Status da etapa "${etapaAtual.nome}" alterado de "${etapaAtual.status}" para "${status}"`,
          criadoPor: session.nome,
        },
      });

      // Atualiza updatedAt do financiamento para reordenar lista
      await prisma.financiamento.update({
        where: { id: etapaAtual.financiamentoId },
        data: { updatedAt: new Date() },
      });

      // Enviar email de notificação ao cliente quando etapa avança
      if (status === "em_andamento" || status === "concluido") {
        const { nome: clienteNome, email: clienteEmail } = etapaAtual.financiamento.user;
        sendEtapaNotification({
          clienteEmail,
          clienteNome,
          etapaNome: etapaAtual.nome,
          status,
        }); // fire-and-forget — não bloqueia a resposta
      }

      // Check if all etapas concluded → update financiamento
      const etapas = await prisma.etapa.findMany({
        where: { financiamentoId: etapaAtual.financiamentoId },
      });
      const todasConcluidas = etapas.every((e) => e.status === "concluido" || e.id === id && status === "concluido");
      if (todasConcluidas) {
        await prisma.financiamento.update({
          where: { id: etapaAtual.financiamentoId },
          data: { statusGeral: "concluido" },
        });
      }
    }

    return NextResponse.json({ success: true, data: etapaAtualizada });
  } catch (error) {
    console.error("Update etapa error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
