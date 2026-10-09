import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORÁRIO — adiciona a coluna "tipo" (financiamento | avista) ao processo. Remover após rodar.
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("secret") !== "931089e485f7336698c0fbc7587e28e3790c") {
    return NextResponse.json({ success: false }, { status: 404 });
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Financiamento" ADD COLUMN IF NOT EXISTS "tipo" TEXT NOT NULL DEFAULT 'financiamento'`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
