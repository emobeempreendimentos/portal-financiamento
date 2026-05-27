import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/migrate — adiciona colunas do cônjuge (uso único)
export async function GET() {
  try {
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "conjugeCpf" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "conjugeEmail" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "conjugeTelefone" TEXT`;

    return NextResponse.json({ success: true, message: "Colunas do cônjuge adicionadas com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
