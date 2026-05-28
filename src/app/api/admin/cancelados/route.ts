import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/cancelados — todos os financiamentos cancelados com dados do cliente
export async function GET() {
  try {
    await requireAdmin();

    const cancelados = await prisma.financiamento.findMany({
      where: { statusGeral: "cancelado" },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: cancelados });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
