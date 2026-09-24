import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { Processo, ProcessoEtapa } from "@/lib/processos";

// GET /api/admin/processos — processos ativos (em andamento/pausados) para o quadro e o alerta de parados
export async function GET() {
  try {
    await requireAdmin();

    const financiamentos = await prisma.financiamento.findMany({
      where: { statusGeral: { in: ["em_andamento", "pausado"] } },
      select: {
        id: true,
        protocolo: true,
        statusGeral: true,
        createdAt: true,
        user: { select: { id: true, nome: true, banco: true } },
        etapas: {
          orderBy: { ordem: "asc" },
          select: { id: true, nome: true, ordem: true, status: true, dataInicio: true },
        },
        historico: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const data: Processo[] = financiamentos.map((f) => {
      const atual =
        f.etapas.find((e) => e.status === "em_andamento") ??
        f.etapas.find((e) => e.status === "aguardando") ??
        null;

      const marcos = [f.createdAt.getTime()];
      if (atual?.dataInicio) marcos.push(atual.dataInicio.getTime());
      if (f.historico[0]) marcos.push(f.historico[0].createdAt.getTime());

      return {
        financiamentoId: f.id,
        userId: f.user.id,
        nome: f.user.nome,
        protocolo: f.protocolo,
        banco: f.user.banco,
        statusGeral: f.statusGeral as Processo["statusGeral"],
        etapas: f.etapas.map((e) => ({
          id: e.id, nome: e.nome, ordem: e.ordem, status: e.status as ProcessoEtapa["status"],
        })),
        etapaAtual: atual ? { id: atual.id, nome: atual.nome, ordem: atual.ordem } : null,
        ultimaMovimentacao: new Date(Math.max(...marcos)).toISOString(),
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}
