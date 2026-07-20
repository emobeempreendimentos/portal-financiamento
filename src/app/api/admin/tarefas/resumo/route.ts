import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { estaVencida } from "@/lib/tarefas";

// GET /api/admin/tarefas/resumo — contadores + próxima tarefa (sidebar, dashboard e notificações)
export async function GET() {
  try {
    await requireAdmin();

    const [pendentes, emAndamento, abertas] = await Promise.all([
      prisma.tarefa.count({ where: { status: "pendente" } }),
      prisma.tarefa.count({ where: { status: "em_andamento" } }),
      prisma.tarefa.findMany({
        where: { status: { not: "concluida" } },
        orderBy: [{ prioridadeNivel: "desc" }, { dataLimite: { sort: "asc", nulls: "last" } }, { hora: "asc" }],
        take: 200,
      }),
    ]);

    const vencidas = abertas.filter((t) => estaVencida(t)).length;

    // Próxima: prioriza a mais urgente com prazo mais próximo
    const proxima = abertas[0] ?? null;

    return NextResponse.json({
      success: true,
      data: {
        pendentes,
        emAndamento,
        abertas: abertas.length,
        vencidas,
        proxima,
        // Tarefas com data/hora marcadas, usadas pelo verificador de notificações
        agendadas: abertas
          .filter((t) => t.dataLimite && t.hora)
          .map((t) => ({ id: t.id, titulo: t.titulo, dataLimite: t.dataLimite, hora: t.hora })),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}
