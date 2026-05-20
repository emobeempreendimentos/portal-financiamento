import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ETAPAS_PADRAO = [
  { nome: "Aprovação", ordem: 1 },
  { nome: "Aprovação Engenharia", ordem: 2 },
  { nome: "Assinatura de Contrato", ordem: 3 },
  { nome: "ITBI", ordem: 4 },
  { nome: "Registro", ordem: 5 },
  { nome: "Entrega das Chaves", ordem: 6 },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  // Admin
  const senhaAdmin = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@portalfinancimento.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@portalfinancimento.com",
      senha: senhaAdmin,
      role: "admin",
      telefone: "(11) 99999-0000",
    },
  });
  console.log("✅ Admin criado:", admin.email);

  // Cliente demo
  const senhaCliente = await bcrypt.hash("cliente123", 12);
  const cliente = await prisma.user.upsert({
    where: { email: "joao.silva@email.com" },
    update: {},
    create: {
      nome: "João Silva",
      email: "joao.silva@email.com",
      senha: senhaCliente,
      role: "cliente",
      telefone: "(11) 98765-4321",
      cpf: "123.456.789-00",
      conjuge: "Maria Silva",
      banco: "Caixa Econômica Federal",
    },
  });
  console.log("✅ Cliente criado:", cliente.email);

  // Financiamento do cliente demo
  const financiamento = await prisma.financiamento.upsert({
    where: { userId: cliente.id },
    update: {},
    create: {
      userId: cliente.id,
      statusGeral: "em_andamento",
    },
  });

  // Etapas do financiamento
  for (const etapa of ETAPAS_PADRAO) {
    const existing = await prisma.etapa.findFirst({
      where: { financiamentoId: financiamento.id, nome: etapa.nome },
    });
    if (!existing) {
      await prisma.etapa.create({
        data: {
          financiamentoId: financiamento.id,
          nome: etapa.nome,
          ordem: etapa.ordem,
          status: etapa.ordem === 1 ? "concluido" : etapa.ordem === 2 ? "em_andamento" : "aguardando",
          dataInicio: etapa.ordem <= 2 ? new Date(Date.now() - etapa.ordem * 7 * 24 * 60 * 60 * 1000) : null,
          dataConclusao: etapa.ordem === 1 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : null,
          observacoes: etapa.ordem === 1 ? "Aprovação realizada com sucesso pelo banco." : null,
        },
      });
    }
  }
  console.log("✅ Etapas criadas para:", cliente.nome);

  console.log("\n🎉 Seed concluído!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:    admin@portalfinancimento.com / admin123");
  console.log("Cliente:  joao.silva@email.com / cliente123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
