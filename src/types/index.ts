export type UserRole = "admin" | "cliente";

export type EtapaStatus = "aguardando" | "em_andamento" | "concluido";

export type StatusGeral = "em_andamento" | "concluido" | "pausado";

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  conjuge?: string | null;
  banco?: string | null;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Etapa {
  id: string;
  financiamentoId: string;
  nome: string;
  ordem: number;
  status: EtapaStatus;
  observacoes?: string | null;
  observacoesInternas?: string | null;
  dataInicio?: string | null;
  dataConclusao?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Historico {
  id: string;
  financiamentoId: string;
  campo: string;
  valorAnterior?: string | null;
  valorNovo?: string | null;
  descricao: string;
  criadoPor: string;
  createdAt: string;
}

export interface Financiamento {
  id: string;
  userId: string;
  statusGeral: StatusGeral;
  createdAt: string;
  updatedAt: string;
  user?: User;
  etapas?: Etapa[];
  historico?: Historico[];
}

export interface FinanciamentoComDetalhes extends Financiamento {
  user: User;
  etapas: Etapa[];
  historico: Historico[];
}

export interface AdminStats {
  totalClientes: number;
  emAprovacao: number;
  concluidos: number;
  tempoMedioDias: number;
  pendenciasAbertas: number;
}

export interface Pendencia {
  id: string;
  financiamentoId: string;
  descricao: string;
  status: "aberta" | "concluida";
  criadoEm: string;
  concluidoEm?: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  nome: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
