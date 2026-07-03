import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { LOGO_BASE64 } from "@/lib/logo-base64";
import { DIAGRAMA_BASE64 } from "@/lib/diagrama-base64";

// ── Paleta da marca EMOBE ──
const GREEN: [number, number, number] = [132, 188, 73]; // verde EMOBE
const DARK: [number, number, number] = [38, 38, 38];
const GRAY: [number, number, number] = [113, 113, 122];
const LIGHT: [number, number, number] = [245, 246, 247];
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

    // ══════════════ PÁGINA 1 — SIMULAÇÃO ══════════════

    // Cabeçalho: logo + data
    doc.addImage(LOGO_BASE64, "PNG", 15, 14, 46, 46 / LOGO_RATIO);

    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont("Helvetica", "normal");
    doc.text(new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), pageWidth - 15, 20, { align: "right" });

    // Linha de acento verde
    doc.setFillColor(...GREEN);
    doc.rect(15, 34, pageWidth - 30, 1.2, "F");

    // Título
    let y = 50;
    doc.setFontSize(24);
    doc.setTextColor(...DARK);
    doc.setFont("Helvetica", "bold");
    doc.text("SIMULAÇÃO DE CRÉDITO", pageWidth / 2, y, { align: "center" });
    y += 9;

    // Nome + CPF
    doc.setFontSize(12);
    doc.setTextColor(...GRAY);
    doc.setFont("Helvetica", "normal");
    doc.text(`${clienteNome}${clienteCpf ? `  •  CPF: ${clienteCpf}` : ""}`, pageWidth / 2, y, { align: "center" });
    y += 10;

    // Badge do tipo de financiamento
    const badgeText = `${tipoFinanciamentoLabel.toUpperCase()}  —  ${tipoImovelLabel.toUpperCase()}`;
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    const badgeW = doc.getTextWidth(badgeText) + 12;
    const badgeX = (pageWidth - badgeW) / 2;
    doc.setFillColor(...GREEN);
    doc.roundedRect(badgeX, y - 5, badgeW, 8, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, pageWidth / 2, y, { align: "center" });
    y += 14;

    // Cards de destaque (3 valores principais)
    const cards = [
      { label: "VALOR DO IMÓVEL", value: fmtBRL(valorImovel) },
      { label: "ENTRADA", value: fmtBRL(valorEntrada) },
      { label: "PARCELA INICIAL", value: fmtBRL(valorParcelaInicial) },
    ];
    const gap = 5;
    const cardW = (pageWidth - 30 - 2 * gap) / 3;
    const cardH = 22;
    cards.forEach((c, i) => {
      const cx = 15 + i * (cardW + gap);
      doc.setFillColor(...LIGHT);
      doc.roundedRect(cx, y, cardW, cardH, 2.5, 2.5, "F");
      doc.setFillColor(...GREEN);
      doc.roundedRect(cx, y, cardW, 2, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.setFont("Helvetica", "normal");
      doc.text(c.label, cx + cardW / 2, y + 9, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.setFont("Helvetica", "bold");
      doc.text(c.value, cx + cardW / 2, y + 16.5, { align: "center" });
    });
    y += cardH + 12;

    // Tabela: Dados do Cliente
    const clienteData = [
      ["Renda Mensal", fmtBRL(clienteRenda)],
      ["Data de Nascimento", clienteDataNascimento ? new Date(clienteDataNascimento).toLocaleDateString("pt-BR") : "—"],
      ["Possui Dependentes", clienteDependentes ? "Sim" : "Não"],
      ["FGTS (+3 anos)", clienteTemaFgts ? `Sim  •  ${fmtBRL(clienteValorFgts)}` : "Não"],
    ];

    (doc as any).autoTable({
      head: [["DADOS DO CLIENTE", ""]],
      body: clienteData,
      startY: y,
      margin: { left: 15, right: 15 },
      theme: "plain",
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: 2.5 },
      bodyStyles: { fontSize: 9, textColor: DARK, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 0: { cellWidth: 65, textColor: GRAY, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Tabela: Detalhes da Simulação
    const simulacaoData = [
      ["Banco", bancoLabel],
      ["Valor da Parcela Final", fmtBRL(valorParcelaFinal)],
      ["Prazo", `${prazo || "—"} ${prazoPeriodo}`],
      ["Sistema de Amortização", sistemaAmortizacaoLabel],
      ["Taxa de Juros", `${taxaJuros} % ${taxaPeriodoLabel}`],
    ];

    (doc as any).autoTable({
      head: [["DETALHES DA SIMULAÇÃO", ""]],
      body: simulacaoData,
      startY: y,
      margin: { left: 15, right: 15 },
      theme: "plain",
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, cellPadding: 2.5 },
      bodyStyles: { fontSize: 9, textColor: DARK, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 0: { cellWidth: 65, textColor: GRAY, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Caixa de observações (estilo marca — fundo escuro arredondado)
    if (observacoes) {
      doc.setFontSize(9);
      const obsLines = doc.splitTextToSize(observacoes, pageWidth - 46);
      const boxH = obsLines.length * 5 + 10;
      doc.setFillColor(...DARK);
      doc.roundedRect(15, y, pageWidth - 30, boxH, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "normal");
      doc.text(obsLines, 23, y + 8);
    }

    // Rodapé — aviso legal
    const footerY = pageHeight - 24;
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.4);
    doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("Helvetica", "normal");
    const footerText =
      "Esta simulação possui caráter exclusivamente informativo e não constitui proposta definitiva de financiamento. Os valores apresentados podem sofrer alterações conforme análise de crédito, políticas da instituição financeira e documentação apresentada.";
    doc.text(doc.splitTextToSize(footerText, pageWidth - 30), 15, footerY);

    // ══════════════ PÁGINA 2 — ETAPAS DO PROCESSO ══════════════
    doc.addPage();

    // Faixa de cabeçalho verde
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageWidth, 4, "F");

    let yp = 26;
    doc.setFontSize(19);
    doc.setTextColor(...DARK);
    doc.setFont("Helvetica", "bold");
    doc.text("ETAPAS DO PROCESSO DE FINANCIAMENTO", pageWidth / 2, yp, { align: "center" });
    yp += 8;
    doc.setFontSize(10.5);
    doc.setTextColor(...GRAY);
    doc.setFont("Helvetica", "normal");
    doc.text("Financiar um imóvel com a Emobe é sinônimo de transparência e agilidade", pageWidth / 2, yp, { align: "center" });
    yp += 16;

    const etapas: Array<{ num: string; titulo: string; desc: string; cor: [number, number, number] }> = [
      { num: "1", titulo: "APROVAÇÃO DE CRÉDITO", desc: "Nesta fase, o banco analisa sua documentação e capacidade de pagamento para aprovar o crédito do financiamento.", cor: [27, 94, 32] },
      { num: "2", titulo: "ENGENHARIA", desc: "O banco realiza a avaliação de engenharia do imóvel, verificando suas condições e o valor de mercado.", cor: [76, 175, 80] },
      { num: "3", titulo: "CONTRATO JUNTO AO BANCO", desc: "Com o laudo aprovado, o contrato é emitido pela Caixa. Essa é a etapa em que o financiamento é formalizado.", cor: [156, 204, 101] },
      { num: "4", titulo: "ITBI", desc: "O ITBI é o imposto de transmissão pago à Prefeitura antes do registro do contrato. É uma etapa obrigatória.", cor: [79, 143, 149] },
      { num: "5", titulo: "REGISTRO", desc: "Depois do pagamento do ITBI, o contrato é levado ao cartório para registro, tornando o imóvel oficialmente em seu nome.", cor: [120, 144, 176] },
      { num: "6", titulo: "ENTREGA DAS CHAVES", desc: "Com tudo registrado e liberado pela Caixa, é hora de receber as chaves e realizar o sonho da casa própria!", cor: [63, 81, 122] },
    ];

    // Diagrama hexagonal (imagem real)
    const diagW = 78;
    const diagH = diagW / 1.023;
    doc.addImage(DIAGRAMA_BASE64, "PNG", (pageWidth - diagW) / 2, yp, diagW, diagH);
    yp += diagH + 12;

    // Cards das etapas em 2 colunas
    const colW = (pageWidth - 30 - 6) / 2;
    const colX1 = 15;
    const colX2 = colX1 + colW + 6;
    const rowH = 34;
    for (let i = 0; i < etapas.length; i++) {
      const etapa = etapas[i];
      const col = i % 2;
      const rowIdx = Math.floor(i / 2);
      const xPos = col === 0 ? colX1 : colX2;
      const yPos = yp + rowIdx * (rowH + 6);

      // Card
      doc.setFillColor(...LIGHT);
      doc.roundedRect(xPos, yPos, colW, rowH, 2.5, 2.5, "F");
      // Barra lateral colorida
      doc.setFillColor(etapa.cor[0], etapa.cor[1], etapa.cor[2]);
      doc.roundedRect(xPos, yPos, 3, rowH, 1.5, 1.5, "F");
      // Círculo com número
      doc.setFillColor(etapa.cor[0], etapa.cor[1], etapa.cor[2]);
      doc.circle(xPos + 11, yPos + 10, 5, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.text(etapa.num, xPos + 11, yPos + 11.5, { align: "center" });
      // Título
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      doc.setFont("Helvetica", "bold");
      doc.text(etapa.titulo, xPos + 19, yPos + 11);
      // Descrição
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      const descLines = doc.splitTextToSize(etapa.desc, colW - 12);
      doc.text(descLines, xPos + 8, yPos + 19);
    }

    // ══════════════ PÁGINA 3 — MARCA / CONTATO ══════════════
    doc.addPage();

    // Logo centralizada
    const logoW = 90;
    const logoH = logoW / LOGO_RATIO;
    doc.addImage(LOGO_BASE64, "PNG", (pageWidth - logoW) / 2, 45, logoW, logoH);

    let y3 = 45 + logoH + 16;
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.setFont("Helvetica", "bold");
    doc.text("O imóvel dos seus sonhos está aqui", pageWidth / 2, y3, { align: "center" });
    y3 += 20;

    // Divisória verde
    doc.setFillColor(...GREEN);
    doc.rect(pageWidth / 2 - 20, y3, 40, 1, "F");
    y3 += 16;

    // Próximos passos
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.setFont("Helvetica", "bold");
    doc.text("PRÓXIMOS PASSOS", 20, y3);
    y3 += 9;
    const proximosPassos = [
      "Entre em contato conosco para iniciar o processo de financiamento",
      "Apresente a documentação necessária para análise de crédito",
      "Aguarde a aprovação do banco e liberação do crédito",
      "Acompanhe todas as etapas do processo através do nosso portal",
      "Realize o sonho de ter a casa própria!",
    ];
    proximosPassos.forEach((passo, i) => {
      doc.setFillColor(...GREEN);
      doc.circle(23, y3 - 1.2, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.text(String(i + 1), 23, y3, { align: "center" });
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      doc.setFont("Helvetica", "normal");
      doc.text(passo, 30, y3, { baseline: "middle" });
      y3 += 10;
    });

    y3 += 8;

    // Caixa de contato
    const contatoH = 40;
    doc.setFillColor(...DARK);
    doc.roundedRect(20, y3, pageWidth - 40, contatoH, 3, 3, "F");
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.setFont("Helvetica", "bold");
    doc.text("FALE CONOSCO", 28, y3 + 9);
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "normal");
    doc.text("Site: www.emobe.com.br", 28, y3 + 15);
    doc.text("E-mail: contato@emobe.com.br", 28, y3 + 21);
    doc.text("WhatsApp: (37) 99925.1577", 28, y3 + 27);
    doc.text("WhatsApp: (37) 99813.1577", 28, y3 + 33);
    doc.setTextColor(...GRAY);
    doc.text("CRECI 4682J", pageWidth - 28, y3 + 33, { align: "right" });

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
