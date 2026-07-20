import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/documentos?financiamentoId=... (sem conteudo binário)
// Documentos do financiamento são privados: apenas admin pode listá-los.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const financiamentoId = request.nextUrl.searchParams.get("financiamentoId");
    if (!financiamentoId) {
      return NextResponse.json({ success: false, error: "financiamentoId obrigatório" }, { status: 400 });
    }
    const documentos = await prisma.documento.findMany({
      where: { financiamentoId },
      select: {
        id: true, financiamentoId: true, nome: true,
        tipo: true, tamanho: true, mimeType: true,
        uploadedBy: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: documentos });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/documentos — salva arquivo no banco (bytea). Apenas admin.
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const financiamentoId = formData.get("financiamentoId") as string;
    const tipo = formData.get("tipo") as string;

    if (!file || !financiamentoId) {
      return NextResponse.json({ success: false, error: "Arquivo e financiamentoId obrigatórios" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Arquivo muito grande. Máximo: 10MB" }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const documento = await prisma.documento.create({
      data: {
        financiamentoId,
        nome: file.name,
        tipo: tipo || "outro",
        tamanho: file.size,
        mimeType: file.type || "application/octet-stream",
        conteudo: buffer,
        uploadedBy: session.role,
      },
      select: {
        id: true, financiamentoId: true, nome: true,
        tipo: true, tamanho: true, mimeType: true,
        uploadedBy: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: documento });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
