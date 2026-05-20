"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function NovoClientePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", telefone: "",
    cpf: "", conjuge: "", banco: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar cliente");
      addToast({ title: "Cliente criado com sucesso!", variant: "success" });
      router.push(`/admin/clientes/${data.data.id}`);
    } catch (err) {
      addToast({
        title: "Erro ao criar cliente",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Novo Cliente</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Cadastrar cliente e iniciar financiamento</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5"
      >
        <div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Dados Pessoais
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input id="nome" name="nome" required value={form.nome} onChange={handleChange} placeholder="João da Silva" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conjuge">Nome do Cônjuge</Label>
              <Input id="conjuge" name="conjuge" value={form.conjuge} onChange={handleChange} placeholder="Opcional" />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Acesso ao Sistema
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="joao@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="senha">Senha *</Label>
              <div className="relative">
                <Input
                  id="senha" name="senha" type={showSenha ? "text" : "password"}
                  required value={form.senha} onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Dados do Financiamento
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="banco">Banco Financiador</Label>
            <Input id="banco" name="banco" value={form.banco} onChange={handleChange} placeholder="Ex: Caixa Econômica Federal" />
          </div>
        </div>

        <Button type="submit" variant="neon" className="w-full" disabled={loading}>
          <UserPlus className="h-4 w-4 mr-2" />
          {loading ? "Criando..." : "Criar Cliente"}
        </Button>
      </motion.form>
    </div>
  );
}
