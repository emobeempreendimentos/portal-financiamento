export type UserRole = "admin" | "cliente";

export type EtapaStatus = "aguardando" | "em_andamento" | "concluido";

export type StatusGeral = "em_andamento" | "concluido" | "pausado" | "cancelado";

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  conjuge?: string | null;
  conjugeCpf?: string | null;
  conjugeEmail?: string | null;
  conjugeTelefone?: string | null;
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

export interface Avaliacao {
  id: string;
  financiamentoId: string;
  nota: number;
  recomendaria: boolean;
  comentario?: string | null;
  createdAt: string;
}

export interface AvaliacaoComCliente extends Avaliacao {
  financiamento: {
    user: Pick<User, "id" | "nome" | "email">;
  };
}

export interface Financiamento {
  id: string;
  userId: string;
  statusGeral: StatusGeral;
  motivoCancelamento?: string | null;
  concluidoEm?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  etapas?: Etapa[];
  historico?: Historico[];
  avaliacao?: Avaliacao | null;
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

export interface Documento {
  id: string;
  financiamentoId: string;
  nome: string;
  tipo: string;
  tamanho: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Pendencia {
  id: string;
  financiamentoId: string;
  descricao: string;
  status: "aberta" | "concluida";
  criadoEm: string;
  concluidoEm?: string | null;
}

export interface LancamentoFinanceiro {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria: string;
  data: string;
  formaPagamento?: string | null;
  parcelas?: number | null;
  observacao?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalLancamentos: number;
}

export interface GraficoMes {
  label: string;
  receitas: number;
  despesas: number;
}

export interface LancamentoPessoal {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria: string;
  data: string;
  formaPagamento?: string | null;
  parcelas?: number | null;
  observacao?: string | null;
  createdAt: string;
  updatedAt: string;
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
