import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";

const GREEN: [number, number, number] = [132, 188, 73];
const DARK: [number, number, number] = [24, 24, 27];
const CARD: [number, number, number] = [246, 247, 248];
const GRAY: [number, number, number] = [113, 113, 122];

const fmtBRL = (v: number) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── valor por extenso (pt-BR) ──
function extenso(v: number): string {
  if (!v || v <= 0) return "zero reais";
  const uni = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const especial = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dez = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const cem = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  const ateMil = (n: number): string => {
    if (n === 0) return "";
    if (n === 100) return "cem";
    let s = "";
    const c = Math.floor(n / 100);
    const r = n % 100;
    if (c > 0) s += cem[c];
    if (r > 0) {
      if (s) s += " e ";
      if (r < 10) s += uni[r];
      else if (r < 20) s += especial[r - 10];
      else {
        s += dez[Math.floor(r / 10)];
        if (r % 10 > 0) s += " e " + uni[r % 10];
      }
    }
    return s;
  };

  const grupo = (n: number): string => {
    const mi = Math.floor(n / 1_000_000);
    const mil = Math.floor((n % 1_000_000) / 1000);
    const r = n % 1000;
    const p: string[] = [];
    if (mi > 0) p.push(mi === 1 ? "um milhão" : ateMil(mi) + " milhões");
    if (mil > 0) p.push(mil === 1 ? "mil" : ateMil(mil) + " mil");
    if (r > 0) p.push(ateMil(r));
    return p.join(" e ");
  };

  const inteiro = Math.floor(v);
  const centavos = Math.round((v - inteiro) * 100);
  let s = "";
  if (inteiro > 0) s += grupo(inteiro) + (inteiro === 1 ? " real" : " reais");
  if (centavos > 0) {
    if (s) s += " e ";
    s += grupo(centavos) + (centavos === 1 ? " centavo" : " centavos");
  }
  return s;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recebedorNome,
      recebedorTipoDoc,
      recebedorDoc,
      pagadorNome,
      pagadorTipoDoc,
      pagadorDoc,
      valor,
      referente,
      imovelMatricula,
      formaPagamento,
      cidade,
      data,
      numero,
    } = body;

    const valorNum = Number(valor) || 0;
    const recLabel = (recebedorTipoDoc === "cnpj" ? "CNPJ" : "CPF");
    const pagLabel = (pagadorTipoDoc === "cnpj" ? "CNPJ" : "CPF");
    const formaMap: Record<string, string> = {
      dinheiro: "Dinheiro", pix: "PIX", transferencia: "Transferência bancária",
      cheque: "Cheque", cartao: "Cartão", outro: "Outro",
    };
    const formaLabel = formaPagamento ? (formaMap[formaPagamento] || formaPagamento) : "";
    const numeroFmt = numero ? `Nº ${String(numero).padStart(4, "0")}` : "";

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const M = 20;
    const contentW = pageWidth - M * 2;

    const dataFmt = data
      ? new Date(data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    // ── Cabeçalho moderno (faixa escura) ──
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageWidth, 42, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, 42, pageWidth, 1.6, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text("RECIBO", M, 26);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(190, 190, 198);
    doc.text("DE PAGAMENTO", M, 33);

    if (numeroFmt) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...GREEN);
      doc.text(numeroFmt, pageWidth - M, 24, { align: "right" });
    }
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(190, 190, 198);
    doc.text(dataFmt, pageWidth - M, 33, { align: "right" });

    // ── Card do valor ──
    let y = 58;
    doc.setFillColor(...CARD);
    doc.roundedRect(M, y, contentW, 26, 4, 4, "F");
    doc.setFillColor(...GREEN);
    doc.roundedRect(M, y, 3, 26, 1.5, 1.5, "F");
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("VALOR RECEBIDO", M + 10, y + 9);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...DARK);
    doc.text(fmtBRL(valorNum), M + 10, y + 19);
    if (formaLabel) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text("FORMA DE PAGAMENTO", pageWidth - M - 10, y + 9, { align: "right" });
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text(formaLabel, pageWidth - M - 10, y + 18, { align: "right" });
    }
    y += 26 + 12;

    // ── Partes (duas colunas) ──
    const colW = (contentW - 6) / 2;
    const drawParte = (x: number, rotulo: string, nome: string, docn: string, docLabel: string) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...GREEN);
      doc.text(rotulo, x, y);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...DARK);
      doc.text(nome || "—", x, y + 7);
      if (docn) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...GRAY);
        doc.text(`${docLabel}: ${docn}`, x, y + 12.5);
      }
    };
    drawParte(M, "RECEBI DE (PAGADOR)", pagadorNome, pagadorDoc, pagLabel);
    drawParte(M + colW + 6, "RECEBEDOR (DECLARANTE)", recebedorNome, recebedorDoc, recLabel);
    y += 22;

    // Divisória
    doc.setDrawColor(...CARD);
    doc.setLineWidth(0.6);
    doc.line(M, y, pageWidth - M, y);
    y += 14;

    // ── Corpo ──
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(...DARK);

    let corpo = `Declaro, para os devidos fins, que recebi de ${pagadorNome}${pagadorDoc ? ` (${pagLabel} ${pagadorDoc})` : ""} a importância de ${fmtBRL(valorNum)} (${extenso(valorNum)})`;
    if (referente) corpo += `, referente a ${referente}`;
    if (imovelMatricula) corpo += `, relativo ao imóvel de matrícula nº ${imovelMatricula}`;
    corpo += ".";

    const linhas = doc.splitTextToSize(corpo, contentW);
    doc.text(linhas, M, y, { lineHeightFactor: 1.7 });
    y += linhas.length * 7.6 + 8;

    doc.setTextColor(...GRAY);
    doc.setFontSize(10.5);
    doc.text(
      doc.splitTextToSize(
        "Para maior clareza e como prova de quitação, firmo o presente recibo, dando plena e total quitação do valor acima descrito.",
        contentW
      ),
      M, y, { lineHeightFactor: 1.7 }
    );
    y += 24;

    // Local e data
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(`${cidade ? cidade + ", " : ""}${dataFmt}.`, pageWidth - M, y, { align: "right" });

    // ── Assinatura (fixada mais abaixo) ──
    const sigY = Math.max(y + 40, pageHeight - 55);
    const sigW = 100;
    const sigX = (pageWidth - sigW) / 2;
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.4);
    doc.line(sigX, sigY, sigX + sigW, sigY);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(recebedorNome || "", pageWidth / 2, sigY + 6, { align: "center" });
    if (recebedorDoc) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(`${recLabel}: ${recebedorDoc}`, pageWidth / 2, sigY + 11.5, { align: "center" });
    }

    // Faixa inferior de acento
    doc.setFillColor(...GREEN);
    doc.rect(0, pageHeight - 6, pageWidth, 6, "F");

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recibo-${String(pagadorNome || "cliente").replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar recibo:", error);
    return NextResponse.json({ error: "Erro ao gerar recibo" }, { status: 500 });
  }
}
