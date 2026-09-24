import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Aplica a máscara de CPF a um trecho de dígitos ("1234567" → "123.456.7")
function mascaraCpfParcial(d: string) {
  let s = d.slice(0, 3);
  if (d.length > 3) s += "." + d.slice(3, 6);
  if (d.length > 6) s += "." + d.slice(6, 9);
  if (d.length > 9) s += "-" + d.slice(9, 11);
  return s;
}

const ci = (v: string) => ({ contains: v, mode: "insensitive" as const });

// GET /api/admin/busca?q=... — busca global do admin (Ctrl+K)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const q = (request.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return NextResponse.json({ success: true, data: { clientes: [], simulacoes: [], tarefas: [], documentos: [], termos: [] } });
    }

    const digitos = q.replace(/\D/g, "");
    const soNumeroOuProtocolo = /^(emb-?)?\d+$/i.test(q.replace(/\s/g, ""));
    const protocolo = soNumeroOuProtocolo && digitos ? parseInt(digitos, 10) : null;

    const orCliente: object[] = [
      { nome: ci(q) },
      { email: ci(q) },
      { cpf: ci(q) },
      { telefone: ci(q) },
      { conjuge: ci(q) },
    ];
    if (digitos.length >= 3) {
      orCliente.push({ cpf: { contains: mascaraCpfParcial(digitos) } });
      orCliente.push({ cpf: { contains: digitos } });
    }
    if (protocolo !== null && protocolo <= 2_147_483_647) {
      orCliente.push({ financiamento: { protocolo } });
    }

    const [clientes, simulacoes, tarefas, documentos, termos] = await Promise.all([
      prisma.user.findMany({
        where: { role: "cliente", OR: orCliente },
        select: {
          id: true, nome: true, email: true, cpf: true,
          financiamento: { select: { protocolo: true, statusGeral: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.simulacao.findMany({
        where: { OR: [{ clienteNome: ci(q) }, { clienteCpf: ci(q) }] },
        select: { id: true, clienteNome: true, banco: true, valorImovel: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.tarefa.findMany({
        where: { OR: [{ titulo: ci(q) }, { descricao: ci(q) }] },
        select: { id: true, titulo: true, status: true, dataLimite: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.documentoImportante.findMany({
        where: { OR: [{ titulo: ci(q) }, { nomeArquivo: ci(q) }] },
        select: { id: true, titulo: true, categoria: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.termoEnvio.findMany({
        where: { OR: [{ titulo: ci(q) }, { destinatario: ci(q) }] },
        select: { id: true, titulo: true, destinatario: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
    ]);

    return NextResponse.json({ success: true, data: { clientes, simulacoes, tarefas, documentos, termos } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}
