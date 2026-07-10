import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota TEMPORÁRIA de migração — cria a tabela DocumentoImportante. Remover após executar.
const SECRET = "emobe-migrate-docs-2026";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentoImportante" (
        "id" TEXT PRIMARY KEY,
        "titulo" TEXT NOT NULL,
        "descricao" TEXT,
        "categoria" TEXT NOT NULL DEFAULT 'outro',
        "nomeArquivo" TEXT NOT NULL,
        "tamanho" INTEGER NOT NULL,
        "mimeType" TEXT NOT NULL,
        "conteudo" BYTEA NOT NULL,
        "uploadedBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return NextResponse.json({ success: true, message: "Tabela DocumentoImportante criada." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
