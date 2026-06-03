import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [totalClientes, financiamentos] = await Promise.all([
      prisma.user.count({ where: { role: "cliente" } }),
      prisma.financiamento.findMany({
        include: { etapas: true },
      }),
    ]);

    // Pendencia table may not exist yet in DB — handle gracefully
    let pendenciasAbertas = 0;
    try {
      pendenciasAbertas = await prisma.pendencia.count({ where: { status: "aberta" } });
    } catch {
      pendenciasAbertas = 0;
    }

    const emAprovacao = financiamentos.filter((f) =>
      f.etapas.some((e) => e.nome === "Aprovação" && e.status === "em_andamento")
    ).length;

    const concluidos = financiamentos.filter((f) => f.statusGeral === "concluido").length;

    // Tempo médio usando concluidoEm (campo direto, mais confiável)
    const concluídosComData = financiamentos.filter(
      (f) => f.statusGeral === "concluido" && f.concluidoEm
    );
    const tempoMedioDias =
      concluídosComData.length > 0
        ? Math.round(
            concluídosComData.reduce((acc, f) => {
              const dias = Math.floor(
                (new Date(f.concluidoEm!).getTime() - new Date(f.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return acc + Math.max(dias, 0);
            }, 0) / concluídosComData.length
          )
        : -1; // -1 = sem dados suficientes

    return NextResponse.json({
      success: true,
      data: { totalClientes, emAprovacao, concluidos, tempoMedioDias, pendenciasAbertas },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}
