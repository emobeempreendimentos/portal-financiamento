import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/migrate — cria tabela Pendencia se não existir (uso único)
export async function GET() {
  try {
    await requireAdmin();

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Pendencia" (
        "id"              TEXT         NOT NULL,
        "financiamentoId" TEXT         NOT NULL,
        "descricao"       TEXT         NOT NULL,
        "status"          TEXT         NOT NULL DEFAULT 'aberta',
        "criadoEm"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "concluidoEm"     TIMESTAMP(3),
        PRIMARY KEY ("id"),
        CONSTRAINT "Pendencia_financiamentoId_fkey"
          FOREIGN KEY ("financiamentoId")
          REFERENCES "Financiamento"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    return NextResponse.json({ success: true, message: "Tabela Pendencia criada com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
