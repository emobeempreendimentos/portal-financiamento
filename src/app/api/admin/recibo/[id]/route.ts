import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toData(body: any) {
  return {
    recebedorNome: String(body.recebedorNome || "").trim(),
    recebedorTipoDoc: body.recebedorTipoDoc || null,
    recebedorDoc: body.recebedorDoc || null,
    pagadorNome: String(body.pagadorNome || "").trim(),
    pagadorTipoDoc: body.pagadorTipoDoc || null,
    pagadorDoc: body.pagadorDoc || null,
    valor: Number(body.valor) || 0,
    referente: body.referente || null,
    imovelMatricula: body.imovelMatricula || null,
    formaPagamento: body.formaPagamento || null,
    cidade: body.cidade || null,
    data: body.data || null,
  };
}

// PUT — atualiza um recibo (mantém o número)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const saved = await prisma.recibo.update({ where: { id }, data: toData(body) });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE — remove um recibo
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.recibo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
