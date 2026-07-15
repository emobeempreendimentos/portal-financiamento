import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { LOGO_BASE64 } from "@/lib/logo-base64";

const GREEN: [number, number, number] = [132, 188, 73];
const DARK: [number, number, number] = [24, 24, 27];
const GRAY: [number, number, number] = [90, 90, 96];
const LOGO_RATIO = 3.089;

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
      recebedorDoc,
      pagadorNome,
      pagadorDoc,
      valor,
      referente,
      imovelEndereco,
      imovelMatricula,
      cidade,
      data,
    } = body;

    const valorNum = Number(valor) || 0;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const M = 22;
    const contentW = pageWidth - M * 2;

    // Moldura sutil
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Logo centralizada
    const logoW = 62;
    doc.addImage(LOGO_BASE64, "PNG", (pageWidth - logoW) / 2, 22, logoW, logoW / LOGO_RATIO);

    let y = 22 + logoW / LOGO_RATIO + 14;

    // Título
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...DARK);
    doc.text("RECIBO", pageWidth / 2, y, { align: "center" });

    // Valor em destaque (caixa)
    doc.setFontSize(14);
    const valorTxt = fmtBRL(valorNum);
    const boxW = 60;
    doc.setFillColor(...GREEN);
    doc.roundedRect(pageWidth - M - boxW, y - 8, boxW, 12, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(valorTxt, pageWidth - M - boxW / 2, y, { align: "center" });

    y += 16;
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.6);
    doc.line(M, y, pageWidth - M, y);
    y += 14;

    // Corpo do recibo
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(...DARK);

    const docPagador = pagadorDoc ? `, inscrito(a) no CPF/CNPJ sob o nº ${pagadorDoc},` : "";
    let corpo = `Eu, ${recebedorNome}${recebedorDoc ? `, inscrito(a) no CPF/CNPJ sob o nº ${recebedorDoc},` : ","} DECLARO para os devidos fins que recebi de ${pagadorNome}${docPagador} a importância de ${valorTxt} (${extenso(valorNum)})`;

    if (referente) corpo += `, referente a ${referente}`;

    if (imovelEndereco || imovelMatricula) {
      corpo += `, relativo ao imóvel`;
      if (imovelEndereco) corpo += ` situado à ${imovelEndereco}`;
      if (imovelMatricula) corpo += `${imovelEndereco ? "," : ""} matrícula nº ${imovelMatricula}`;
    }
    corpo += ".";

    const linhas = doc.splitTextToSize(corpo, contentW);
    doc.text(linhas, M, y, { lineHeightFactor: 1.6 });
    y += linhas.length * 7.2 + 10;

    doc.text(
      doc.splitTextToSize(
        "Para maior clareza e como prova de quitação, firmo o presente recibo, dando plena e total quitação do valor acima descrito.",
        contentW
      ),
      M, y, { lineHeightFactor: 1.6 }
    );
    y += 22;

    // Local e data
    const dataFmt = data
      ? new Date(data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(`${cidade ? cidade + ", " : ""}${dataFmt}.`, pageWidth - M, y, { align: "right" });
    y += 30;

    // Assinatura
    const sigW = 90;
    const sigX = (pageWidth - sigW) / 2;
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.4);
    doc.line(sigX, y, sigX + sigW, y);
    y += 6;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text(recebedorNome, pageWidth / 2, y, { align: "center" });
    if (recebedorDoc) {
      y += 5.5;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(`CPF/CNPJ: ${recebedorDoc}`, pageWidth / 2, y, { align: "center" });
    }

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont("Helvetica", "normal");
    doc.text("EMOBE Empreendimentos Imobiliários  •  CRECI 4682J", pageWidth / 2, pageHeight - 16, { align: "center" });

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
