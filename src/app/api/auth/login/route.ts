import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "cliente",
      nome: user.nome,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
