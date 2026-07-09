import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { LOGO_BASE64 } from "@/lib/logo-base64";
import { DIAGRAMA_BASE64 } from "@/lib/diagrama-base64";

// ── Paleta da marca EMOBE ──
const GREEN: [number, number, number] = [132, 188, 73];
const GREEN_DARK: [number, number, number] = [80, 130, 38];
const GREEN_TINT: [number, number, number] = [240, 246, 232];
const DARK: [number, number, number] = [24, 24, 27];
const DARK_CARD: [number, number, number] = [40, 40, 47];
const GRAY: [number, number, number] = [113, 113, 122];
const GRAY_LIGHT: [number, number, number] = [190, 190, 198];
const LIGHT: [number, number, number] = [246, 247, 248];
const BORDER: [number, number, number] = [229, 231, 235];
const LOGO_RATIO = 3.089; // 766 / 248

const fmtBRL = (v: number | null | undefined) =>
  v != null ? `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clienteNome,
      clienteCpf,
      clienteRenda,
      clienteDataNascimento,
      clienteDependentes,
      clienteTemaFgts,
      clienteValorFgts,
      tipoFinanciamento,
      tipoImovel,
      banco,
      valorImovel,
      valorEntrada,
      subsidio,
      valorParcelaInicial,
      valorParcelaFinal,
      prazo,
      prazoPeriodo,
      taxaJuros,
      taxaPeriodo,
      sistemaAmortizacao,
      observacoes,
    } = body;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const M = 15; // margem
    const contentW = pageWidth - M * 2;

    // Labels traduzidos
    const tipoFinanciamentoLabel = tipoFinanciamento === "mcmv" ? "Minha Casa Minha Vida" : "SBPE";
    const tipoImovelMap: Record<string, string> = {
      novo: "Imóvel Novo",
      usado: "Imóvel Usado",
      lote_construcao: "Lote + Construção",
      lote: "Lote",
    };
    const tipoImovelLabel = tipoImovelMap[tipoImovel] || tipoImovel;
    const bancoMap: Record<string, string> = {
      caixa: "Caixa Econômica Federal",
      banco_brasil: "Banco do Brasil",
      itau: "Banco Itaú",
    };
    const bancoLabel = bancoMap[banco] || banco;
    const sistemaAmortizacaoLabel = sistemaAmortizacao === "price" ? "Price (Parcelas Fixas)" : "SAC (Parcelas Decrescentes)";
    const taxaPeriodoLabel = taxaPeriodo === "ano" ? "a.a" : "a.m";

    // Rodapé padrão (páginas claras)
    const footer = (pg: number) => {
      doc.setFillColor(...GREEN);
      doc.rect(M, pageHeight - 13, contentW, 0.8, "F");
      doc.setFontSize(6.8);
      doc.setTextColor(...GRAY);
      doc.setFont("Helvetica", "normal");
      doc.text("EMOBE Empreendimentos Imobiliários  •  CRECI 4682J", M, pageHeight - 8);
      doc.text(`Página ${pg} de 3`, pageWidth - M, pageHeight - 8, { align: "right" });
    };

    // ══════════════ PÁGINA 1 — SIMULAÇÃO ══════════════

    // Hero escuro
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageWidth, 46, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, 46, pageWidth, 1.4, "F");

    // Chip branco com a logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 9, 52, 18, 3, 3, "F");
    doc.addImage(LOGO_BASE64, "PNG", M + 3.5, 10.7, 45, 45 / LOGO_RATIO);

    // Data (topo direito)
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_LIGHT);
    doc.setFont("Helvetica", "normal");
    doc.text(
      new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      pageWidth - M, 15, { align: "right" }
    );

    // Título (esquerda) + cliente (direita)
    doc.setFontSize(19);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.text("SIMULAÇÃO DE CRÉDITO", M, 39.5);

    doc.setFontSize(10.5);
    doc.setTextColor(...GREEN);
    doc.text(String(clienteNome).toUpperCase(), pageWidth - M, 35, { align: "right" });
    if (clienteCpf) {
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY_LIGHT);
      doc.setFont("Helvetica", "normal");
      doc.text(`CPF: ${clienteCpf}`, pageWidth - M, 40.5, { align: "right" });
    }

    // Pills de contexto
    let y = 56;
    const pills = [tipoFinanciamentoLabel, tipoImovelLabel, bancoLabel];
    let px = M;
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "bold");
    pills.forEach((p) => {
      const tw = doc.getTextWidth(p.toUpperCase());
      const pw = tw + 11;
      doc.setFillColor(...GREEN_TINT);
      doc.setDrawColor(...GREEN);
      doc.setLineWidth(0.35);
      doc.roundedRect(px, y, pw, 8.5, 4.25, 4.25, "FD");
      doc.setTextColor(...GREEN_DARK);
      doc.text(p.toUpperCase(), px + pw / 2, y + 5.6, { align: "center" });
      px += pw + 5;
    });
    y += 17;

    // Cards de destaque (o 1º em verde, protagonista)
    const cards = [
      { label: "VALOR DO IMÓVEL", value: fmtBRL(valorImovel), hero: true },
      { label: "ENTRADA", value: fmtBRL(valorEntrada), hero: false },
      { label: "SUBSÍDIO", value: fmtBRL(subsidio), hero: false },
      { label: "PARCELA INICIAL", value: fmtBRL(valorParcelaInicial), hero: false },
    ];
    const gap = 4;
    const cardW = (contentW - 3 * gap) / 4;
    const cardH = 25;
    cards.forEach((c, i) => {
      const cx = M + i * (cardW + gap);
      if (c.hero) {
        doc.setFillColor(...GREEN);
        doc.roundedRect(cx, y, cardW, cardH, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(...LIGHT);
        doc.roundedRect(cx, y, cardW, cardH, 3, 3, "F");
        doc.setFillColor(...GREEN);
        doc.circle(cx + 6, y + 8.2, 1.1, "F");
        doc.setTextColor(...GRAY);
      }
      doc.setFontSize(6.4);
      doc.setFont("Helvetica", "bold");
      doc.text(c.label, c.hero ? cx + 5 : cx + 9.5, y + 9.5);
      doc.setFontSize(10.5);
      doc.setTextColor(...(c.hero ? [255, 255, 255] as [number, number, number] : DARK));
      doc.text(c.value, cx + 5, y + 18.5);
    });
    y += cardH + 10;

    // Painéis lado a lado (label/valor empilhados — visual moderno)
    const panelGap = 6;
    const panelW = (contentW - panelGap) / 2;
    const clienteRows: Array<[string, string]> = [
      ["RENDA MENSAL", fmtBRL(clienteRenda)],
      ["DATA DE NASCIMENTO", clienteDataNascimento ? new Date(clienteDataNascimento).toLocaleDateString("pt-BR") : "—"],
      ["POSSUI DEPENDENTES", clienteDependentes ? "Sim" : "Não"],
      ["FGTS (+3 ANOS)", clienteTemaFgts ? `Sim  •  ${clienteValorFgts != null ? fmtBRL(clienteValorFgts) : "Não informado"}` : "Não"],
    ];
    const simRows: Array<[string, string]> = [
      ["BANCO", bancoLabel],
      ["PARCELA FINAL", fmtBRL(valorParcelaFinal)],
      ["PRAZO", `${prazo || "—"} ${prazoPeriodo}`],
      ["SISTEMA DE AMORTIZAÇÃO", sistemaAmortizacaoLabel],
      ["TAXA DE JUROS", `${taxaJuros} % ${taxaPeriodoLabel}`],
    ];
    const rowH = 11.5;
    const panelHeadH = 15;
    const panelH = panelHeadH + Math.max(clienteRows.length, simRows.length) * rowH + 3;

    const drawPanel = (x: number, title: string, rows: Array<[string, string]>) => {
      doc.setFillColor(...LIGHT);
      doc.roundedRect(x, y, panelW, panelH, 3, 3, "F");
      // título
      doc.setFillColor(...GREEN);
      doc.roundedRect(x + 6, y + 6, 2.6, 2.6, 0.8, 0.8, "F");
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      doc.setFont("Helvetica", "bold");
      doc.text(title, x + 11.5, y + 8.6);
      // linhas
      let ry = y + panelHeadH;
      rows.forEach(([label, value], idx) => {
        doc.setFontSize(6.2);
        doc.setTextColor(...GRAY);
        doc.setFont("Helvetica", "normal");
        doc.text(label, x + 6, ry + 3);
        doc.setFontSize(9.5);
        doc.setTextColor(...DARK);
        doc.setFont("Helvetica", "bold");
        doc.text(value, x + 6, ry + 8);
        if (idx < rows.length - 1) {
          doc.setDrawColor(...BORDER);
          doc.setLineWidth(0.25);
          doc.line(x + 6, ry + rowH - 1, x + panelW - 6, ry + rowH - 1);
        }
        ry += rowH;
      });
    };
    drawPanel(M, "DADOS DO CLIENTE", clienteRows);
    drawPanel(M + panelW + panelGap, "DETALHES DA SIMULAÇÃO", simRows);
    y += panelH + 8;

    // Observações — cartão verde-claro com barra de acento
    if (observacoes) {
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "normal");
      const obsLines = doc.splitTextToSize(observacoes, contentW - 18);
      const boxH = 13 + obsLines.length * 4.3;
      doc.setFillColor(...GREEN_TINT);
      doc.roundedRect(M, y, contentW, boxH, 3, 3, "F");
      doc.setFillColor(...GREEN);
      doc.roundedRect(M, y, 3, boxH, 1.5, 1.5, "F");
      doc.setFontSize(8);
      doc.setTextColor(...GREEN_DARK);
      doc.setFont("Helvetica", "bold");
      doc.text("OBSERVAÇÕES", M + 8, y + 7.5);
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 66);
      doc.setFont("Helvetica", "normal");
      doc.text(obsLines, M + 8, y + 13.5);
    }

    // Aviso legal + rodapé
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.setFont("Helvetica", "normal");
    const legal =
      "Esta simulação possui caráter exclusivamente informativo e não constitui proposta definitiva de financiamento. Os valores apresentados podem sofrer alterações conforme análise de crédito, políticas da instituição financeira e documentação apresentada.";
    doc.text(doc.splitTextToSize(legal, contentW), M, pageHeight - 23);
    footer(1);

    // ══════════════ PÁGINA 2 — ETAPAS DO PROCESSO ══════════════
    doc.addPage();

    // Faixa escura com título + chip da logo
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, 30, pageWidth, 1.2, "F");

    doc.setFontSize(15.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.text("ETAPAS DO PROCESSO", M, 14.5);
    doc.setFontSize(8.5);
    doc.setTextColor(...GREEN);
    doc.setFont("Helvetica", "normal");
    doc.text("Transparência e agilidade em cada fase do seu financiamento", M, 22);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - M - 42, 7.5, 42, 15, 3, 3, "F");
    doc.addImage(LOGO_BASE64, "PNG", pageWidth - M - 39, 9.4, 36, 36 / LOGO_RATIO);

    let yp = 40;

    const etapas: Array<{ num: string; titulo: string; desc: string; cor: [number, number, number] }> = [
      { num: "1", titulo: "APROVAÇÃO DE CRÉDITO", desc: "Nesta fase, o banco analisa sua documentação e capacidade de pagamento para aprovar o crédito do financiamento.", cor: [27, 94, 32] },
      { num: "2", titulo: "ENGENHARIA", desc: "O banco realiza a avaliação de engenharia do imóvel, verificando suas condições e o valor de mercado.", cor: [76, 175, 80] },
      { num: "3", titulo: "CONTRATO JUNTO AO BANCO", desc: "Com o laudo aprovado, o contrato é emitido pela Caixa. Essa é a etapa em que o financiamento é formalizado.", cor: [156, 204, 101] },
      { num: "4", titulo: "ITBI", desc: "O ITBI é o imposto de transmissão pago à Prefeitura antes do registro do contrato. É uma etapa obrigatória.", cor: [79, 143, 149] },
      { num: "5", titulo: "REGISTRO", desc: "Depois do pagamento do ITBI, o contrato é levado ao cartório para registro, tornando o imóvel oficialmente em seu nome.", cor: [120, 144, 176] },
      { num: "6", titulo: "ENTREGA DAS CHAVES", desc: "Com tudo registrado e liberado pela Caixa, é hora de receber as chaves e realizar o sonho da casa própria!", cor: [63, 81, 122] },
    ];

    // Diagrama hexagonal
    const diagW = 82;
    const diagH = diagW / 1.023;
    doc.addImage(DIAGRAMA_BASE64, "PNG", (pageWidth - diagW) / 2, yp, diagW, diagH);
    yp += diagH + 10;

    // Cards das etapas — brancos com borda sutil e barra colorida
    const colW = (contentW - 6) / 2;
    const cardRowH = 36;
    for (let i = 0; i < etapas.length; i++) {
      const etapa = etapas[i];
      const col = i % 2;
      const rowIdx = Math.floor(i / 2);
      const xPos = col === 0 ? M : M + colW + 6;
      const yPos = yp + rowIdx * (cardRowH + 6);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.35);
      doc.roundedRect(xPos, yPos, colW, cardRowH, 3, 3, "FD");
      doc.setFillColor(etapa.cor[0], etapa.cor[1], etapa.cor[2]);
      doc.roundedRect(xPos, yPos, 3, cardRowH, 1.5, 1.5, "F");

      doc.setFillColor(etapa.cor[0], etapa.cor[1], etapa.cor[2]);
      doc.circle(xPos + 12, yPos + 11, 5, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.text(etapa.num, xPos + 12, yPos + 12.5, { align: "center" });

      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      doc.text(etapa.titulo, xPos + 20, yPos + 12.5);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.4);
      doc.setTextColor(...GRAY);
      const descLines = doc.splitTextToSize(etapa.desc, colW - 15);
      doc.text(descLines, xPos + 9, yPos + 20.5);
    }
    footer(2);

    // ══════════════ PÁGINA 3 — CONTRACAPA ESCURA ══════════════
    doc.addPage();

    // Fundo escuro inteiro
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageWidth, 2, "F");

    // Chip branco com logo centralizada
    const chipW = 104;
    const chipH = 38;
    const chipX = (pageWidth - chipW) / 2;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(chipX, 42, chipW, chipH, 4, 4, "F");
    const l3W = 90;
    const l3H = l3W / LOGO_RATIO;
    doc.addImage(LOGO_BASE64, "PNG", (pageWidth - l3W) / 2, 42 + (chipH - l3H) / 2, l3W, l3H);

    let y3 = 42 + chipH + 18;
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.text("O imóvel dos seus sonhos está aqui", pageWidth / 2, y3, { align: "center" });
    y3 += 8;
    doc.setFillColor(...GREEN);
    doc.rect(pageWidth / 2 - 18, y3, 36, 1, "F");
    y3 += 20;

    // Próximos passos
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.setFont("Helvetica", "bold");
    doc.text("PRÓXIMOS PASSOS", 32, y3);
    y3 += 11;
    const proximosPassos = [
      "Entre em contato conosco para iniciar o processo de financiamento",
      "Apresente a documentação necessária para análise de crédito",
      "Aguarde a aprovação do banco e liberação do crédito",
      "Acompanhe todas as etapas do processo através do nosso portal",
      "Realize o sonho de ter a casa própria!",
    ];
    proximosPassos.forEach((passo, i) => {
      doc.setFillColor(...GREEN);
      doc.circle(35, y3 - 1.2, 3.2, "F");
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.setFont("Helvetica", "bold");
      doc.text(String(i + 1), 35, y3, { align: "center" });
      doc.setFontSize(9.5);
      doc.setTextColor(235, 235, 238);
      doc.setFont("Helvetica", "normal");
      doc.text(passo, 43, y3, { baseline: "middle" });
      y3 += 11;
    });
    y3 += 10;

    // Cartão de contato
    const contatoH = 46;
    doc.setFillColor(...DARK_CARD);
    doc.roundedRect(32, y3, pageWidth - 64, contatoH, 4, 4, "F");
    doc.setFillColor(...GREEN);
    doc.roundedRect(32, y3, 3, contatoH, 1.5, 1.5, "F");
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.setFont("Helvetica", "bold");
    doc.text("FALE CONOSCO", 41, y3 + 11);
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "normal");
    doc.text("Site: www.emobe.com.br", 41, y3 + 19);
    doc.text("E-mail: contato@emobe.com.br", 41, y3 + 25.5);
    doc.text("WhatsApp: (37) 99925.1577", 41, y3 + 32);
    doc.text("WhatsApp: (37) 99813.1577", 41, y3 + 38.5);
    doc.setTextColor(...GRAY_LIGHT);
    doc.text("CRECI 4682J", pageWidth - 41, y3 + 38.5, { align: "right" });

    // Faixa verde de fechamento
    doc.setFillColor(...GREEN);
    doc.rect(0, pageHeight - 13, pageWidth, 13, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.setFont("Helvetica", "bold");
    doc.text("EMOBE EMPREENDIMENTOS IMOBILIÁRIOS  •  CRECI 4682J", pageWidth / 2, pageHeight - 5.5, { align: "center" });

    // Gerar PDF
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="simulacao-${String(clienteNome).replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
