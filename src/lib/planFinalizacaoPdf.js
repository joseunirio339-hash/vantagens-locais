import { jsPDF } from "jspdf";

const INK = [41, 37, 36];
const MUTED = [120, 113, 108];
const ACCENT = [217, 119, 6];
const BAND = [28, 25, 23];
const ZEBRA = [250, 249, 247];
const WHITE = [255, 255, 255];
const LINE = [231, 229, 228];
const SOFT = [214, 211, 209];

export const PLAN = {
  title: "Plano de Finalização",
  subtitle: "Descontos do Club Max — o que falta para entrar em produção",
  sections: [
    {
      title: "1. Bloqueador principal",
      kind: "table",
      note: "Sem este item, nenhuma função de servidor nem automação do aplicativo funciona.",
      columns: ["Item", "Responsável", "Prazo"],
      widths: [0.5, 0.25, 0.25],
      rows: [["Upgrade do plano (Builder+)", "Cliente", "Imediato"]],
    },
    {
      title: "2. Tarefas técnicas (após o upgrade)",
      kind: "table",
      columns: ["Tarefa", "Estimativa"],
      widths: [0.76, 0.24],
      rows: [
        [
          "Testar e corrigir o fluxo de pagamento ponta a ponta (checkout » webhook » assinatura ativa » comissão do representante)",
          "1 dia",
        ],
        ["Corrigir e reativar a automação de Relatório Semanal de Vendas", "0,5 dia"],
        ["Atualizar o relatório PDF do sistema", "0,5 a 1 dia"],
        ["Revisar e testar as demais automações (16 no total)", "1 dia"],
        ["Reativar a notificação de novos produtos e conquistas", "0,5 dia"],
        ["Ajustes finais apontados nos testes", "1 dia"],
      ],
      footer: "Subtotal estimado: cerca de 5 dias úteis.",
    },
    {
      title: "3. Pendências do cliente",
      kind: "bullets",
      items: [
        "Domínio próprio: hoje o aplicativo usa o link de testes. Após a configuração, a propagação leva de 24 a 48 horas.",
        "Conteúdo real dos parceiros: logo, cidade/bairro e categoria. Sem isso eles não aparecem bem na busca.",
        "Avaliações: estão zeradas e só se preenchem com uso real (ou com dados de exemplo).",
        "Revisão de textos: preços dos planos, Termos de Uso e Política de Privacidade.",
        "Conferir as chaves reais de pagamento e de e-mail em produção.",
      ],
    },
    {
      title: "4. Já concluído",
      kind: "checklist",
      items: [
        "Dados de fidelidade, cartões de selo, roletas de prêmios e feed de novidades populados.",
        "Favoritos, busca e filtros por estado, cidade e bairro.",
        "Portal do Representante com o modelo de 50% da 1ª mensalidade.",
        "Aplicativo do Vendedor com checkout próprio.",
        "Cadastro, edição e exclusão de usuários no painel administrativo.",
      ],
    },
    {
      title: "5. Prazo total",
      kind: "bullets",
      items: [
        "Upgrade do plano + configuração do domínio: 1 dia (cliente).",
        "Trabalho técnico: cerca de 5 dias úteis.",
        "Ajustes, testes e conteúdo real: de 3 a 4 dias úteis.",
        "Estimativa final: de 8 a 10 dias úteis, começando após o upgrade do plano.",
      ],
      footer: "O prazo técnico só começa a contar depois do upgrade do plano.",
    },
  ],
};

export function generatePlanFinalizacaoPdf() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin - 4) {
      doc.addPage();
      y = margin + 4;
    }
  };

  const wrap = (text, width) => doc.splitTextToSize(String(text), width);

  const drawTableHeader = (columns, widths) => {
    ensureSpace(21);
    const h = 9;
    doc.setFillColor(...BAND);
    doc.rect(margin, y, contentW, h, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...WHITE);
    let cx = margin + 3;
    columns.forEach((col, i) => {
      doc.text(col.toUpperCase(), cx, y + 6);
      cx += widths[i] * contentW;
    });
    y += h;
  };

  const drawTable = (section) => {
    const widths = section.widths.map((w) => w * contentW);
    drawTableHeader(section.columns, section.widths);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    section.rows.forEach((row, ri) => {
      const cellLines = row.map((cell, i) => wrap(cell, widths[i] - 6));
      const lines = Math.max(...cellLines.map((l) => l.length));
      const rowH = lines * 4.6 + 6;

      if (y + rowH > pageH - margin - 4) {
        doc.addPage();
        y = margin + 4;
        drawTableHeader(section.columns, section.widths);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
      }

      if (ri % 2 === 1) {
        doc.setFillColor(...ZEBRA);
        doc.rect(margin, y, contentW, rowH, "F");
      }

      doc.setTextColor(...INK);
      let cx = margin + 3;
      cellLines.forEach((cellText, i) => {
        doc.text(cellText, cx, y + 6.2);
        cx += widths[i];
      });
      y += rowH;
    });
  };

  const drawBullets = (section) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    section.items.forEach((item) => {
      const lines = wrap(item, contentW - 8);
      ensureSpace(lines.length * 5 + 4);
      doc.setFillColor(...ACCENT);
      doc.circle(margin + 1.4, y - 1.3, 1.1, "F");
      doc.setTextColor(...INK);
      doc.text(lines, margin + 6, y);
      y += lines.length * 5 + 3;
    });
  };

  const drawChecklist = (section) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    section.items.forEach((item) => {
      const lines = wrap(item, contentW - 8);
      ensureSpace(lines.length * 5 + 4);

      doc.setFillColor(...ACCENT);
      doc.rect(margin, y - 3.4, 3.4, 3.4, "F");
      doc.setDrawColor(...WHITE);
      doc.setLineWidth(0.55);
      doc.line(margin + 0.8, y - 1.7, margin + 1.5, y - 0.9);
      doc.line(margin + 1.5, y - 0.9, margin + 2.7, y - 2.6);

      doc.setTextColor(...INK);
      doc.text(lines, margin + 6, y);
      y += lines.length * 5 + 3;
    });
  };

  // Header band
  doc.setFillColor(...BAND);
  doc.rect(0, 0, pageW, 44, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 44, pageW, 1.6, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text(PLAN.title, margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...SOFT);
  doc.text(wrap(PLAN.subtitle, contentW), margin, 31);

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Emitido em ${today}`, margin, 39);

  let y = 60;

  PLAN.sections.forEach((section) => {
    ensureSpace(24);

    doc.setFillColor(...ACCENT);
    doc.rect(margin, y - 3.6, 2.4, 5.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...INK);
    doc.text(section.title, margin + 6, y);
    y += 7.5;

    if (section.note) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(...MUTED);
      const noteLines = wrap(section.note, contentW);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4.8 + 2;
    }

    if (section.kind === "table") {
      drawTable(section);
      y += 3;
      if (section.footer) {
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.2);
        doc.line(margin, y - 1, pageW - margin, y - 1);
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...ACCENT);
        doc.text(section.footer, margin, y + 4);
        y += 9;
      }
    } else if (section.kind === "bullets") {
      drawBullets(section);
      if (section.footer) {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...ACCENT);
        doc.text(wrap(section.footer, contentW), margin, y + 2);
        y += 9;
      }
    } else {
      drawChecklist(section);
    }

    y += 9;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 16, pageW - margin, pageH - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Descontos do Club Max — Vantagens Locais", margin, pageH - 11);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 11, { align: "right" });
  }

  doc.save("Plano_de_Finalizacao_Club_Max.pdf");
}