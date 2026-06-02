import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$executeRaw`ALTER TABLE "Financiamento" ADD COLUMN IF NOT EXISTS "concluidoEm" TIMESTAMP(3)`;
    return NextResponse.json({ success: true, message: "Coluna concluidoEm adicionada!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
