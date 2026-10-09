// Tipo de venda do processo: financiada (banco) ou à vista. Define as etapas e os textos exibidos.

export type TipoVenda = "financiamento" | "avista";

export const TIPOS_VENDA: TipoVenda[] = ["financiamento", "avista"];

export const ETAPAS_POR_TIPO: Record<TipoVenda, string[]> = {
  financiamento: [
    "Aprovação",
    "Aprovação Engenharia",
    "Assinatura de Contrato",
    "ITBI",
    "Registro",
    "Entrega das Chaves",
  ],
  avista: [
    "Contrato de Compra e Venda",
    "ITBI",
    "Escritura",
    "Registro",
    "Entrega das Chaves",
  ],
};

/** Todas as etapas existentes, na ordem em que aparecem nos gráficos gerais. */
export const ETAPAS_TODAS = [
  "Aprovação",
  "Aprovação Engenharia",
  "Assinatura de Contrato",
  "Contrato de Compra e Venda",
  "ITBI",
  "Escritura",
  "Registro",
  "Entrega das Chaves",
];

export function normalizarTipo(v: unknown): TipoVenda {
  return v === "avista" ? "avista" : "financiamento";
}

export function etapasDoTipo(tipo: unknown) {
  return ETAPAS_POR_TIPO[normalizarTipo(tipo)].map((nome, i) => ({ nome, ordem: i + 1 }));
}

interface Textos {
  /** Nome curto do tipo ("Financiada" / "À vista"). */
  rotulo: string;
  /** "o seu financiamento" / "a sua compra" — com artigo, para frases. */
  oSeu: string;
  /** "seu financiamento" / "sua compra" */
  seu: string;
  /** "Financiamento" / "Compra" — para títulos. */
  titulo: string;
  /** "processo de financiamento" / "processo de compra" */
  processo: string;
  /** "do Financiamento" / "da Compra" — para títulos como "Etapas do Financiamento". */
  doTitulo: string;
}

export const TEXTOS_TIPO: Record<TipoVenda, Textos> = {
  financiamento: {
    rotulo: "Financiada",
    oSeu: "o seu financiamento",
    seu: "seu financiamento",
    titulo: "Financiamento",
    processo: "processo de financiamento",
    doTitulo: "do Financiamento",
  },
  avista: {
    rotulo: "À vista",
    oSeu: "a sua compra",
    seu: "sua compra",
    titulo: "Compra",
    processo: "processo de compra",
    doTitulo: "da Compra",
  },
};

export function textosTipo(tipo: unknown): Textos {
  return TEXTOS_TIPO[normalizarTipo(tipo)];
}
