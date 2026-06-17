"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: data.error || "Erro ao processar", variant: "error" });
        return;
      }
      setEnviado(true);
    } catch {
      addToast({ title: "Erro de conexão", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

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
          <span className="font-bold text-xl">Portal de Financiamento Emobe</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Esqueceu sua{" "}
            <span className="text-green-400">senha?</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Sem problemas. Informe seu email e enviaremos um link para você criar uma nova senha em segundos.
          </p>
        </div>
        <p className="text-zinc-600 text-sm">
          © {new Date().getFullYear()} Portal de Financiamento Emobe. Todos os direitos reservados.
        </p>
      </motion.div>

      {/* Painel direito */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-zinc-950"
      >
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-green-400" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">Portal de Financiamento Emobe</span>
          </div>

          {enviado ? (
            /* Estado de sucesso */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5"
            >
              <div className="h-16 w-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Email enviado!</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
                  Se existe uma conta com <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong>,
                  você receberá um link de redefinição em instantes.
                  Verifique também a caixa de spam.
                </p>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                O link expira em 1 hora.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </motion.div>
          ) : (
            /* Formulário */
            <>
              <div className="flex flex-col items-center text-center">
                <img
                  src="/logo.png"
                  alt="Emobe"
                  className="h-20 w-auto object-contain mb-4"
                />
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Recuperar senha</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                  Informe seu email para receber o link de redefinição
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
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" variant="neon" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
