import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const DIAS_ACESSO_POS_CONCLUSAO = 3;

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

    const fin = user.financiamento;

    // Processo cancelado → acesso bloqueado imediatamente
    if (fin?.statusGeral === "cancelado") {
      return NextResponse.json({
        success: false,
        bloqueio: "cancelado",
        motivo: fin.motivoCancelamento || null,
      }, { status: 403 });
    }

    // Processo concluído → acesso liberado por N dias após conclusão
    if (fin?.statusGeral === "concluido" && fin.concluidoEm) {
      const diasPassados = (Date.now() - new Date(fin.concluidoEm).getTime()) / (1000 * 60 * 60 * 24);
      if (diasPassados > DIAS_ACESSO_POS_CONCLUSAO) {
        return NextResponse.json({
          success: false,
          bloqueio: "expirado",
          concluidoEm: fin.concluidoEm,
        }, { status: 403 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _senha, ...userSemSenha } = user;
    return NextResponse.json({ success: true, data: userSemSenha });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
