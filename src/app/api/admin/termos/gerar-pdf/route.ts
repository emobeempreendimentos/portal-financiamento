import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { LOGO_BASE64 } from "@/lib/logo-base64";

const DARK: [number, number, number] = [24, 24, 27];
const GRAY: [number, number, number] = [113, 113, 122];
const BODY: [number, number, number] = [50, 50, 56];
const LINE: [number, number, number] = [205, 205, 210];
const LOGO_RATIO = 3.089; // 766 / 248
const FONT_BIG_DELTA = 3; // pt adicionados quando o trecho está marcado como "fonte maior"

const TIPO_TITULO: Record<string, string> = {
  proposta: "PROPOSTA COMERCIAL",
  orcamento: "ORÇAMENTO",
  comunicado: "COMUNICADO",
  outro: "DOCUMENTO",
};

/* ── Marcação de texto rico ──
 * **negrito**  __sublinhado__  ++fonte maior++  — combináveis entre si.
 */
interface Trecho {
  texto: string;
  bold: boolean;
  underline: boolean;
  big: boolean;
}

function parseTrechos(linha: string): Trecho[] {
  const trechos: Trecho[] = [];
  let bold = false;
  let underline = false;
  let big = false;
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) trechos.push({ texto: buffer, bold, underline, big });
    buffer = "";
  };

  while (i < linha.length) {
    if (linha.startsWith("**", i)) { flush(); bold = !bold; i += 2; continue; }
    if (linha.startsWith("__", i)) { flush(); underline = !underline; i += 2; continue; }
    if (linha.startsWith("++", i)) { flush(); big = !big; i += 2; continue; }
    buffer += linha[i];
    i++;
  }
  flush();
  return trechos;
}

interface Palavra extends Trecho {
  isSpace: boolean;
}

function tokenizar(linha: string): Palavra[] {
  const palavras: Palavra[] = [];
  parseTrechos(linha).forEach((t) => {
    const partes = t.texto.split(/(\s+)/).filter((p) => p !== "");
    partes.forEach((p) => palavras.push({ ...t, texto: p, isSpace: /^\s+$/.test(p) }));
  });
  return palavras;
}

/**
 * Renderiza uma linha com suporte a negrito/sublinhado/fonte maior combináveis,
 * quebrando automaticamente dentro de maxWidth. Retorna o y após a última linha desenhada.
 */
function renderRico(
  doc: jsPDF,
  linha: string,
  x: number,
  yInicial: number,
  maxWidth: number,
  baseFontSize: number,
  baseLineHeight: number
): number {
  const palavras = tokenizar(linha);
  let y = yInicial;

  const tamanhoDe = (p: Palavra) => (p.big ? baseFontSize + FONT_BIG_DELTA : baseFontSize);
  const medir = (p: Palavra) => {
    doc.setFont("Times", p.bold ? "bold" : "normal");
    doc.setFontSize(tamanhoDe(p));
    return doc.getTextWidth(p.texto);
  };

  let atual: { p: Palavra; w: number }[] = [];
  let maiorTamanho = baseFontSize;

  const desenharLinha = () => {
    let cx = x;
    for (const { p, w } of atual) {
      doc.setFont("Times", p.bold ? "bold" : "normal");
      doc.setFontSize(tamanhoDe(p));
      doc.text(p.texto, cx, y);
      if (p.underline && p.texto.length > 0) {
        const uy = y + (p.big ? 1.6 : 1.1);
        doc.setDrawColor(...BODY);
        doc.setLineWidth(0.25);
        doc.line(cx, uy, cx + w, uy);
      }
      cx += w;
    }
    y += baseLineHeight * (maiorTamanho / baseFontSize);
    atual = [];
    maiorTamanho = baseFontSize;
  };

  for (const p of palavras) {
    const w = medir(p);
    const usada = atual.reduce((acc, cur) => acc + cur.w, 0);
    if (!p.isSpace && atual.length > 0 && usada + w > maxWidth) {
      desenharLinha();
    }
    if (p.isSpace && atual.length === 0) continue; // ignora espaço no início da linha
    atual.push({ p, w });
    maiorTamanho = Math.max(maiorTamanho, tamanhoDe(p));
  }
  if (atual.length > 0) desenharLinha();

  return y;
}

/** Aplica negrito automático ao rótulo de linhas no padrão "Rótulo: valor". */
function autoRotulo(linha: string): string {
  const m = /^([^:\n*_+]{2,45}):\s?(.*)$/.exec(linha);
  if (m && m[1].trim()) {
    return `**${m[1].trim()}:**${m[2] ? " " + m[2] : ""}`;
  }
  return linha;
}

/** Processa uma linha bruta do corpo (marcador, rótulo automático) e desenha. */
function renderLinhaCorpo(
  doc: jsPDF,
  linhaBruta: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number,
  lineHeight: number
): number {
  const bullet = /^[-•]\s+(.*)$/.exec(linhaBruta);
  if (bullet) {
    doc.setFont("Times", "normal");
    doc.setFontSize(baseFontSize);
    doc.text("•", x, y);
    return renderRico(doc, bullet[1], x + 6, y, maxWidth - 6, baseFontSize, lineHeight);
  }
  return renderRico(doc, autoRotulo(linhaBruta), x, y, maxWidth, baseFontSize, lineHeight);
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
    const baseFontSize = 11;
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
    doc.setTextColor(...BODY);
    if (destinatario?.trim()) {
      y = renderLinhaCorpo(doc, `Destinatário: ${String(destinatario).trim()}`, M, y, contentW, baseFontSize, lineHeight);
      y += 8;
    }

    // ── Corpo (texto corrido, rótulos, marcadores e formatação manual) ──
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
      doc.setTextColor(...BODY);
      y = renderLinhaCorpo(doc, linha, M, y, contentW, baseFontSize, lineHeight);
      y += 2.5;
    }

    // ── Encerramento (assinatura / contato) ──
    // Flui logo após o conteúdo; só vai para uma nova página se não couber,
    // evitando um vão grande em branco quando o texto termina no meio da página.
    const closingH = 46;
    let y2: number;
    if (y + 24 + closingH > pageHeight - 18) {
      doc.addPage();
      y2 = 50;
    } else {
      y2 = y + 24;
    }

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
    y2 += 16;

    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(
      "EMOBE Empreendimentos Imobiliários · +55 (37) 99925-1577 · contato@emobe.com.br",
      pageWidth / 2,
      y2,
      { align: "center" }
    );

    // Numeração discreta em todas as páginas (apenas se houver mais de uma)
    const totalPaginas = doc.internal.pages.length - 1;
    if (totalPaginas > 1) {
      for (let p = 1; p <= totalPaginas; p++) {
        doc.setPage(p);
        doc.setFont("Times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text(`${p} / ${totalPaginas}`, pageWidth - M, pageHeight - 14, { align: "right" });
      }
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
