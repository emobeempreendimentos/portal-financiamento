// Constantes e helpers compartilhados entre API e UI da Lista de Tarefas.

export const PRIORIDADES = ["baixa", "media", "alta", "urgente"] as const;
export const STATUS = ["pendente", "em_andamento", "concluida"] as const;

export type Prioridade = (typeof PRIORIDADES)[number];
export type StatusTarefa = (typeof STATUS)[number];

export const PRIORIDADE_NIVEL: Record<Prioridade, number> = {
  baixa: 1,
  media: 2,
  alta: 3,
  urgente: 4,
};

export const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORIDADE_COR: Record<string, string> = {
  baixa: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  media: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  urgente: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

export const STATUS_COR: Record<string, string> = {
  pendente: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  em_andamento: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  concluida: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export const ORDENACOES = [
  { value: "recente", label: "Mais recente" },
  { value: "antiga", label: "Mais antiga" },
  { value: "prioridade", label: "Prioridade" },
  { value: "prazo", label: "Data limite" },
] as const;

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string | null;
  prioridade: string;
  prioridadeNivel: number;
  status: string;
  dataLimite?: string | null;
  hora?: string | null;
  concluidaEm?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Data de hoje no fuso local no formato YYYY-MM-DD. */
export function hojeISO(d = new Date()): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** Uma tarefa está vencida se tem prazo anterior a hoje e não foi concluída. */
export function estaVencida(t: Pick<Tarefa, "dataLimite" | "hora" | "status">): boolean {
  if (!t.dataLimite || t.status === "concluida") return false;
  const hoje = hojeISO();
  if (t.dataLimite < hoje) return true;
  if (t.dataLimite > hoje) return false;
  // Mesmo dia: vence se a hora informada já passou
  if (!t.hora) return false;
  const agora = new Date();
  const hhmm = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  return t.hora < hhmm;
}

/** Formata "YYYY-MM-DD" como dd/mm/aaaa sem sofrer com fuso. */
export function fmtData(iso?: string | null): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

/** Evento disparado após qualquer alteração, para sincronizar contador e dashboard. */
export const TAREFAS_CHANGED_EVENT = "tarefas:changed";

export function notificarMudancaTarefas() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TAREFAS_CHANGED_EVENT));
  }
}

/** Validação usada pelas rotas de criação/atualização. */
export function validarTarefa(body: {
  titulo?: unknown;
  prioridade?: unknown;
  status?: unknown;
  dataLimite?: unknown;
  hora?: unknown;
}): string | null {
  if (typeof body.titulo !== "string" || !body.titulo.trim()) {
    return "O título da tarefa é obrigatório";
  }
  if (body.titulo.trim().length > 200) {
    return "O título deve ter no máximo 200 caracteres";
  }
  if (body.prioridade != null && !PRIORIDADES.includes(body.prioridade as Prioridade)) {
    return "Prioridade inválida";
  }
  if (body.status != null && !STATUS.includes(body.status as StatusTarefa)) {
    return "Status inválido";
  }
  if (body.dataLimite && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.dataLimite))) {
    return "Data limite inválida";
  }
  if (body.hora && !/^\d{2}:\d{2}$/.test(String(body.hora))) {
    return "Hora inválida";
  }
  return null;
}
