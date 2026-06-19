import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    if (secret !== "emobe-migrate-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ContaPagamento" (
        "id"                TEXT NOT NULL,
        "financeiroVendaId" TEXT NOT NULL,
        "tipo"              TEXT NOT NULL,
        "descricao"         TEXT,
        "formaPagamento"    TEXT,
        "pixChave"          TEXT,
        "pixTipo"           TEXT,
        "banco"             TEXT,
        "agencia"           TEXT,
        "numero"            TEXT,
        "contaTipo"         TEXT,
        "titular"           TEXT,
        "valor"             DOUBLE PRECISION,
        "ordem"             INTEGER NOT NULL DEFAULT 0,
        "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "ContaPagamento_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ContaPagamento_financeiroVendaId_fkey"
          FOREIGN KEY ("financeiroVendaId")
          REFERENCES "FinanceiroVenda"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    return NextResponse.json({ success: true, message: "Tabela ContaPagamento criada com sucesso." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
