import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/pendencias/abertas — todas as pendências abertas com nome do cliente
export async function GET() {
  try {
    await requireAdmin();

    const pendencias = await prisma.pendencia.findMany({
      where: { status: "aberta" },
      orderBy: { criadoEm: "asc" },
      include: {
        financiamento: {
          include: {
            user: { select: { id: true, nome: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: pendencias });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
