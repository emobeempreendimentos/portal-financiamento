import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PAGAMENTO_LABEL: Record<string, string> = {
  pix: "PIX",
  credito: "Crédito",
  debito: "Débito",
  dinheiro: "Dinheiro",
};

export async function GET() {
  try {
    await requireAdmin();

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      orderBy: { data: "desc" },
    });

    // ── Resumo ──────────────────────────────────────────────────────────────
    const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
    const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    // ── Por categoria ────────────────────────────────────────────────────────
    const catMap = new Map<string, { tipo: string; categoria: string; count: number; total: number }>();
    for (const l of lancamentos) {
      const k = `${l.tipo}::${l.categoria}`;
      if (!catMap.has(k)) catMap.set(k, { tipo: l.tipo, categoria: l.categoria, count: 0, total: 0 });
      const c = catMap.get(k)!;
      c.count++;
      c.total += l.valor;
    }
    const porCategoria = {
      receitas: [...catMap.values()].filter((c) => c.tipo === "receita").sort((a, b) => b.total - a.total),
      despesas: [...catMap.values()].filter((c) => c.tipo === "despesa").sort((a, b) => b.total - a.total),
    };

    // ── Por forma de pagamento ───────────────────────────────────────────────
    const pagMap = new Map<string, { forma: string; label: string; count: number; total: number }>();
    for (const l of lancamentos) {
      if (!l.formaPagamento) continue;
      if (!pagMap.has(l.formaPagamento))
        pagMap.set(l.formaPagamento, { forma: l.formaPagamento, label: PAGAMENTO_LABEL[l.formaPagamento] || l.formaPagamento, count: 0, total: 0 });
      const p = pagMap.get(l.formaPagamento)!;
      p.count++;
      p.total += l.valor;
    }
    const porFormaPagamento = [...pagMap.values()].sort((a, b) => b.total - a.total);

    // ── Evolução mensal (todos os meses existentes) ──────────────────────────
    const mesMap = new Map<string, { label: string; receitas: number; despesas: number; saldo: number }>();
    for (const l of lancamentos) {
      const d = new Date(l.data);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      if (!mesMap.has(k)) mesMap.set(k, { label, receitas: 0, despesas: 0, saldo: 0 });
      const m = mesMap.get(k)!;
      if (l.tipo === "receita") m.receitas += l.valor;
      else m.despesas += l.valor;
      m.saldo = m.receitas - m.despesas;
    }
    const porMes = [...mesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    // ── Período ──────────────────────────────────────────────────────────────
    const datas = lancamentos.map((l) => new Date(l.data).getTime());
    const dataInicio = datas.length ? new Date(Math.min(...datas)).toLocaleDateString("pt-BR") : "—";
    const dataFim    = datas.length ? new Date(Math.max(...datas)).toLocaleDateString("pt-BR") : "—";

    return NextResponse.json({
      success: true,
      data: {
        lancamentos,
        resumo: { totalReceitas, totalDespesas, saldo, totalLancamentos: lancamentos.length },
        porCategoria,
        porFormaPagamento,
        porMes,
        periodo: { dataInicio, dataFim },
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}
