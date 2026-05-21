import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const { descricao } = await request.json();

    if (!descricao?.trim()) {
      return NextResponse.json({ success: false, error: "Descrição obrigatória" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { financiamento: { select: { id: true } } },
    });

    if (!user?.financiamento) {
      return NextResponse.json({ success: false, error: "Financiamento não encontrado" }, { status: 404 });
    }

    const interacao = await prisma.historico.create({
      data: {
        financiamentoId: user.financiamento.id,
        campo: "nota",
        descricao: descricao.trim(),
        criadoPor: session.nome,
      },
    });

    return NextResponse.json({ success: true, data: interacao });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
