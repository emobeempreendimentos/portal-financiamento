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

    // Calculate average days for completed financiamentos
    const concluídosComData = financiamentos.filter(
      (f) => f.statusGeral === "concluido"
    );
    const tempoMedioDias =
      concluídosComData.length > 0
        ? Math.round(
            concluídosComData.reduce((acc, f) => {
              const etapasFinal = f.etapas.filter((e) => e.dataConclusao);
              if (etapasFinal.length === 0) return acc;
              const ultimaData = etapasFinal.reduce((max, e) =>
                new Date(e.dataConclusao!) > new Date(max.dataConclusao!) ? e : max
              );
              const dias = Math.floor(
                (new Date(ultimaData.dataConclusao!).getTime() - new Date(f.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return acc + dias;
            }, 0) / concluídosComData.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: { totalClientes, emAprovacao, concluidos, tempoMedioDias, pendenciasAbertas },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}
