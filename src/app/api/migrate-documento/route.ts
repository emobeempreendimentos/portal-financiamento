import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota TEMPORÁRIA de migração — adiciona a coluna documento. Remover após executar.
const SECRET = "emobe-migrate-documento-2026";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ContaPagamento" ADD COLUMN IF NOT EXISTS "documento" TEXT;`
    );
    return NextResponse.json({ success: true, message: "Coluna documento adicionada." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
