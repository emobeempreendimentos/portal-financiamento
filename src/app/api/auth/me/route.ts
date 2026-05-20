import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cpf: true,
        conjuge: true,
        banco: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
