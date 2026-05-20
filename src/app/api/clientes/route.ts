import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth";

const ETAPAS_PADRAO = [
  { nome: "Aprovação", ordem: 1 },
  { nome: "Aprovação Engenharia", ordem: 2 },
  { nome: "Assinatura de Contrato", ordem: 3 },
  { nome: "ITBI", ordem: 4 },
  { nome: "Registro", ordem: 5 },
  { nome: "Entrega das Chaves", ordem: 6 },
];

export async function GET() {
  try {
    await requireAdmin();

    const clientes = await prisma.user.findMany({
      where: { role: "cliente" },
      include: {
        financiamento: {
          include: { etapas: { orderBy: { ordem: "asc" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: clientes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { nome, email, senha, telefone, cpf, conjuge, banco } = body;

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { success: false, error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const user = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        telefone,
        cpf,
        conjuge,
        banco,
        role: "cliente",
        financiamento: {
          create: {
            statusGeral: "em_andamento",
            etapas: {
              create: ETAPAS_PADRAO.map((e) => ({
                nome: e.nome,
                ordem: e.ordem,
                status: "aguardando",
              })),
            },
          },
        },
      },
      include: {
        financiamento: {
          include: { etapas: { orderBy: { ordem: "asc" } } },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _senha, ...userSemSenha } = user;
    return NextResponse.json({ success: true, data: userSemSenha }, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { email, telefone } = body;

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { email, telefone },
      select: {
        id: true, nome: true, email: true, telefone: true,
        cpf: true, conjuge: true, banco: true, role: true, avatar: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
