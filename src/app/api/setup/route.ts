import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({ where: { role: "admin" } });

    if (adminExists) {
      return NextResponse.json({
        success: false,
        error: "Setup já foi concluído. Usuário admin já existe.",
      }, { status: 400 });
    }

    const senhaAdmin = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        nome: "Administrador",
        email: "admin@emobe.com.br",
        senha: senhaAdmin,
        role: "admin",
      },
    });

    const senhaCliente = await bcrypt.hash("cliente123", 12);
    await prisma.user.create({
      data: {
        nome: "João Silva",
        email: "joao.silva@email.com",
        senha: senhaCliente,
        telefone: "(11) 98765-4321",
        cpf: "123.456.789-00",
        role: "cliente",
        financiamento: {
          create: {
            statusGeral: "em_andamento",
            etapas: {
              create: [
                { nome: "Aprovação", ordem: 1, status: "concluido", dataInicio: new Date("2024-01-15"), dataConclusao: new Date("2024-01-20") },
                { nome: "Aprovação Engenharia", ordem: 2, status: "concluido", dataInicio: new Date("2024-01-21"), dataConclusao: new Date("2024-02-05") },
                { nome: "Assinatura de Contrato", ordem: 3, status: "em_andamento", dataInicio: new Date("2024-02-06") },
                { nome: "ITBI", ordem: 4, status: "aguardando" },
                { nome: "Registro", ordem: 5, status: "aguardando" },
                { nome: "Entrega das Chaves", ordem: 6, status: "aguardando" },
              ],
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Setup concluído com sucesso!",
      admin: { email: "admin@emobe.com.br", senha: "admin123" },
      cliente: { email: "joao.silva@email.com", senha: "cliente123" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
