import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAuth, getSession } from "@/lib/auth";

// GET /api/documentos?financiamentoId=...
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const financiamentoId = request.nextUrl.searchParams.get("financiamentoId");
    if (!financiamentoId) {
      return NextResponse.json({ success: false, error: "financiamentoId obrigatório" }, { status: 400 });
    }
    const documentos = await prisma.documento.findMany({
      where: { financiamentoId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: documentos });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/documentos — upload de arquivo
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const financiamentoId = formData.get("financiamentoId") as string;
    const tipo = formData.get("tipo") as string;

    if (!file || !financiamentoId) {
      return NextResponse.json({ success: false, error: "Arquivo e financiamentoId obrigatórios" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`documentos/${financiamentoId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const documento = await prisma.documento.create({
      data: {
        financiamentoId,
        nome: file.name,
        url: blob.url,
        tipo: tipo || "outro",
        tamanho: file.size,
        uploadedBy: session.role,
      },
    });

    return NextResponse.json({ success: true, data: documento });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
