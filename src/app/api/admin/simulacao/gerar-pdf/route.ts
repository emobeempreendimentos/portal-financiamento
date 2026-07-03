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
    const tipoImovelLabel = {
      novo: "Imóvel Novo",
      usado: "Imóvel Usado",
      lote_construcao: "Lote + Construção",
      lote: "Lote",
    }[tipoImovel] || tipoImovel;

    const sistemaAmortizacaoLabel = sistemaAmortizacao === "price" ? "Price (Parcelas Fixas)" : "SAC (Parcelas Decrescentes)";
    const taxaPeriodoLabel = taxaPeriodo === "ano" ? "ao ano" : "ao mês";

    const simulacaoData = [
      ["Campo", "Valor"],
      ["Tipo de Financiamento", tipoFinanciamentoLabel],
      ["Tipo de Imóvel", tipoImovelLabel],
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

    // Data e número da página
    doc.setFontSize(7);
    doc.setTextColor(161, 161, 170); // zinc-400
    doc.text(`Página ${doc.internal.pages.length - 1}`, pageWidth - 20, pageHeight - 5, { align: "right" });

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
