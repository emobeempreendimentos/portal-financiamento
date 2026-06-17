import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { nota, recomendaria, comentario } = await request.json();

    if (typeof nota !== "number" || nota < 1 || nota > 5) {
      return NextResponse.json({ success: false, error: "Nota inválida" }, { status: 400 });
    }
    if (typeof recomendaria !== "boolean") {
      return NextResponse.json({ success: false, error: "Campo recomendaria obrigatório" }, { status: 400 });
    }

    const financiamento = await prisma.financiamento.findUnique({
      where: { userId: session.userId },
      select: { id: true, statusGeral: true, avaliacao: true },
    });

    if (!financiamento) {
      return NextResponse.json({ success: false, error: "Financiamento não encontrado" }, { status: 404 });
    }
    if (financiamento.statusGeral !== "concluido") {
      return NextResponse.json({ success: false, error: "Processo ainda não concluído" }, { status: 400 });
    }
    if (financiamento.avaliacao) {
      return NextResponse.json({ success: false, error: "Avaliação já enviada" }, { status: 409 });
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        financiamentoId: financiamento.id,
        nota,
        recomendaria,
        comentario: comentario?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: avaliacao }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
