import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota TEMPORÁRIA de migração — adiciona a coluna tipoOutro. Remover após executar.
const SECRET = "emobe-migrate-tipo-outro-2026";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "TermoEnvio" ADD COLUMN IF NOT EXISTS "tipoOutro" TEXT;`
    );
    return NextResponse.json({ success: true, message: "Coluna tipoOutro adicionada." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
