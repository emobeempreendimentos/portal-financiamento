import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/pendencias?financiamentoId=xxx
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const financiamentoId = request.nextUrl.searchParams.get("financiamentoId");
    if (!financiamentoId) {
      return NextResponse.json({ success: false, error: "financiamentoId obrigatório" }, { status: 400 });
    }
    const pendencias = await prisma.pendencia.findMany({
      where: { financiamentoId },
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json({ success: true, data: pendencias });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/pendencias
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { financiamentoId, descricao } = await request.json();
    if (!financiamentoId || !descricao?.trim()) {
      return NextResponse.json({ success: false, error: "Campos obrigatórios" }, { status: 400 });
    }
    const pendencia = await prisma.pendencia.create({
      data: { financiamentoId, descricao: descricao.trim() },
    });
    await prisma.financiamento.update({
      where: { id: financiamentoId },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json({ success: true, data: pendencia });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
