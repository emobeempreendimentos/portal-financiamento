import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const SELECT_SEM_CONTEUDO = {
  id: true, titulo: true, descricao: true, categoria: true,
  nomeArquivo: true, tamanho: true, mimeType: true,
  uploadedBy: true, createdAt: true,
};

// PUT /api/admin/documentos/[id] — edita metadados e (opcionalmente) troca o arquivo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const formData = await request.formData();
    const titulo = (formData.get("titulo") as string) || "";
    const descricao = (formData.get("descricao") as string) || "";
    const categoria = (formData.get("categoria") as string) || "outro";
    const file = formData.get("file") as File | null;

    if (!titulo.trim()) {
      return NextResponse.json({ success: false, error: "Título é obrigatório" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      categoria,
    };

    // Se um novo arquivo foi enviado, substitui o conteúdo
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "Arquivo muito grande. Máximo: 10MB" }, { status: 413 });
      }
      data.conteudo = Buffer.from(await file.arrayBuffer());
      data.nomeArquivo = file.name;
      data.tamanho = file.size;
      data.mimeType = file.type || "application/octet-stream";
    }

    const documento = await prisma.documentoImportante.update({
      where: { id },
      data,
      select: SELECT_SEM_CONTEUDO,
    });

    return NextResponse.json({ success: true, data: documento });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/documentos/[id]
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.documentoImportante.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
