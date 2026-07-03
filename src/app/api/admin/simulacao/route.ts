import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // TODO: Salvar simulação no banco de dados quando a estrutura estiver pronta
    // Por enquanto, apenas validar e retornar sucesso

    if (!body.clienteNome?.trim()) {
      return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });
    }

    // Retornar sucesso
    return NextResponse.json({
      success: true,
      data: {
        id: `sim_${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao salvar simulação:", error);
    return NextResponse.json({ error: "Erro ao salvar simulação" }, { status: 500 });
  }
}
