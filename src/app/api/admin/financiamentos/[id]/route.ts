import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/financiamentos/[id] — cancelar ou reativar processo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action, motivo } = await request.json();

    const statusMap: Record<string, Record<string, unknown>> = {
      cancelar:    { statusGeral: "cancelado",    motivoCancelamento: motivo || null },
      reativar:    { statusGeral: "em_andamento", motivoCancelamento: null, concluidoEm: null },
      pausar:      { statusGeral: "pausado" },
      concluir:    { statusGeral: "concluido",    concluidoEm: new Date() },
      em_andamento:{ statusGeral: "em_andamento", concluidoEm: null },
    };
    const data = statusMap[action] ?? {};

    const updated = await prisma.financiamento.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
