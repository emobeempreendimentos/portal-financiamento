"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Building2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

function RedefinirSenhaForm() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) {
      addToast({ title: "Link inválido ou expirado", variant: "error" });
    }
  }, [token, addToast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (novaSenha.length < 6) {
      addToast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "error" });
      return;
    }

    if (novaSenha !== confirmar) {
      addToast({ title: "As senhas não coincidem", variant: "error" });
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
        addToast({ title: data.error || "Erro ao redefinir senha", variant: "error" });
        return;
      }
      setSucesso(true);
    } catch {
      addToast({ title: "Erro de conexão", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Link inválido</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
            Este link de redefinição é inválido ou expirou.
            Solicite um novo link de recuperação.
          </p>
        </div>
        <Link href="/esqueci-senha">
          <Button variant="neon" className="w-full">Solicitar novo link</Button>
        </Link>
      </div>
    );
  }

  if (sucesso) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center space-y-5"
      >
        <div className="h-16 w-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Senha redefinida!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
            Sua nova senha foi salva com sucesso. Agora você pode entrar na sua conta.
          </p>
        </div>
        <Link href="/login">
          <Button variant="neon" className="w-full">Ir para o login</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-green-400" />
        </div>
        <span className="font-bold text-zinc-900 dark:text-white">Portal do Financiamento</span>
      </div>

      <div className="flex flex-col items-center text-center">
        <img src="/logo.png" alt="Emobe" className="h-20 w-auto object-contain mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Nova senha</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
          Escolha uma senha segura com no mínimo 6 caracteres
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nova">Nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="nova"
              type={showNova ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="pl-10 pr-10"
              required
              autoFocus
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNova(!showNova)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {showNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmar">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="confirmar"
              type={showConfirmar ? "text" : "password"}
              placeholder="Repita a senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="pl-10 pr-10"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmar(!showConfirmar)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmar && novaSenha !== confirmar && (
            <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
          )}
        </div>

        <Button type="submit" variant="neon" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
          ) : (
            "Salvar nova senha"
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Painel esquerdo */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-zinc-950 text-white flex-col justify-between p-12"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-green-400" />
          </div>
          <span className="font-bold text-xl">Portal do Financiamento</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Crie uma nova{" "}
            <span className="text-green-400">senha segura</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Use uma senha forte e única para proteger o acesso ao seu processo de financiamento.
          </p>
        </div>
        <p className="text-zinc-600 text-sm">
          © {new Date().getFullYear()} Portal do Financiamento. Todos os direitos reservados.
        </p>
      </motion.div>

      {/* Painel direito */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-zinc-950"
      >
        <Suspense fallback={<div className="text-zinc-400 text-sm">Carregando...</div>}>
          <RedefinirSenhaForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
