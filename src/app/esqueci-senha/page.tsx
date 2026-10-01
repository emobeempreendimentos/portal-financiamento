"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  AuthCardFooter, AuthCardHeader, AuthShell, Obrigatorio, authButton, authInput, authLabel,
} from "@/components/auth/AuthShell";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível processar o pedido.");
        return;
      }
      setEnviado(true);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Recuperar acesso"
      titulo="Esqueceu sua senha?"
      tituloItalico="A gente resolve."
      descricao="Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha em poucos segundos."
    >
      {enviado ? (
        <>
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#d9b06b]/15 text-[#d9b06b]">
            <CheckCircle2 className="size-6" />
          </div>
          <AuthCardHeader
            eyebrow="Link enviado"
            titulo="Confira seu e-mail"
            texto={
              <>
                Se existe uma conta com <strong className="font-medium text-white">{email}</strong>, você
                vai receber o link de redefinição em instantes. Olhe também a caixa de spam. O link expira
                em 1 hora.
              </>
            }
          />
          <Link href="/login" className={`${authButton} mt-7`}>
            <ArrowLeft />
            Voltar para o login
          </Link>
        </>
      ) : (
        <>
          <AuthCardHeader
            eyebrow="Recuperação de senha"
            titulo="Receber link por e-mail"
            texto="Use o mesmo e-mail com que você entra no portal."
          />

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className={authLabel}>
                E-mail <Obrigatorio />
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                autoFocus
                required
                className={authInput}
              />
            </div>

            {erro && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-[#ba1d27]/20 px-3.5 py-2.5 text-[13px] text-[#ff9b9b]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {erro}
              </p>
            )}

            <button type="submit" disabled={loading} className={authButton}>
              {loading ? <Loader2 className="animate-spin" /> : <Send />}
              {loading ? "Enviando…" : "Enviar link de recuperação"}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 text-[13px] text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Voltar para o login
          </Link>
        </>
      )}

      <AuthCardFooter />
    </AuthShell>
  );
}
