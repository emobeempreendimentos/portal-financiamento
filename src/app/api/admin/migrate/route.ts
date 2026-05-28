import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/migrate — adiciona coluna motivoCancelamento (uso único)
export async function GET() {
  try {
    await prisma.$executeRaw`ALTER TABLE "Financiamento" ADD COLUMN IF NOT EXISTS "motivoCancelamento" TEXT`;
    return NextResponse.json({ success: true, message: "Coluna motivoCancelamento adicionada com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
