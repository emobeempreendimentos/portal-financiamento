import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EtapaStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function daysSince(date: string | Date | null | undefined): number {
  if (!date) return 0;
  const d = typeof date === "string" ? parseISO(date) : date;
  return differenceInDays(new Date(), d);
}

export function daysBetween(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): number {
  if (!start || !end) return 0;
  const s = typeof start === "string" ? parseISO(start) : start;
  const e = typeof end === "string" ? parseISO(end) : end;
  return differenceInDays(e, s);
}

export function calcularProgresso(etapas: { status: EtapaStatus }[]): number {
  if (!etapas || etapas.length === 0) return 0;
  const concluidas = etapas.filter((e) => e.status === "concluido").length;
  return Math.round((concluidas / etapas.length) * 100);
}

export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export function getStatusLabel(status: EtapaStatus): string {
  const labels: Record<EtapaStatus, string> = {
    aguardando: "Aguardando",
    em_andamento: "Em Andamento",
    concluido: "Concluído",
  };
  return labels[status];
}

export function getStatusColor(status: EtapaStatus): string {
  const colors: Record<EtapaStatus, string> = {
    aguardando: "text-gray-500",
    em_andamento: "text-blue-600",
    concluido: "text-green-600",
  };
  return colors[status];
}

export function getInitials(nome: string): string {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
