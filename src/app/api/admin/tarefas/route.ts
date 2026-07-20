import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PRIORIDADE_NIVEL, Prioridade, validarTarefa } from "@/lib/tarefas";

const LIMITE_PADRAO = 12;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ordenacaoPrisma(ordenar: string | null): any {
  switch (ordenar) {
    case "antiga":
      return { createdAt: "asc" };
    case "prioridade":
      return [{ prioridadeNivel: "desc" }, { createdAt: "desc" }];
    case "prazo":
      // Sem prazo vai para o fim
      return [{ dataLimite: { sort: "asc", nulls: "last" } }, { hora: "asc" }];
    default:
      return { createdAt: "desc" };
  }
}

// GET /api/admin/tarefas?status=&busca=&ordenar=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status");
    const busca = sp.get("busca")?.trim();
    const ordenar = sp.get("ordenar");
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") || String(LIMITE_PADRAO), 10) || LIMITE_PADRAO));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (status && status !== "todas") where.status = status;
    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: "insensitive" } },
        { descricao: { contains: busca, mode: "insensitive" } },
      ];
    }

    const [total, tarefas] = await Promise.all([
      prisma.tarefa.count({ where }),
      prisma.tarefa.findMany({
        where,
        orderBy: ordenacaoPrisma(ordenar),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: tarefas,
      paginacao: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}

// POST /api/admin/tarefas — cria uma tarefa
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const erro = validarTarefa(body);
    if (erro) return NextResponse.json({ success: false, error: erro }, { status: 400 });

    const prioridade = (body.prioridade || "media") as Prioridade;

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: String(body.titulo).trim(),
        descricao: body.descricao?.trim() || null,
        prioridade,
        prioridadeNivel: PRIORIDADE_NIVEL[prioridade],
        status: body.status || "pendente",
        dataLimite: body.dataLimite || null,
        hora: body.hora || null,
      },
    });

    return NextResponse.json({ success: true, data: tarefa }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
