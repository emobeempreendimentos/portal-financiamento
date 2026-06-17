import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/mailer";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "portal-financiamento-secret-key-emobe-2024"
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Sempre retorna sucesso para não revelar se o email existe
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Fingerprint dos primeiros 8 chars do hash — invalida o token após a troca de senha
    const fp = user.senha.substring(0, 8);

    const token = await new SignJWT({ sub: user.id, type: "reset", fp })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(SECRET);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://financiamento.emobe.com.br";
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;

    await sendResetEmail(user.email, user.nome, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
