import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { LOGO_BASE64 } from "@/lib/logo-base64";

const GREEN: [number, number, number] = [132, 188, 73];
const DARK: [number, number, number] = [24, 24, 27];
const GRAY: [number, number, number] = [113, 113, 122];
const CARD: [number, number, number] = [246, 247, 248];
const LOGO_RATIO = 3.089; // 766 / 248

const TIPO_LABEL: Record<string, string> = {
  proposta: "PROPOSTA",
  orcamento: "ORÇAMENTO",
  comunicado: "COMUNICADO",
  outro: "DOCUMENTO",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, tipo, tipoOutro, destinatario, corpo } = body;

    if (!titulo?.trim() || !corpo?.trim()) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios" }, { status: 400 });
    }

    const tipoLabel =
      tipo === "outro" && tipoOutro?.trim()
        ? String(tipoOutro).trim().toUpperCase()
        : TIPO_LABEL[tipo] || TIPO_LABEL.outro;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const M = 20;
    const contentW = pageWidth - M * 2;

    const dataFmt = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    // ── Cabeçalho moderno (faixa escura) ──
    const headerH = 42;
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageWidth, headerH, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, headerH, pageWidth, 1.6, "F");

    // Chip branco com a logo
    const logoW = 42;
    const logoH = logoW / LOGO_RATIO;
    const chipPad = 5;
    const chipW = logoW + chipPad * 2;
    const chipH = logoH + chipPad * 2;
    const chipY = (headerH - chipH) / 2;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, chipY, chipW, chipH, 3, 3, "F");
    doc.addImage(LOGO_BASE64, "PNG", M + chipPad, chipY + chipPad, logoW, logoH);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GREEN);
    // Reduz a fonte se o nome personalizado for muito longo para não invadir a logo
    const espacoDisponivel = pageWidth - M - (M + chipW + 6);
    let tipoFontSize = 9;
    while (tipoFontSize > 6 && doc.getTextWidth(tipoLabel) > espacoDisponivel) {
      tipoFontSize -= 0.5;
      doc.setFontSize(tipoFontSize);
    }
    doc.text(tipoLabel, pageWidth - M, 17, { align: "right" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(190, 190, 198);
    doc.text(dataFmt, pageWidth - M, 24, { align: "right" });

    let y = headerH + 18;

    // ── Título ──
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(...DARK);
    const tituloLinhas = doc.splitTextToSize(String(titulo).trim(), contentW);
    doc.text(tituloLinhas, M, y);
    y += tituloLinhas.length * 8 + 4;

    // ── Destinatário ──
    if (destinatario?.trim()) {
      doc.setFillColor(...CARD);
      doc.roundedRect(M, y, contentW, 14, 3, 3, "F");
      doc.setFillColor(...GREEN);
      doc.roundedRect(M, y, 3, 14, 1.5, 1.5, "F");
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text("PARA", M + 10, y + 6);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...DARK);
      doc.text(String(destinatario).trim(), M + 10, y + 11);
      y += 14 + 10;
    } else {
      y += 4;
    }

    // Divisória
    doc.setDrawColor(...CARD);
    doc.setLineWidth(0.6);
    doc.line(M, y, pageWidth - M, y);
    y += 12;

    // ── Corpo (preserva parágrafos) ──
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 66);

    const paragrafos = String(corpo).split(/\n{2,}/);
    for (const paragrafo of paragrafos) {
      const linhas = doc.splitTextToSize(paragrafo.replace(/\n/g, " "), contentW);
      for (const linha of linhas) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 25;
        }
        doc.text(linha, M, y);
        y += 6.2;
      }
      y += 4.5;
    }

    // ── Rodapé em todas as páginas ──
    const totalPaginas = doc.internal.pages.length - 1;
    for (let p = 1; p <= totalPaginas; p++) {
      doc.setPage(p);
      doc.setFillColor(...GREEN);
      doc.rect(0, pageHeight - 6, pageWidth, 6, "F");
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(`${p} / ${totalPaginas}`, pageWidth - M, pageHeight - 12, { align: "right" });
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${String(titulo).trim().replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar termo:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
