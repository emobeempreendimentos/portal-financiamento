import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/documentos/[id]/download — serve o arquivo do banco
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const doc = await prisma.documento.findUnique({
      where: { id },
      select: { nome: true, mimeType: true, conteudo: true },
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: "Documento não encontrado" }, { status: 404 });
    }

    return new Response(doc.conteudo, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.nome)}"`,
        "Content-Length": doc.conteudo.length.toString(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
