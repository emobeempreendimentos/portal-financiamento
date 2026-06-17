import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetEmail(to: string, nome: string, resetUrl: string) {
  const fromName = process.env.SMTP_FROM_NAME || "Portal Emobe";
  const fromAddr = process.env.SMTP_FROM || "noreply@emobe.com.br";

  await resend.emails.send({
    from: `${fromName} <${fromAddr}>`,
    to,
    subject: "Recuperação de senha — Portal de Financiamento Emobe",
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#18181b;padding:28px 32px;">
          <p style="color:#22c55e;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px;">Portal de Financiamento</p>
          <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Emobe Empreendimentos</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#18181b;font-size:17px;font-weight:600;margin:0 0 8px;">Olá, ${nome} 👋</p>
          <p style="color:#71717a;font-size:14px;line-height:1.7;margin:0 0 28px;">
            Recebemos uma solicitação para redefinir a senha da sua conta no Portal de Financiamento.
            Clique no botão abaixo para criar uma nova senha:
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#22c55e;color:#ffffff;font-size:14px;font-weight:600;
                    text-decoration:none;padding:14px 28px;border-radius:10px;letter-spacing:.01em;">
            Redefinir minha senha
          </a>
          <p style="color:#a1a1aa;font-size:12px;margin:28px 0 0;line-height:1.6;">
            Este link expira em <strong style="color:#71717a;">1 hora</strong>.
            Se você não solicitou a troca de senha, ignore este email — sua conta permanece segura.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f4f4f5;">
          <p style="color:#a1a1aa;font-size:11px;margin:0;line-height:1.5;">
            Emobe Empreendimentos Imobiliários · contato@emobe.com.br
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
