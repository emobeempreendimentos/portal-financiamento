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
  protocolo: number;
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

export interface CorretorParticipante {
  id: string;
  comissaoId: string;
  nome: string;
  creci?: string | null;
  percentual?: number | null;
  valor?: number | null;
}

export interface ComissaoImobiliaria {
  id: string;
  financeiroVendaId: string;
  percentual?: number | null;
  valor?: number | null;
  dataPrevistaRecebimento?: string | null;
  dataEfetivaRecebimento?: string | null;
  status: string;
  houveAdiantamento: boolean;
  valorAdiantado?: number | null;
  dataAdiantamento?: string | null;
  obsAdiantamento?: string | null;
  houveDivisao: boolean;
  percentualPrincipal?: number | null;
  createdAt: string;
  updatedAt: string;
  corretores?: CorretorParticipante[];
}

export interface HistoricoFinanceiro {
  id: string;
  financeiroVendaId: string;
  descricao: string;
  usuario: string;
  createdAt: string;
}

export interface FinanceiroVenda {
  id: string;
  financiamentoId: string;
  tipoVenda: string;
  valorImovel?: number | null;
  dataVenda?: string | null;
  statusVenda: string;
  sinalValor?: number | null;
  sinalData?: string | null;
  sinalFormaPagamento?: string | null;
  sinalStatus?: string | null;
  escrituraValorRestante?: number | null;
  escrituraDataPrevista?: string | null;
  escrituraDataQuitacao?: string | null;
  escrituraStatus?: string | null;
  entradaValor?: number | null;
  entradaData?: string | null;
  entradaFormaPagamento?: string | null;
  usouFgts: boolean;
  fgtsValor?: number | null;
  bancoFinanciador?: string | null;
  valorFinanciado?: number | null;
  contratoDataAssinatura?: string | null;
  contratoStatus?: string | null;
  valorLiberadoBanco?: number | null;
  dataLiberacaoBanco?: string | null;
  createdAt: string;
  updatedAt: string;
  comissao?: ComissaoImobiliaria | null;
  historico?: HistoricoFinanceiro[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  nome: string;
}

export interface Simulacao {
  id: string;
  // Cliente
  clienteNome: string;
  clienteCpf: string;
  clienteRenda: number;
  clienteDataNascimento: string;
  clienteDependentes: boolean;
  clienteTemaFgts: boolean;
  clienteValorFgts?: number | null;
  // Simulação
  tipoFinanciamento: "mcmv" | "sbpe";
  tipoImovel: "novo" | "usado" | "lote_construcao" | "lote";
  valorImovel: number;
  valorEntrada: number;
  valorParcelaInicial: number;
  valorParcelaFinal: number;
  prazo: number;
  prazoPeriodo: "anos" | "meses";
  taxaJuros: number;
  taxaPeriodo: "ano" | "mes";
  sistemaAmortizacao: "price" | "sac";
  // Observações
  observacoes: string;
  // Metadados
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
