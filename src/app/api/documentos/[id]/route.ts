import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/documentos/[id]
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const doc = await prisma.documento.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ success: false, error: "Documento não encontrado" }, { status: 404 });

    // Delete from Vercel Blob
    try { await del(doc.url); } catch { /* blob may already be gone */ }

    await prisma.documento.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
