import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { descricao, valor, tipo, categoria, data, observacao } = body;

    const lancamento = await prisma.lancamentoPessoal.update({
      where: { id },
      data: {
        ...(descricao !== undefined && { descricao: descricao.trim() }),
        ...(valor !== undefined && { valor: parseFloat(valor) }),
        ...(tipo !== undefined && { tipo }),
        ...(categoria !== undefined && { categoria }),
        ...(data !== undefined && { data: new Date(data) }),
        ...(observacao !== undefined && { observacao: observacao?.trim() || null }),
      },
    });

    return NextResponse.json({ success: true, data: lancamento });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.lancamentoPessoal.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Lançamento excluído" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
