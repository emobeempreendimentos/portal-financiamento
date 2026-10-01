"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  AuthCardFooter, AuthCardHeader, AuthShell, Obrigatorio, authButton, authInput, authLabel,
} from "@/components/auth/AuthShell";

export function LoginForm() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "E-mail ou senha incorretos.");
        return;
      }

      addToast({ title: `Bem-vindo, ${data.data.nome}!`, variant: "success" });
      window.location.href = data.data.role === "admin" ? "/admin" : "/dashboard";
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Portal de financiamento"
      titulo="O seu financiamento,"
      tituloItalico="acompanhado de perto."
      descricao="Aprovação, engenharia, contrato, ITBI, registro e entrega das chaves em um único lugar. Cada etapa atualizada em tempo real pela equipe Emobe."
      mostrarModulos
    >
      <AuthCardHeader
        eyebrow="Acesso do cliente"
        titulo="Entrar no portal"
        texto="Use o e-mail e a senha que a Emobe enviou para você acompanhar o seu processo de financiamento."
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
            autoComplete="username"
            required
            className={authInput}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="senha" className={authLabel.replace("mb-2 ", "")}>
              Senha <Obrigatorio />
            </label>
            <Link href="/esqueci-senha" className="text-xs text-white/55 transition-colors hover:text-white">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <input
              id="senha"
              type={showSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
              className={`${authInput} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowSenha((v) => !v)}
              aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              {showSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-[#ba1d27]/20 px-3.5 py-2.5 text-[13px] text-[#ff9b9b]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {erro}
          </p>
        )}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
          {loading ? "Verificando…" : "Entrar"}
        </button>
      </form>

      <AuthCardFooter />
    </AuthShell>
  );
}
