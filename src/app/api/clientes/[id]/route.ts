import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Clients can only see their own data
    if (session.role !== "admin" && session.userId !== id) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        financiamento: {
          include: {
            etapas: { orderBy: { ordem: "asc" } },
            historico: { orderBy: { createdAt: "desc" }, take: 20 },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Cliente não encontrado" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _senha, ...userSemSenha } = user;
    return NextResponse.json({ success: true, data: userSemSenha });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Admin can edit all fields; client can only edit email and telefone
    if (session.role === "admin") {
      const { nome, email, telefone, cpf, conjuge, conjugeCpf, conjugeEmail, conjugeTelefone, banco, senha } = body;
      const data: Record<string, unknown> = { nome, email, telefone, cpf, conjuge, conjugeCpf, conjugeEmail, conjugeTelefone, banco };
      if (senha) {
        data.senha = await bcrypt.hash(senha, 12);
      }

      const updated = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true, nome: true, email: true, telefone: true,
          cpf: true, conjuge: true, conjugeCpf: true, conjugeEmail: true, conjugeTelefone: true,
          banco: true, role: true, avatar: true,
          createdAt: true, updatedAt: true,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      if (session.userId !== id) {
        return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
      }
      const { email, telefone } = body;
      const updated = await prisma.user.update({
        where: { id },
        data: { email, telefone },
        select: {
          id: true, nome: true, email: true, telefone: true,
          cpf: true, conjuge: true, banco: true, role: true, avatar: true,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }
  } catch (error) {
    console.error("Update client error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Cliente excluído com sucesso" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
