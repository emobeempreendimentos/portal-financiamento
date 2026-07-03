import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
    let yPosition = 15;

    // Cabeçalho
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94); // green-500
    doc.text("EMOBE Empreendimentos Imobiliários", 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // zinc-500
    doc.text(`Simulação de Financiamento - ${new Date().toLocaleDateString("pt-BR")}`, 15, yPosition);
    yPosition += 12;

    // Linha divisória
    doc.setDrawColor(229, 231, 235); // zinc-200
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 8;

    // Dados do Cliente
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27); // zinc-900
    doc.text("Dados do Cliente", 15, yPosition);
    yPosition += 7;

    const clienteData = [
      ["Campo", "Valor"],
      ["Nome", clienteNome],
      ["CPF", clienteCpf],
      ["Renda Mensal", `R$ ${clienteRenda?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "—"}`],
      ["Data de Nascimento", clienteDataNascimento ? new Date(clienteDataNascimento).toLocaleDateString("pt-BR") : "—"],
      ["Dependentes", clienteDependentes ? "Sim" : "Não"],
      ...(clienteTemaFgts ? [["Valor FGTS", `R$ ${clienteValorFgts?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "—"}`]] : []),
    ];

    (doc as any).autoTable({
      head: [clienteData[0]],
      body: clienteData.slice(1),
      startY: yPosition,
      margin: 15,
      theme: "grid",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [24, 24, 27],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Dados da Simulação
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27);
    doc.text("Dados da Simulação", 15, yPosition);
    yPosition += 7;

    const tipoFinanciamentoLabel = tipoFinanciamento === "mcmv" ? "Plano Minha Casa Minha Vida" : "SBPE";
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
    const taxaPeriodoLabel = taxaPeriodo === "ano" ? "ao ano" : "ao mês";

    const simulacaoData = [
      ["Campo", "Valor"],
      ["Tipo de Financiamento", tipoFinanciamentoLabel],
      ["Tipo de Imóvel", tipoImovelLabel],
      ["Banco", bancoLabel],
      ["Valor do Imóvel", `R$ ${valorImovel?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "—"}`],
      ["Valor da Entrada", `R$ ${valorEntrada?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "—"}`],
      ["Valor da Parcela Inicial", `R$ ${valorParcelaInicial?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "—"}`],
      ["Valor da Parcela Final", `R$ ${valorParcelaFinal?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "—"}`],
      [`Prazo (${prazoPeriodo})`, prazo || "—"],
      ["Taxa de Juros", `${taxaJuros} % ${taxaPeriodoLabel}`],
      ["Sistema de Amortização", sistemaAmortizacaoLabel],
    ];

    (doc as any).autoTable({
      head: [simulacaoData[0]],
      body: simulacaoData.slice(1),
      startY: yPosition,
      margin: 15,
      theme: "grid",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [24, 24, 27],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: "auto" },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Observações
    if (observacoes) {
      doc.setFontSize(12);
      doc.setTextColor(24, 24, 27);
      doc.text("Observações", 15, yPosition);
      yPosition += 7;

      doc.setFontSize(9);
      doc.setTextColor(63, 63, 70); // zinc-700
      const splitText = doc.splitTextToSize(observacoes, pageWidth - 30);
      doc.text(splitText, 15, yPosition);
      yPosition += splitText.length * 5 + 5;
    }

    // Rodapé - aviso importante
    const footerY = pageHeight - 30;
    doc.setDrawColor(229, 231, 235);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(119, 132, 149); // zinc-500
    const footerText =
      "Esta simulação possui caráter exclusivamente informativo e não constitui proposta definitiva de financiamento. Os valores apresentados podem sofrer alterações conforme análise de crédito, políticas da instituição financeira e documentação apresentada.";
    const footerLines = doc.splitTextToSize(footerText, pageWidth - 30);
    doc.text(footerLines, 15, footerY);

    // ========== PÁGINA 2: ETAPAS DO PROCESSO ==========
    doc.addPage();
    let yPos = 20;

    // Título
    doc.setFontSize(20);
    doc.setTextColor(24, 24, 27);
    doc.text("ETAPAS PROCESSO DE FINANCIAMENTO", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    // Subtítulo
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("Financiar um imóvel com a Emobe é sinônimo e transparência e agilidade", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Dados das etapas
    const etapas = [
      { num: "1", titulo: "APROVAÇÃO DE CRÉDITO", desc: "Nesta fase, o banco analisa sua documentação e capacidade de pagamento para aprovar o crédito do financiamento.", cor: [34, 139, 34] },
      { num: "2", titulo: "ENGENHARIA", desc: "Nesta fase, o banco analisa sua documentação e capacidade de pagamento para aprovar o crédito do financiamento.", cor: [144, 238, 144] },
      { num: "3", titulo: "CONTRATO JUNTO AO BANCO", desc: "Com o laudo aprovado, o contrato é emitido pela Caixa. Essa é a etapa em que o financiamento é formalizado.", cor: [152, 251, 152] },
      { num: "4", titulo: "ITBI", desc: "O ITBI é o imposto de transmissão pago à Prefeitura antes do registro do contrato. É uma etapa obrigatória.", cor: [95, 158, 160] },
      { num: "5", titulo: "REGISTRO", desc: "Depois do pagamento do ITBI, o contrato é levado ao cartório para registro, tornando o imóvel oficialmente em seu nome", cor: [176, 196, 222] },
      { num: "6", titulo: "ENTREGA DAS CHAVES", desc: "Com tudo registrado e liberado pela Caixa, é hora de receber as chaves e realizar o sonho da casa própria!", cor: [100, 116, 139] },
    ];

    // Renderizar etapas em 2 colunas
    const colWidth = (pageWidth - 30) / 2;
    const colX1 = 15;
    const colX2 = colX1 + colWidth + 5;

    for (let i = 0; i < etapas.length; i++) {
      const etapa = etapas[i];
      const isRightCol = i % 2 === 1;
      const xPos = isRightCol ? colX2 : colX1;

      if (i % 2 === 0 && i > 0) {
        yPos += 55;
      }

      // Cabeçalho da etapa com número e título
      doc.setFillColor(...etapa.cor);
      doc.rect(xPos, yPos, colWidth - 5, 8, "F");

      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(etapa.num, xPos + 3, yPos + 6);
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(etapa.titulo, xPos + 10, yPos + 6);

      // Descrição
      doc.setFont(undefined, "normal");
      doc.setFontSize(8);
      doc.setTextColor(63, 63, 70);
      const descLines = doc.splitTextToSize(etapa.desc, colWidth - 10);
      doc.text(descLines, xPos + 3, yPos + 14);
    }

    // ========== PÁGINA 3: INFORMAÇÕES FINAIS ==========
    doc.addPage();
    yPos = 40;

    // Logo e nome da empresa (simulado com texto)
    doc.setFontSize(28);
    doc.setTextColor(34, 139, 34);
    doc.text("EMOBE", pageWidth / 2, yPos, { align: "center" });
    yPos += 12;

    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    doc.text("CRECI 4682J", pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("EMPREENDIMENTOS IMOBILIÁRIOS", pageWidth / 2, yPos, { align: "center" });
    yPos += 12;

    doc.setFontSize(11);
    doc.setTextColor(63, 63, 70);
    doc.text("O imóvel dos seus sonhos está aqui", pageWidth / 2, yPos, { align: "center" });
    yPos += 30;

    // Informações finais
    doc.setFontSize(10);
    doc.setTextColor(24, 24, 27);
    doc.setFont(undefined, "bold");
    doc.text("PRÓXIMOS PASSOS:", 15, yPos);
    yPos += 8;

    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    const proximosPassos = [
      "1. Entre em contato conosco para iniciar o processo de financiamento",
      "2. Apresente a documentação necessária para análise de crédito",
      "3. Aguarde a aprovação do banco e liberação do crédito",
      "4. Acompanhe todas as etapas do processo através do nosso portal",
      "5. Realize o sonho de ter a casa própria!",
    ];

    doc.setTextColor(63, 63, 70);
    proximosPassos.forEach((passo) => {
      doc.text(passo, 15, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Contato
    doc.setFontSize(10);
    doc.setTextColor(24, 24, 27);
    doc.setFont(undefined, "bold");
    doc.text("CONTATO:", 15, yPos);
    yPos += 7;

    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    doc.setTextColor(63, 63, 70);
    doc.text("Estamos à disposição para tirar suas dúvidas e orientá-lo durante todo o processo.", 15, yPos);
    yPos += 5;
    doc.text("Visite nosso site: www.emobe.com.br", 15, yPos);
    yPos += 5;
    doc.text("Email: contato@emobe.com.br", 15, yPos);
    yPos += 5;
    doc.text("WhatsApp: (11) 9999-9999", 15, yPos);

    // Gerar PDF
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="simulacao-${clienteNome.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
