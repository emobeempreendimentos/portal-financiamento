import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Adiciona colunas nas duas tabelas financeiras
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LancamentoFinanceiro"
        ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT,
        ADD COLUMN IF NOT EXISTS "parcelas" INTEGER;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LancamentoPessoal"
        ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT,
        ADD COLUMN IF NOT EXISTS "parcelas" INTEGER;
    `);

    return NextResponse.json({
      success: true,
      message: "Colunas formaPagamento e parcelas adicionadas às duas tabelas!",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
