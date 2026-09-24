// Tipos e helpers compartilhados do Quadro de Processos e do alerta de processo parado.

export const PROCESSOS_CHANGED_EVENT = "processos:changed";

export const ETAPAS_ORDEM = [
  "Aprovação",
  "Aprovação Engenharia",
  "Assinatura de Contrato",
  "ITBI",
  "Registro",
  "Entrega das Chaves",
] as const;

export interface ProcessoEtapa {
  id: string;
  nome: string;
  ordem: number;
  status: "aguardando" | "em_andamento" | "concluido";
}

export interface Processo {
  financiamentoId: string;
  userId: string;
  nome: string;
  protocolo: number;
  banco: string | null;
  statusGeral: "em_andamento" | "pausado";
  etapas: ProcessoEtapa[];
  etapaAtual: { id: string; nome: string; ordem: number } | null;
  /** Data (ISO) da última movimentação: início da etapa atual ou último registro no histórico. */
  ultimaMovimentacao: string;
}

export function diasDesde(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

// Limite (em dias) para considerar um processo parado — preferência local do admin.
const LIMITE_KEY = "processos_limite_parado";
export const LIMITE_PADRAO = 7;
export const LIMITES_OPCOES = [3, 5, 7, 10, 15, 30];

export function lerLimiteParado(): number {
  try {
    const v = Number(localStorage.getItem(LIMITE_KEY));
    return LIMITES_OPCOES.includes(v) ? v : LIMITE_PADRAO;
  } catch {
    return LIMITE_PADRAO;
  }
}

export function salvarLimiteParado(dias: number) {
  try {
    localStorage.setItem(LIMITE_KEY, String(dias));
  } catch { /* sem armazenamento local */ }
  window.dispatchEvent(new Event(PROCESSOS_CHANGED_EVENT));
}

/** Processos em andamento (pausados não contam) sem movimentação há `limite` dias ou mais. */
export function processosParados(processos: Processo[], limite: number): (Processo & { dias: number })[] {
  return processos
    .filter((p) => p.statusGeral === "em_andamento")
    .map((p) => ({ ...p, dias: diasDesde(p.ultimaMovimentacao) }))
    .filter((p) => p.dias >= limite)
    .sort((a, b) => b.dias - a.dias);
}

export function fmtProtocolo(n: number) {
  return `EMB-${String(n).padStart(5, "0")}`;
}
