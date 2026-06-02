import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/cancelados — financiamentos concluídos e cancelados
export async function GET() {
  try {
    await requireAdmin();

    const encerrados = await prisma.financiamento.findMany({
      where: { statusGeral: { in: ["cancelado", "concluido"] } },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: encerrados });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
