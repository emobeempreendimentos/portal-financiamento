import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        financiamento: {
          select: { user: { select: { id: true, nome: true, email: true } } },
        },
      },
    });

    const total = avaliacoes.length;
    const media = total > 0
      ? avaliacoes.reduce((acc, a) => acc + a.nota, 0) / total
      : 0;
    const recomendariam = avaliacoes.filter((a) => a.recomendaria).length;

    return NextResponse.json({
      success: true,
      data: avaliacoes,
      meta: { total, media: Math.round(media * 10) / 10, recomendariam },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
