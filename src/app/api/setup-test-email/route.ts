import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// GET /api/setup-test-email?to=email@exemplo.com — teste de envio (uso único)
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Passe ?to=seu@email.com na URL" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurada no Vercel" }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: "Emobe Empreendimentos <onboarding@resend.dev>",
      to,
      subject: "Teste de email — Portal Emobe",
      html: "<p>Email de teste enviado com sucesso pelo Portal de Financiamento da Emobe! ✅</p>",
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
