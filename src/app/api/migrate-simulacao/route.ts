import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota TEMPORÁRIA de migração — cria a tabela Simulacao. Remover após executar.
const SECRET = "emobe-migrate-simulacao-2026";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Simulacao" (
        "id" TEXT PRIMARY KEY,
        "clienteNome" TEXT NOT NULL,
        "clienteCpf" TEXT,
        "clienteRenda" DOUBLE PRECISION,
        "clienteDataNascimento" TEXT,
        "clienteDependentes" BOOLEAN NOT NULL DEFAULT false,
        "clienteTemaFgts" BOOLEAN NOT NULL DEFAULT false,
        "clienteValorFgts" DOUBLE PRECISION,
        "tipoFinanciamento" TEXT NOT NULL,
        "tipoImovel" TEXT NOT NULL,
        "banco" TEXT,
        "valorImovel" DOUBLE PRECISION,
        "valorEntrada" DOUBLE PRECISION,
        "subsidio" DOUBLE PRECISION,
        "valorParcelaInicial" DOUBLE PRECISION,
        "valorParcelaFinal" DOUBLE PRECISION,
        "prazo" INTEGER,
        "prazoPeriodo" TEXT,
        "taxaJuros" DOUBLE PRECISION,
        "taxaPeriodo" TEXT,
        "sistemaAmortizacao" TEXT,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return NextResponse.json({ success: true, message: "Tabela Simulacao criada." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
