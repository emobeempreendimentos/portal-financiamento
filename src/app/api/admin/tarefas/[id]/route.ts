import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PRIORIDADE_NIVEL, Prioridade, STATUS, StatusTarefa, validarTarefa } from "@/lib/tarefas";

// PUT /api/admin/tarefas/[id] — atualiza a tarefa inteira
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const erro = validarTarefa(body);
    if (erro) return NextResponse.json({ success: false, error: erro }, { status: 400 });

    const prioridade = (body.prioridade || "media") as Prioridade;
    const status = (body.status || "pendente") as StatusTarefa;

    const tarefa = await prisma.tarefa.update({
      where: { id },
      data: {
        titulo: String(body.titulo).trim(),
        descricao: body.descricao?.trim() || null,
        prioridade,
        prioridadeNivel: PRIORIDADE_NIVEL[prioridade],
        status,
        dataLimite: body.dataLimite || null,
        hora: body.hora || null,
        concluidaEm: status === "concluida" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: tarefa });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/tarefas/[id] — altera apenas o status (marcar concluída, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const status = body.status as StatusTarefa;

    if (!STATUS.includes(status)) {
      return NextResponse.json({ success: false, error: "Status inválido" }, { status: 400 });
    }

    const tarefa = await prisma.tarefa.update({
      where: { id },
      data: { status, concluidaEm: status === "concluida" ? new Date() : null },
    });

    return NextResponse.json({ success: true, data: tarefa });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/tarefas/[id]
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.tarefa.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
