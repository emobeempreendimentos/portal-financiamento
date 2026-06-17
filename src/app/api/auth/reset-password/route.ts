import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "portal-financiamento-secret-key-emobe-2024"
);

export async function POST(request: NextRequest) {
  try {
    const { token, novaSenha } = await request.json();

    if (!token || !novaSenha) {
      return NextResponse.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { success: false, error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    let payload: { sub?: string; type?: string; fp?: string };
    try {
      const result = await jwtVerify(token, SECRET);
      payload = result.payload as typeof payload;
    } catch {
      return NextResponse.json(
        { success: false, error: "Link expirado ou inválido. Solicite um novo." },
        { status: 400 }
      );
    }

    if (payload.type !== "reset" || !payload.sub) {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verifica fingerprint — garante que o token não foi usado antes
    if (user.senha.substring(0, 8) !== payload.fp) {
      return NextResponse.json(
        { success: false, error: "Este link já foi utilizado. Solicite um novo." },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);
    await prisma.user.update({ where: { id: user.id }, data: { senha: senhaHash } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
