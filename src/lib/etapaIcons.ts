import {
  BookOpen, FileCheck, FileSignature, KeyRound, PenLine, Receipt, ScrollText, Wrench,
} from "lucide-react";

/** Ícone de cada etapa (financiada e à vista). */
export const ETAPA_ICONS: Record<string, React.ElementType> = {
  "Aprovação": FileCheck,
  "Aprovação Engenharia": Wrench,
  "Assinatura de Contrato": PenLine,
  "Contrato de Compra e Venda": FileSignature,
  "ITBI": Receipt,
  "Escritura": ScrollText,
  "Registro": BookOpen,
  "Entrega das Chaves": KeyRound,
};

/** Nomes curtos para gráficos. */
export const ETAPA_ABREV: Record<string, string> = {
  "Aprovação Engenharia": "Apr. Eng.",
  "Assinatura de Contrato": "Contrato",
  "Contrato de Compra e Venda": "Contrato",
  "Entrega das Chaves": "Entrega",
};
