import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/documentos/[id]/download?inline=1 — serve o arquivo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const inline = request.nextUrl.searchParams.get("inline") === "1";

    const doc = await prisma.documentoImportante.findUnique({
      where: { id },
      select: { nomeArquivo: true, mimeType: true, conteudo: true },
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: "Documento não encontrado" }, { status: 404 });
    }

    const bytes = new Uint8Array(doc.conteudo);
    return new Response(bytes, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(doc.nomeArquivo)}"`,
        "Content-Length": bytes.byteLength.toString(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
