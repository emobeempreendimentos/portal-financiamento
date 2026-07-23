import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const MAX_LISTA = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toData(body: any) {
  return {
    titulo: String(body.titulo || "").trim(),
    tipo: body.tipo || "proposta",
    destinatario: body.destinatario?.trim() || null,
    corpo: String(body.corpo || "").trim(),
  };
}

// GET — lista os últimos termos gerados
export async function GET() {
  try {
    await requireAdmin();
    const data = await prisma.termoEnvio.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_LISTA,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}

// POST — salva um novo termo (mantém apenas os últimos MAX_LISTA)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    if (!body.titulo?.trim() || !body.corpo?.trim()) {
      return NextResponse.json({ success: false, error: "Informe o título e o conteúdo do termo" }, { status: 400 });
    }

    const saved = await prisma.termoEnvio.create({ data: toData(body) });

    const antigos = await prisma.termoEnvio.findMany({
      orderBy: { createdAt: "desc" },
      skip: MAX_LISTA,
      select: { id: true },
    });
    if (antigos.length > 0) {
      await prisma.termoEnvio.deleteMany({ where: { id: { in: antigos.map((t) => t.id) } } });
    }

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Erro ao salvar termo:", error);
    const msg = error instanceof Error ? error.message : "Erro ao salvar termo";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
