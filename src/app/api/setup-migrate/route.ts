import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/setup-migrate — ativa RLS em todas as tabelas (uso único)
export async function GET() {
  try {
    await prisma.$executeRaw`ALTER TABLE "User"          ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "Financiamento" ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "Etapa"         ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "Pendencia"     ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "Historico"     ENABLE ROW LEVEL SECURITY`;
    await prisma.$executeRaw`ALTER TABLE "Documento"     ENABLE ROW LEVEL SECURITY`;

    return NextResponse.json({
      success: true,
      message: "RLS ativado em todas as tabelas com sucesso!",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
