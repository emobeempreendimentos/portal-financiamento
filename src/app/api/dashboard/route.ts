import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        financiamento: {
          include: {
            etapas: { orderBy: { ordem: "asc" } },
            historico: { orderBy: { createdAt: "desc" }, take: 10 },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _senha, ...userSemSenha } = user;
    return NextResponse.json({ success: true, data: userSemSenha });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
