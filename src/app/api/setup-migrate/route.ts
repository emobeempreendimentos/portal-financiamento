import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/setup-migrate — cria tabela Documento (uso único)
export async function GET() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Documento" (
        "id"              TEXT         NOT NULL,
        "financiamentoId" TEXT         NOT NULL,
        "nome"            TEXT         NOT NULL,
        "url"             TEXT         NOT NULL,
        "tipo"            TEXT         NOT NULL,
        "tamanho"         INTEGER      NOT NULL,
        "uploadedBy"      TEXT         NOT NULL,
        "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id"),
        CONSTRAINT "Documento_financiamentoId_fkey"
          FOREIGN KEY ("financiamentoId")
          REFERENCES "Financiamento"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;
    return NextResponse.json({ success: true, message: "Tabela Documento criada com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
