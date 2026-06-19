import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const financiamento = await prisma.financiamento.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!financiamento) {
      return NextResponse.json({ error: "Financiamento não encontrado" }, { status: 404 });
    }

    const financeiro = await prisma.financeiroVenda.findUnique({
      where: { financiamentoId: id },
      include: {
        comissao: { include: { corretores: true } },
        historico: { orderBy: { createdAt: "desc" } },
        contasPagamento: { orderBy: { ordem: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: financeiro });
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const financiamento = await prisma.financiamento.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!financiamento) {
      return NextResponse.json({ error: "Financiamento não encontrado" }, { status: 404 });
    }

    const {
      // Venda geral
      tipoVenda, valorImovel, dataVenda, statusVenda,
      // À Vista
      sinalValor, sinalData, sinalFormaPagamento, sinalStatus,
      escrituraValorRestante, escrituraDataPrevista, escrituraDataQuitacao, escrituraStatus,
      // Financiamento
      entradaValor, entradaData, entradaFormaPagamento,
      usouFgts, fgtsValor, bancoFinanciador, valorFinanciado,
      contratoDataAssinatura, contratoStatus, valorLiberadoBanco, dataLiberacaoBanco,
      // Dados bancários do vendedor
      pixChave, pixTipo, contaBanco, contaAgencia, contaNumero, contaTipo, contaTitular,
      // Contas de pagamento (relatório)
      contasPagamento,
      // Comissão
      comissao,
      // Histórico entries (opção de adicionar evento manual)
      novoHistorico,
    } = body;

    const parseDate = (v: string | null | undefined) =>
      v ? new Date(v) : null;

    const vendaData = {
      tipoVenda: tipoVenda ?? "financiamento",
      valorImovel: valorImovel ?? null,
      dataVenda: parseDate(dataVenda),
      statusVenda: statusVenda ?? "em_andamento",
      sinalValor: sinalValor ?? null,
      sinalData: parseDate(sinalData),
      sinalFormaPagamento: sinalFormaPagamento ?? null,
      sinalStatus: sinalStatus ?? "pendente",
      escrituraValorRestante: escrituraValorRestante ?? null,
      escrituraDataPrevista: parseDate(escrituraDataPrevista),
      escrituraDataQuitacao: parseDate(escrituraDataQuitacao),
      escrituraStatus: escrituraStatus ?? "pendente",
      entradaValor: entradaValor ?? null,
      entradaData: parseDate(entradaData),
      entradaFormaPagamento: entradaFormaPagamento ?? null,
      usouFgts: usouFgts ?? false,
      fgtsValor: fgtsValor ?? null,
      bancoFinanciador: bancoFinanciador ?? null,
      valorFinanciado: valorFinanciado ?? null,
      contratoDataAssinatura: parseDate(contratoDataAssinatura),
      contratoStatus: contratoStatus ?? null,
      valorLiberadoBanco: valorLiberadoBanco ?? null,
      dataLiberacaoBanco: parseDate(dataLiberacaoBanco),
      pixChave: pixChave ?? null,
      pixTipo: pixTipo ?? null,
      contaBanco: contaBanco ?? null,
      contaAgencia: contaAgencia ?? null,
      contaNumero: contaNumero ?? null,
      contaTipo: contaTipo ?? null,
      contaTitular: contaTitular ?? null,
    };

    const existing = await prisma.financeiroVenda.findUnique({
      where: { financiamentoId: id },
    });

    let financeiroVenda;

    if (existing) {
      financeiroVenda = await prisma.financeiroVenda.update({
        where: { financiamentoId: id },
        data: vendaData,
      });
    } else {
      financeiroVenda = await prisma.financeiroVenda.create({
        data: { financiamentoId: id, ...vendaData },
      });
    }

    // Re-criar contas de pagamento (delete + insert)
    await prisma.contaPagamento.deleteMany({ where: { financeiroVendaId: financeiroVenda.id } });
    if (Array.isArray(contasPagamento) && contasPagamento.length > 0) {
      await prisma.contaPagamento.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: contasPagamento.map((cp: any, idx: number) => ({
          financeiroVendaId: financeiroVenda.id,
          tipo:          cp.tipo          ?? "vendedor",
          descricao:     cp.descricao     ?? null,
          formaPagamento:cp.formaPagamento?? null,
          pixChave:      cp.pixChave      ?? null,
          pixTipo:       cp.pixTipo       ?? null,
          banco:         cp.banco         ?? null,
          agencia:       cp.agencia       ?? null,
          numero:        cp.numero        ?? null,
          contaTipo:     cp.contaTipo     ?? null,
          titular:       cp.titular       ?? null,
          valor:         cp.valor != null ? Number(cp.valor) : null,
          ordem:         idx,
        })),
      });
    }

    // Upsert comissão
    if (comissao) {
      const { corretores, ...comissaoData } = comissao;

      const comissaoPayload = {
        percentual: comissaoData.percentual ?? null,
        valor: comissaoData.valor ?? null,
        dataPrevistaRecebimento: parseDate(comissaoData.dataPrevistaRecebimento),
        dataEfetivaRecebimento: parseDate(comissaoData.dataEfetivaRecebimento),
        status: comissaoData.status ?? "pendente",
        houveAdiantamento: comissaoData.houveAdiantamento ?? false,
        valorAdiantado: comissaoData.valorAdiantado ?? null,
        dataAdiantamento: parseDate(comissaoData.dataAdiantamento),
        obsAdiantamento: comissaoData.obsAdiantamento ?? null,
        houveDivisao: comissaoData.houveDivisao ?? false,
        percentualPrincipal: comissaoData.percentualPrincipal ?? null,
      };

      const existingComissao = await prisma.comissaoImobiliaria.findUnique({
        where: { financeiroVendaId: financeiroVenda.id },
      });

      let comissaoRecord;
      if (existingComissao) {
        comissaoRecord = await prisma.comissaoImobiliaria.update({
          where: { financeiroVendaId: financeiroVenda.id },
          data: comissaoPayload,
        });
      } else {
        comissaoRecord = await prisma.comissaoImobiliaria.create({
          data: { financeiroVendaId: financeiroVenda.id, ...comissaoPayload },
        });
      }

      // Re-criar corretores (estratégia delete+insert)
      if (Array.isArray(corretores)) {
        await prisma.corretorParticipante.deleteMany({
          where: { comissaoId: comissaoRecord.id },
        });
        if (corretores.length > 0) {
          await prisma.corretorParticipante.createMany({
            data: corretores.map((c: { nome: string; creci?: string; percentual?: number; valor?: number }) => ({
              comissaoId: comissaoRecord.id,
              nome: c.nome,
              creci: c.creci ?? null,
              percentual: c.percentual ?? null,
              valor: c.valor ?? null,
            })),
          });
        }
      }
    }

    // Registrar histórico
    if (novoHistorico) {
      await prisma.historicoFinanceiro.create({
        data: {
          financeiroVendaId: financeiroVenda.id,
          descricao: novoHistorico,
          usuario: session.nome,
        },
      });
    }

    const result = await prisma.financeiroVenda.findUnique({
      where: { id: financeiroVenda.id },
      include: {
        comissao: { include: { corretores: true } },
        historico: { orderBy: { createdAt: "desc" } },
        contasPagamento: { orderBy: { ordem: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
