import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession } from "@/lib/auth";

const SELECT_SEM_CONTEUDO = {
  id: true, titulo: true, descricao: true, categoria: true,
  nomeArquivo: true, tamanho: true, mimeType: true,
  uploadedBy: true, createdAt: true,
};

// GET /api/admin/documentos — lista (sem o binário)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const categoria = request.nextUrl.searchParams.get("categoria");
    const busca = request.nextUrl.searchParams.get("busca");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (categoria) where.categoria = categoria;
    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: "insensitive" } },
        { descricao: { contains: busca, mode: "insensitive" } },
        { nomeArquivo: { contains: busca, mode: "insensitive" } },
      ];
    }

    const documentos = await prisma.documentoImportante.findMany({
      where,
      select: SELECT_SEM_CONTEUDO,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: documentos });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}

// POST /api/admin/documentos — envia um novo documento
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const session = await getSession();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titulo = (formData.get("titulo") as string) || "";
    const descricao = (formData.get("descricao") as string) || "";
    const categoria = (formData.get("categoria") as string) || "outro";

    if (!file || !titulo.trim()) {
      return NextResponse.json({ success: false, error: "Título e arquivo são obrigatórios" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Arquivo muito grande. Máximo: 10MB" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const documento = await prisma.documentoImportante.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        categoria,
        nomeArquivo: file.name,
        tamanho: file.size,
        mimeType: file.type || "application/octet-stream",
        conteudo: buffer,
        uploadedBy: session?.nome || "admin",
      },
      select: SELECT_SEM_CONTEUDO,
    });

    return NextResponse.json({ success: true, data: documento }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
