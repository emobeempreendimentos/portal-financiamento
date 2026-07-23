import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { LOGO_BASE64 } from "@/lib/logo-base64";

const DARK: [number, number, number] = [24, 24, 27];
const GRAY: [number, number, number] = [113, 113, 122];
const LINE: [number, number, number] = [205, 205, 210];
const LOGO_RATIO = 3.089; // 766 / 248

const TIPO_TITULO: Record<string, string> = {
  proposta: "PROPOSTA COMERCIAL",
  orcamento: "ORÇAMENTO",
  comunicado: "COMUNICADO",
  outro: "DOCUMENTO",
};

/**
 * Renderiza uma linha de texto no estilo "carta formal":
 * - Linhas iniciadas com "-" ou "•" viram marcador com recuo
 * - Padrão "Rótulo: valor" recebe o rótulo em negrito automaticamente
 * - Demais linhas quebram normalmente em texto corrido
 * Retorna o novo y após a linha (já considerando quebras internas).
 */
function renderLinha(
  doc: jsPDF,
  linhaBruta: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const bullet = /^[-•]\s+(.*)$/.exec(linhaBruta);
  if (bullet) {
    doc.setFont("Times", "normal");
    doc.text("•", x, y);
    const wrapped: string[] = doc.splitTextToSize(bullet[1], maxWidth - 6);
    wrapped.forEach((ln, i) => doc.text(ln, x + 6, y + i * lineHeight));
    return y + wrapped.length * lineHeight;
  }

  const label = /^([^:\n]{2,45}):\s?(.*)$/.exec(linhaBruta);
  if (label && label[1].trim()) {
    const rotulo = `${label[1].trim()}:`;
    const resto = label[2] || "";

    doc.setFont("Times", "bold");
    const rotuloW = doc.getTextWidth(`${rotulo} `);

    if (!resto) {
      doc.text(rotulo, x, y);
      return y + lineHeight;
    }

    if (rotuloW < maxWidth * 0.6 && doc.getTextWidth(resto) <= maxWidth - rotuloW) {
      doc.text(rotulo, x, y);
      doc.setFont("Times", "normal");
      doc.text(resto, x + rotuloW, y);
      return y + lineHeight;
    }

    doc.text(rotulo, x, y);
    doc.setFont("Times", "normal");
    const wrapped: string[] = doc.splitTextToSize(resto, maxWidth);
    wrapped.forEach((ln, i) => doc.text(ln, x, y + lineHeight + i * lineHeight));
    return y + lineHeight * (1 + wrapped.length);
  }

  doc.setFont("Times", "normal");
  const wrapped: string[] = doc.splitTextToSize(linhaBruta, maxWidth);
  wrapped.forEach((ln, i) => doc.text(ln, x, y + i * lineHeight));
  return y + wrapped.length * lineHeight;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, tipo, tipoOutro, destinatario, corpo } = body;

    if (!titulo?.trim() || !corpo?.trim()) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios" }, { status: 400 });
    }

    const tituloTipo =
      tipo === "outro" && tipoOutro?.trim()
        ? String(tipoOutro).trim().toUpperCase()
        : TIPO_TITULO[tipo] || TIPO_TITULO.outro;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const M = 25;
    const contentW = pageWidth - M * 2;
    const lineHeight = 6.4;

    // ── Cabeçalho: logo centralizada ──
    const logoW = 34;
    const logoH = logoW / LOGO_RATIO;
    doc.addImage(LOGO_BASE64, "PNG", (pageWidth - logoW) / 2, 20, logoW, logoH);

    let y = 20 + logoH + 16;

    // ── Título (tipo do documento) ──
    doc.setFont("Times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...DARK);
    doc.text(tituloTipo, pageWidth / 2, y, { align: "center" });
    y += 16;

    // ── Subtítulo (título informado) ──
    doc.setFont("Times", "bold");
    doc.setFontSize(12.5);
    const tituloLinhas: string[] = doc.splitTextToSize(String(titulo).trim(), contentW);
    doc.text(tituloLinhas, M, y);
    y += tituloLinhas.length * 6.8 + 8;

    // ── Destinatário ──
    if (destinatario?.trim()) {
      y = renderLinha(doc, `Destinatário: ${String(destinatario).trim()}`, M, y, contentW, lineHeight);
      y += 8;
    }

    // ── Corpo (texto corrido, rótulos e marcadores) ──
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 56);
    const linhas = String(corpo).split("\n");
    for (const linhaRaw of linhas) {
      const linha = linhaRaw.trimEnd();
      if (!linha.trim()) {
        y += 4.5;
        continue;
      }
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 28;
      }
      doc.setTextColor(50, 50, 56);
      y = renderLinha(doc, linha, M, y, contentW, lineHeight);
      y += 2.5;
    }

    // Numeração discreta, apenas se houver mais de uma página de conteúdo
    const paginasConteudo = doc.internal.pages.length - 1;
    if (paginasConteudo > 1) {
      for (let p = 1; p <= paginasConteudo; p++) {
        doc.setPage(p);
        doc.setFont("Times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text(`${p} / ${paginasConteudo}`, pageWidth - M, pageHeight - 14, { align: "right" });
      }
      doc.setPage(paginasConteudo);
    }

    // ── Página de encerramento (assinatura / contato) ──
    doc.addPage();
    let y2 = 45;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.line(M, y2, pageWidth - M, y2);
    y2 += 12;

    doc.setFont("Times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.text("EMOBE Empreendimentos Imobiliários", pageWidth / 2, y2, { align: "center" });
    y2 += 8;

    doc.setFont("Times", "normal");
    doc.setFontSize(10.5);
    doc.text("CRECI 4682J", pageWidth / 2, y2, { align: "center" });
    y2 += 20;

    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(
      "EMOBE Empreendimentos Imobiliários · +55 (37) 99925-1577 · contato@emobe.com.br",
      pageWidth / 2,
      y2,
      { align: "center" }
    );

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
