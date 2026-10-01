"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LogIn } from "lucide-react";
import {
  AuthCardFooter, AuthCardHeader, AuthShell, Obrigatorio, authButton, authInput, authLabel,
} from "@/components/auth/AuthShell";

function CampoSenha({
  id, label, value, onChange, placeholder, autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={authLabel}>
        {label} <Obrigatorio />
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          autoFocus={autoFocus}
          required
          className={`${authInput} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function RedefinirSenhaForm() {
  const token = useSearchParams().get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não foi possível redefinir a senha.");
        return;
      }
      setSucesso(true);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#ba1d27]/20 text-[#ff9b9b]">
          <AlertCircle className="size-6" />
        </div>
        <AuthCardHeader
          eyebrow="Link inválido"
          titulo="Este link expirou"
          texto="O link de redefinição é inválido ou já foi usado. Peça um novo link de recuperação."
        />
        <Link href="/esqueci-senha" className={`${authButton} mt-7`}>
          Solicitar novo link
        </Link>
      </>
    );
  }

  if (sucesso) {
    return (
      <>
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#d9b06b]/15 text-[#d9b06b]">
          <CheckCircle2 className="size-6" />
        </div>
        <AuthCardHeader
          eyebrow="Tudo certo"
          titulo="Senha redefinida"
          texto="Sua nova senha foi salva. Agora é só entrar no portal com ela."
        />
        <Link href="/login" className={`${authButton} mt-7`}>
          <LogIn />
          Ir para o login
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthCardHeader
        eyebrow="Nova senha"
        titulo="Criar nova senha"
        texto="Escolha uma senha segura, com no mínimo 6 caracteres."
      />

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <CampoSenha id="nova" label="Nova senha" value={novaSenha} onChange={setNovaSenha} placeholder="Mínimo 6 caracteres" autoFocus />
        <div>
          <CampoSenha id="confirmar" label="Confirmar senha" value={confirmar} onChange={setConfirmar} placeholder="Repita a senha" />
          {confirmar && novaSenha !== confirmar && (
            <p className="mt-1.5 text-xs text-[#ff9b9b]">As senhas não coincidem</p>
          )}
        </div>

        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-[#ba1d27]/20 px-3.5 py-2.5 text-[13px] text-[#ff9b9b]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {erro}
          </p>
        )}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {loading ? "Salvando…" : "Salvar nova senha"}
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
  );
}

export default function RedefinirSenhaPage() {
  return (
    <AuthShell
      eyebrow="Recuperar acesso"
      titulo="Crie uma nova senha,"
      tituloItalico="segura e só sua."
      descricao="Use uma senha forte e única para proteger o acesso ao seu processo de financiamento."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/[0.04]" />}>
        <RedefinirSenhaForm />
      </Suspense>
      <AuthCardFooter />
    </AuthShell>
  );
}
