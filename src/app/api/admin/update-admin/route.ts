import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/admin/update-admin — uso único para atualizar credenciais do admin
export async function GET() {
  try {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin não encontrado" }, { status: 404 });
    }

    const novaSenha = await bcrypt.hash("Emobe7039*", 12);

    await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: "contato@emobe.com.br",
        senha: novaSenha,
      },
    });

    return NextResponse.json({ success: true, message: "Credenciais do admin atualizadas com sucesso!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
