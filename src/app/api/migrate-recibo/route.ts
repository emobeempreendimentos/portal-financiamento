import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota TEMPORÁRIA de migração — cria a tabela Recibo. Remover após executar.
const SECRET = "emobe-migrate-recibo-2026";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Recibo" (
        "id" TEXT PRIMARY KEY,
        "numero" INTEGER NOT NULL DEFAULT 0,
        "recebedorNome" TEXT NOT NULL,
        "recebedorTipoDoc" TEXT,
        "recebedorDoc" TEXT,
        "pagadorNome" TEXT NOT NULL,
        "pagadorTipoDoc" TEXT,
        "pagadorDoc" TEXT,
        "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "referente" TEXT,
        "imovelMatricula" TEXT,
        "formaPagamento" TEXT,
        "cidade" TEXT,
        "data" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return NextResponse.json({ success: true, message: "Tabela Recibo criada." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
