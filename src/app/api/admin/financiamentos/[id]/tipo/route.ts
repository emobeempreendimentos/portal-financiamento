import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TEXTOS_TIPO, TIPOS_VENDA, TipoVenda, etapasDoTipo } from "@/lib/tipoVenda";

// POST /api/admin/financiamentos/[id]/tipo — troca entre venda financiada e à vista.
// Só é permitido enquanto nenhuma etapa foi iniciada, porque as etapas são recriadas.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const { tipo } = await request.json();

    if (!TIPOS_VENDA.includes(tipo)) {
      return NextResponse.json({ success: false, error: "Tipo de venda inválido" }, { status: 400 });
    }

    const fin = await prisma.financiamento.findUnique({
      where: { id },
      include: { etapas: { select: { status: true } } },
    });
    if (!fin) {
      return NextResponse.json({ success: false, error: "Processo não encontrado" }, { status: 404 });
    }
    if (fin.tipo === tipo) {
      return NextResponse.json({ success: true, data: { semAlteracao: true } });
    }
    if (fin.etapas.some((e) => e.status !== "aguardando")) {
      return NextResponse.json(
        { success: false, error: "Não é possível trocar o tipo depois que alguma etapa foi iniciada." },
        { status: 409 }
      );
    }

    const novo = tipo as TipoVenda;
    await prisma.$transaction([
      prisma.etapa.deleteMany({ where: { financiamentoId: id } }),
      prisma.financiamento.update({
        where: { id },
        data: {
          tipo: novo,
          etapas: {
            create: etapasDoTipo(novo).map((e) => ({ nome: e.nome, ordem: e.ordem, status: "aguardando" })),
          },
        },
      }),
      ...(novo === "avista" ? [prisma.user.update({ where: { id: fin.userId }, data: { banco: null } })] : []),
      prisma.historico.create({
        data: {
          financiamentoId: id,
          campo: "Tipo de venda",
          valorAnterior: TEXTOS_TIPO[fin.tipo === "avista" ? "avista" : "financiamento"].rotulo,
          valorNovo: TEXTOS_TIPO[novo].rotulo,
          descricao: `Tipo de venda alterado para "${TEXTOS_TIPO[novo].rotulo}"`,
          criadoPor: session.nome,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: { tipo: novo } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
