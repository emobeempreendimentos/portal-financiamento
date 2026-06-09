import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LancamentoFinanceiro" (
        "id"          TEXT NOT NULL,
        "descricao"   TEXT NOT NULL,
        "valor"       DOUBLE PRECISION NOT NULL,
        "tipo"        TEXT NOT NULL,
        "categoria"   TEXT NOT NULL,
        "data"        TIMESTAMP(3) NOT NULL,
        "observacao"  TEXT,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
      );
    `);

    // Enable RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "LancamentoFinanceiro" ENABLE ROW LEVEL SECURITY;`);

    return NextResponse.json({ success: true, message: "Tabela LancamentoFinanceiro criada com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
