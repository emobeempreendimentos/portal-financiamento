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
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 text-white flex-col justify-between p-12 relative overflow-hidden"
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
            alt="Casa moderna em condomínio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/75 to-zinc-950/85" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="h-5 w-5 text-green-400" />
          </div>
          <span className="font-bold text-xl">Portal do Financiamento</span>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl font-bold leading-tight"
          >
            Acompanhe seu{" "}
            <span className="text-green-400">financiamento</span>{" "}
            em tempo real
          </motion.h1>
          <p className="text-zinc-300 text-lg leading-relaxed">
            Transparência total em cada etapa do seu processo imobiliário.
            Do contrato à entrega das chaves.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Etapas monitoradas", value: "6" },
              { label: "Atualização", value: "Real-time" },
              { label: "Notificações", value: "Automáticas" },
              { label: "Suporte", value: "24/7" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-zinc-900/60 backdrop-blur-sm p-4 border border-zinc-700/50">
                <div className="text-2xl font-bold text-green-400">{item.value}</div>
                <div className="text-sm text-zinc-300 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-zinc-500 text-sm">
          © {new Date().getFullYear()} Portal do Financiamento. Todos os direitos reservados.
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
            <span className="font-bold text-zinc-900 dark:text-white">Portal do Financiamento</span>
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
