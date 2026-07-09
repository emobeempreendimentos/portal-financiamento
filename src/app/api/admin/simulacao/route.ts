import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const MAX_SIMULACOES = 10;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toData(body: any) {
  return {
    clienteNome: String(body.clienteNome || "").trim(),
    clienteCpf: body.clienteCpf || null,
    clienteRenda: body.clienteRenda ?? null,
    clienteDataNascimento: body.clienteDataNascimento || null,
    clienteDependentes: !!body.clienteDependentes,
    clienteTemaFgts: !!body.clienteTemaFgts,
    clienteValorFgts: body.clienteValorFgts ?? null,
    tipoFinanciamento: body.tipoFinanciamento || "sbpe",
    tipoImovel: body.tipoImovel || "novo",
    banco: body.banco || null,
    valorImovel: body.valorImovel ?? null,
    valorEntrada: body.valorEntrada ?? null,
    subsidio: body.subsidio ?? null,
    valorParcelaInicial: body.valorParcelaInicial ?? null,
    valorParcelaFinal: body.valorParcelaFinal ?? null,
    prazo: body.prazo ?? null,
    prazoPeriodo: body.prazoPeriodo || null,
    taxaJuros: body.taxaJuros ?? null,
    taxaPeriodo: body.taxaPeriodo || null,
    sistemaAmortizacao: body.sistemaAmortizacao || null,
    observacoes: body.observacoes || null,
  };
}

// GET — lista as últimas 10 simulações
export async function GET() {
  try {
    await requireAdmin();
    const data = await prisma.simulacao.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_SIMULACOES,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}

// POST — cria uma nova simulação (ou atualiza se vier id) e mantém só as 10 últimas
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    if (!body.clienteNome?.trim()) {
      return NextResponse.json({ success: false, error: "Nome do cliente é obrigatório" }, { status: 400 });
    }

    const data = toData(body);

    let saved;
    if (body.id) {
      saved = await prisma.simulacao.update({ where: { id: body.id }, data });
    } else {
      saved = await prisma.simulacao.create({ data });
      // Mantém apenas as 10 mais recentes
      const antigas = await prisma.simulacao.findMany({
        orderBy: { createdAt: "desc" },
        skip: MAX_SIMULACOES,
        select: { id: true },
      });
      if (antigas.length > 0) {
        await prisma.simulacao.deleteMany({ where: { id: { in: antigas.map((s) => s.id) } } });
      }
    }

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Erro ao salvar simulação:", error);
    const msg = error instanceof Error ? error.message : "Erro ao salvar simulação";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE — remove uma simulação (?id=)
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id obrigatório" }, { status: 400 });
    await prisma.simulacao.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao excluir";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
