import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // "receita" | "despesa" | null = todos
    const mes = searchParams.get("mes");   // "2024-06" format
    const categoria = searchParams.get("categoria");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (mes) {
      const [ano, m] = mes.split("-").map(Number);
      where.data = {
        gte: new Date(ano, m - 1, 1),
        lt: new Date(ano, m, 1),
      };
    }

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where,
      orderBy: { data: "desc" },
    });

    // Resumo financeiro (sem filtro de mês para totais gerais)
    const todos = await prisma.lancamentoFinanceiro.findMany({ orderBy: { data: "asc" } });

    const totalReceitas = todos
      .filter((l) => l.tipo === "receita")
      .reduce((acc, l) => acc + l.valor, 0);

    const totalDespesas = todos
      .filter((l) => l.tipo === "despesa")
      .reduce((acc, l) => acc + l.valor, 0);

    const saldo = totalReceitas - totalDespesas;

    // Dados mensais (últimos 6 meses) para gráfico
    const hoje = new Date();
    const meses: { label: string; receitas: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const do_mes = todos.filter((l) => l.data >= d && l.data < fim);
      meses.push({
        label,
        receitas: do_mes.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0),
        despesas: do_mes.filter((l) => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0),
      });
    }

    return NextResponse.json({
      success: true,
      data: lancamentos,
      resumo: { totalReceitas, totalDespesas, saldo, totalLancamentos: todos.length },
      grafico: meses,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { descricao, valor, tipo, categoria, data, observacao } = body;

    if (!descricao || !valor || !tipo || !categoria || !data) {
      return NextResponse.json({ success: false, error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    if (!["receita", "despesa"].includes(tipo)) {
      return NextResponse.json({ success: false, error: "Tipo inválido" }, { status: 400 });
    }

    const lancamento = await prisma.lancamentoFinanceiro.create({
      data: {
        descricao: descricao.trim(),
        valor: parseFloat(valor),
        tipo,
        categoria,
        data: new Date(data),
        formaPagamento: body.formaPagamento || null,
        parcelas: body.formaPagamento === "credito" && body.parcelas ? parseInt(body.parcelas) : null,
        observacao: observacao?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: lancamento }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
