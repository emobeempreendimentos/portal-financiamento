import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/relatorio-geral — todos os clientes incluindo cancelados
export async function GET() {
  try {
    await requireAdmin();

    const clientes = await prisma.user.findMany({
      where: { role: "cliente" },
      include: {
        financiamento: {
          include: {
            etapas: { orderBy: { ordem: "asc" } },
            pendencias: { where: { status: "aberta" } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: clientes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
