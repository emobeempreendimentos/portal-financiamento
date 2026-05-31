import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Emobe Empreendimentos <onboarding@resend.dev>";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://financiamento.emobe.com.br";

const STATUS_LABEL: Record<string, string> = {
  em_andamento: "Em Andamento",
  concluido: "Concluída",
};

const STATUS_COLOR: Record<string, string> = {
  em_andamento: "#f59e0b",
  concluido: "#22c55e",
};

const STATUS_MSG: Record<string, string> = {
  em_andamento: "foi iniciada e está em andamento.",
  concluido: "foi concluída com sucesso!",
};

function buildEmailHtml(clienteNome: string, etapaNome: string, status: string): string {
  const cor = STATUS_COLOR[status] || "#6b7280";
  const label = STATUS_LABEL[status] || status;
  const msg = STATUS_MSG[status] || "foi atualizada.";
  const logoUrl = `${SITE_URL}/logo.png`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Atualização no seu financiamento</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Logo -->
        <tr>
          <td style="background:#ffffff;padding:28px 32px 20px;border-bottom:1px solid #f0f0f0;text-align:left;">
            <img src="${logoUrl}" alt="Emobe Empreendimentos" height="48" style="display:block;height:48px;width:auto;" />
          </td>
        </tr>

        <!-- Título -->
        <tr>
          <td style="background:#18181b;padding:16px 32px;">
            <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;letter-spacing:0.02em;">
              Atualização no seu processo de financiamento
            </p>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#18181b;">
              Olá, ${clienteNome}!
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
              Seu processo de financiamento teve uma atualização. Veja o que mudou:
            </p>

            <!-- Card da etapa -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid ${cor};border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;">
                    Etapa atualizada
                  </p>
                  <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#18181b;">
                    ${etapaNome}
                  </p>
                  <span style="display:inline-block;background:${cor};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;letter-spacing:0.04em;">
                    ${label}
                  </span>
                  <p style="margin:10px 0 0;font-size:13px;color:#6b7280;">
                    A etapa <strong>${etapaNome}</strong> ${msg}
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              Acesse o portal para acompanhar o progresso completo do seu financiamento e ver todas as etapas em tempo real.
            </p>

            <!-- Botão CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:10px;background:#18181b;">
                  <a href="${SITE_URL}/dashboard"
                    style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">
                    Acessar meu processo →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divisor -->
        <tr>
          <td style="padding:0 32px;"><div style="border-top:1px solid #f0f0f0;"></div></td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="padding:20px 32px 28px;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
              Emobe Empreendimentos · <a href="mailto:contato@emobe.com.br" style="color:#9ca3af;">contato@emobe.com.br</a> · (37) 99925-1577
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              Você recebeu este email porque é cliente Emobe. Para dúvidas, entre em contato pelo WhatsApp.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEtapaNotification({
  clienteEmail,
  clienteNome,
  etapaNome,
  status,
}: {
  clienteEmail: string;
  clienteNome: string;
  etapaNome: string;
  status: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY não configurado — email não enviado.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: clienteEmail,
      subject: `Atualização no seu financiamento — ${etapaNome}`,
      html: buildEmailHtml(clienteNome, etapaNome, status),
    });
    console.log(`[email] Notificação enviada para ${clienteEmail} — etapa: ${etapaNome}`);
  } catch (err) {
    console.error("[email] Falha ao enviar notificação:", err);
    // Não propagar o erro — email é secundário, não pode quebrar a operação principal
  }
}
