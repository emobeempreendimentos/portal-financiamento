"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn, getStatusLabel, formatDate, daysSince, daysBetween } from "@/lib/utils";
import { Etapa, EtapaStatus } from "@/types";

interface EditStepFormProps {
  etapa: Etapa;
  onUpdate: (etapaId: string, data: Partial<Etapa>) => Promise<void>;
}

export function EditStepForm({ etapa, onUpdate }: EditStepFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(etapa.status);
  const [observacoes, setObservacoes] = useState(etapa.observacoes || "");
  const [obsInternas, setObsInternas] = useState(etapa.observacoesInternas || "");
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const diasNaEtapa = etapa.status === "concluido"
    ? daysBetween(etapa.dataInicio, etapa.dataConclusao)
    : etapa.status === "em_andamento"
    ? daysSince(etapa.dataInicio)
    : null;

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(etapa.id, { status, observacoes, observacoesInternas: obsInternas });
      addToast({ title: `Etapa "${etapa.nome}" atualizada!`, variant: "success" });
      setExpanded(false);
    } catch {
      addToast({ title: "Erro ao salvar etapa", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const statusBadge: Record<EtapaStatus, "secondary" | "info" | "success"> = {
    aguardando: "secondary",
    em_andamento: "info",
    concluido: "success",
  };

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-200",
      etapa.status === "concluido"
        ? "border-green-100 dark:border-green-900/30"
        : etapa.status === "em_andamento"
        ? "border-blue-100 dark:border-blue-900/30"
        : "border-zinc-100 dark:border-zinc-800"
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
            etapa.status === "concluido"
              ? "bg-green-500 text-white"
              : etapa.status === "em_andamento"
              ? "bg-blue-500 text-white"
              : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
          )}>
            {etapa.ordem}
          </div>
          <div>
            <p className="font-medium text-sm text-zinc-900 dark:text-white">{etapa.nome}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={statusBadge[etapa.status]} className="text-xs">
                {getStatusLabel(etapa.status)}
              </Badge>
              {diasNaEtapa !== null && (
                <span className="text-xs text-zinc-400">
                  {diasNaEtapa} dia(s)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {etapa.dataInicio && (
            <span className="hidden sm:block text-xs text-zinc-400">{formatDate(etapa.dataInicio)}</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EtapaStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 text-xs text-zinc-500">
              <p>Início: {formatDate(etapa.dataInicio)}</p>
              <p>Conclusão: {formatDate(etapa.dataConclusao)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Unlock className="h-3 w-3 text-zinc-400" /> Observações (visíveis ao cliente)
            </Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informação visível ao cliente..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-zinc-400" /> Observações Internas (somente admin)
            </Label>
            <Textarea
              value={obsInternas}
              onChange={(e) => setObsInternas(e.target.value)}
              placeholder="Nota interna..."
              rows={2}
            />
          </div>

          <Button variant="neon" className="w-full" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Etapa"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
