import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota TEMPORÁRIA de migração — cria a tabela Tarefa. Remover após executar.
const SECRET = "emobe-migrate-tarefas-2026";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Tarefa" (
        "id" TEXT PRIMARY KEY,
        "titulo" TEXT NOT NULL,
        "descricao" TEXT,
        "prioridade" TEXT NOT NULL DEFAULT 'media',
        "prioridadeNivel" INTEGER NOT NULL DEFAULT 2,
        "status" TEXT NOT NULL DEFAULT 'pendente',
        "dataLimite" TEXT,
        "hora" TEXT,
        "concluidaEm" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Tarefa_status_idx" ON "Tarefa"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Tarefa_dataLimite_idx" ON "Tarefa"("dataLimite");`);
    return NextResponse.json({ success: true, message: "Tabela Tarefa criada." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
