import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await requireAdmin();

    await prisma.$executeRaw`
      ALTER TABLE "FinanceiroVenda"
        ADD COLUMN IF NOT EXISTS "pixChave"     TEXT,
        ADD COLUMN IF NOT EXISTS "pixTipo"      TEXT,
        ADD COLUMN IF NOT EXISTS "contaBanco"   TEXT,
        ADD COLUMN IF NOT EXISTS "contaAgencia" TEXT,
        ADD COLUMN IF NOT EXISTS "contaNumero"  TEXT,
        ADD COLUMN IF NOT EXISTS "contaTipo"    TEXT,
        ADD COLUMN IF NOT EXISTS "contaTitular" TEXT
    `;

    return NextResponse.json({ success: true, message: "Migração executada com sucesso." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
