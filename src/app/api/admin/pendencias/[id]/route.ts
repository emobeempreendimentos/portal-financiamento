import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/pendencias/[id] — concluir ou reabrir
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action } = await request.json();

    const pendencia = await prisma.pendencia.update({
      where: { id },
      data:
        action === "concluir"
          ? { status: "concluida", concluidoEm: new Date() }
          : { status: "aberta", concluidoEm: null },
    });
    await prisma.financiamento.update({
      where: { id: pendencia.financiamentoId },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json({ success: true, data: pendencia });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/pendencias/[id]
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.pendencia.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
