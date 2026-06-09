import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LancamentoPessoal" (
        "id"          TEXT NOT NULL,
        "descricao"   TEXT NOT NULL,
        "valor"       DOUBLE PRECISION NOT NULL,
        "tipo"        TEXT NOT NULL,
        "categoria"   TEXT NOT NULL,
        "data"        TIMESTAMP(3) NOT NULL,
        "observacao"  TEXT,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LancamentoPessoal_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`ALTER TABLE "LancamentoPessoal" ENABLE ROW LEVEL SECURITY;`);

    return NextResponse.json({ success: true, message: "Tabela LancamentoPessoal criada com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
