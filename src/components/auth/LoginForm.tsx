"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export function LoginForm() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({ title: data.error || "Credenciais inválidas", variant: "error" });
        return;
      }

      addToast({ title: `Bem-vindo, ${data.data.nome}!`, variant: "success" });

      window.location.href = data.data.role === "admin" ? "/admin" : "/dashboard";
    } catch {
      addToast({ title: "Erro de conexão", description: "Verifique sua internet", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — branded */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 text-white flex-col justify-between p-12 relative overflow-hidden bg-zinc-950"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-green-500/8 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-green-500/6 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-green-500/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-green-500/8" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-green-400" />
          </div>
          <span className="font-bold text-lg tracking-tight">Emobe Empreendimentos</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-bold leading-tight">
              Seu financiamento,{" "}
              <span className="text-green-400">transparente</span>{" "}
              do início ao fim
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              Acompanhe cada etapa do seu processo imobiliário em tempo real. Do contrato à entrega das chaves.
            </p>
          </motion.div>

          {/* Process steps */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-2"
          >
            {[
              { step: "01", label: "Aprovação do crédito" },
              { step: "02", label: "Aprovação de engenharia" },
              { step: "03", label: "Assinatura de contrato" },
              { step: "04", label: "ITBI e registro" },
              { step: "05", label: "Registro em cartório" },
              { step: "06", label: "Entrega das chaves" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors
                  ${i < 3 ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700"}`}>
                  {i < 3 ? "✓" : item.step}
                </div>
                <div className={`h-px flex-1 ${i < 2 ? "bg-green-500/40" : "bg-zinc-800"}`} />
                <span className={`text-xs ${i < 3 ? "text-green-400 font-medium" : "text-zinc-500"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="relative z-10 text-zinc-600 text-xs">
          © {new Date().getFullYear()} Emobe Empreendimentos. Todos os direitos reservados.
        </p>
      </motion.div>

      {/* Right panel - Login form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-zinc-950"
      >
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-green-400" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">Portal de Financiamento Emobe</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="Emobe Empreendimentos Imobiliários"
              className="h-20 w-auto object-contain mb-4"
            />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Entrar na sua conta</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
              Use seu email e senha para acessar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <Link
                  href="/esqueci-senha"
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="senha"
                  type={showSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="neon"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
