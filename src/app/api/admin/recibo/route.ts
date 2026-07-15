import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const MAX_LISTA = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toData(body: any) {
  return {
    recebedorNome: String(body.recebedorNome || "").trim(),
    recebedorTipoDoc: body.recebedorTipoDoc || null,
    recebedorDoc: body.recebedorDoc || null,
    pagadorNome: String(body.pagadorNome || "").trim(),
    pagadorTipoDoc: body.pagadorTipoDoc || null,
    pagadorDoc: body.pagadorDoc || null,
    valor: Number(body.valor) || 0,
    referente: body.referente || null,
    imovelMatricula: body.imovelMatricula || null,
    formaPagamento: body.formaPagamento || null,
    cidade: body.cidade || null,
    data: body.data || null,
  };
}

// GET — lista as últimas emissões
export async function GET() {
  try {
    await requireAdmin();
    const data = await prisma.recibo.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_LISTA,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}

// POST — cria um recibo com número sequencial
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    if (!body.recebedorNome?.trim() || !body.pagadorNome?.trim()) {
      return NextResponse.json({ success: false, error: "Informe o recebedor e o pagador" }, { status: 400 });
    }

    const ultimo = await prisma.recibo.findFirst({ orderBy: { numero: "desc" }, select: { numero: true } });
    const numero = (ultimo?.numero ?? 0) + 1;

    const saved = await prisma.recibo.create({ data: { ...toData(body), numero } });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Erro ao salvar recibo:", error);
    const msg = error instanceof Error ? error.message : "Erro ao salvar recibo";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
