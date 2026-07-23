import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toData(body: any) {
  const tipo = body.tipo || "proposta";
  return {
    titulo: String(body.titulo || "").trim(),
    tipo,
    tipoOutro: tipo === "outro" ? (body.tipoOutro?.trim() || null) : null,
    destinatario: body.destinatario?.trim() || null,
    corpo: String(body.corpo || "").trim(),
  };
}

// PUT — atualiza um termo existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    if (!body.titulo?.trim() || !body.corpo?.trim()) {
      return NextResponse.json({ success: false, error: "Informe o título e o conteúdo do termo" }, { status: 400 });
    }

    const saved = await prisma.termoEnvio.update({ where: { id }, data: toData(body) });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE — remove um termo
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.termoEnvio.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
