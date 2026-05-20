"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, CreditCard, UserCheck, Building, Save, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { formatCPF, getInitials } from "@/lib/utils";
import { User as UserType } from "@/types";

interface ClientInfoProps {
  user: UserType;
  onUpdate: (data: Partial<UserType>) => Promise<void>;
}

export function ClientInfo({ user, onUpdate }: ClientInfoProps) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [telefone, setTelefone] = useState(user.telefone || "");
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate({ email, telefone });
      addToast({ title: "Dados atualizados!", variant: "success" });
      setEditing(false);
    } catch {
      addToast({ title: "Erro ao salvar", description: "Tente novamente", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const infoItems = [
    { icon: CreditCard, label: "CPF", value: user.cpf ? formatCPF(user.cpf) : "—" },
    { icon: UserCheck, label: "Cônjuge", value: user.conjuge || "—" },
    { icon: Building, label: "Banco Financiador", value: user.banco || "—" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-green-500/20"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.nome} className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              getInitials(user.nome)
            )}
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{user.nome}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{user.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (editing) {
              setEmail(user.email);
              setTelefone(user.telefone || "");
            }
            setEditing(!editing);
          }}
        >
          {editing ? <X className="h-4 w-4 mr-1.5" /> : <Pencil className="h-4 w-4 mr-1.5" />}
          {editing ? "Cancelar" : "Editar"}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Editable fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-500 uppercase tracking-wide">
              <Mail className="h-3 w-3" /> Email
            </Label>
            {editing ? (
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            ) : (
              <p className="text-sm font-medium text-zinc-900 dark:text-white py-2">{user.email}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-500 uppercase tracking-wide">
              <Phone className="h-3 w-3" /> Telefone
            </Label>
            {editing ? (
              <Input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            ) : (
              <p className="text-sm font-medium text-zinc-900 dark:text-white py-2">{user.telefone || "—"}</p>
            )}
          </div>
        </div>

        {/* Static fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {infoItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-500 uppercase tracking-wide">
                <item.icon className="h-3 w-3" /> {item.label}
              </Label>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="neon"
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
