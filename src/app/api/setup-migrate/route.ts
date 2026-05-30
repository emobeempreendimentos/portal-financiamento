import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/setup-migrate — recria tabela Documento com conteudo bytea (uso único)
export async function GET() {
  try {
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Documento"`;
    await prisma.$executeRaw`
      CREATE TABLE "Documento" (
        "id"              TEXT         NOT NULL,
        "financiamentoId" TEXT         NOT NULL,
        "nome"            TEXT         NOT NULL,
        "tipo"            TEXT         NOT NULL,
        "tamanho"         INTEGER      NOT NULL,
        "mimeType"        TEXT         NOT NULL,
        "conteudo"        BYTEA        NOT NULL,
        "uploadedBy"      TEXT         NOT NULL,
        "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("id"),
        CONSTRAINT "Documento_financiamentoId_fkey"
          FOREIGN KEY ("financiamentoId")
          REFERENCES "Financiamento"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;
    return NextResponse.json({ success: true, message: "Tabela Documento recriada com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
