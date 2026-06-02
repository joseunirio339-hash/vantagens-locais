import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { format, subDays, isAfter, parseISO, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';

function formatBRL(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

export default function ExportPerformanceButton({ partner, products, vouchers, views, reviews, periodDays }) {
  const [loading, setLoading] = useState(false);

  const exportPDF = () => {
    setLoading(true);

    const periodLabel = periodDays === 7 ? 'Semanal (7 dias)' : periodDays === 30 ? 'Mensal (30 dias)' : 'Trimestral (90 dias)';
    const cutoff = subDays(new Date(), periodDays);

    const usedInPeriod = vouchers.filter(v => v.status === 'used' && v.used_at && isAfter(parseISO(v.used_at), cutoff));
    const generatedInPeriod = vouchers.filter(v => v.created_date && isAfter(parseISO(v.created_date), cutoff));
    const reviewsInPeriod = reviews.filter(r => r.created_date && isAfter(parseISO(r.created_date), cutoff));
    const viewsInPeriod = views.filter(v => v.created_date && isAfter(parseISO(v.created_date), cutoff));

    const totalRevenue = usedInPeriod.reduce((s, v) => s + (v.discount_price || 0), 0);
    const avgRating = reviewsInPeriod.length > 0
      ? (reviewsInPeriod.reduce((s, r) => s + r.rating, 0) / reviewsInPeriod.length).toFixed(2)
      : '—';
    const conversionRate = viewsInPeriod.length > 0
      ? ((generatedInPeriod.length / viewsInPeriod.length) * 100).toFixed(1) + '%'
      : '0%';

    // Monthly breakdown (last 3 months)
    const last3Months = [2, 1, 0].map(offset => {
      const ref = subMonths(new Date(), offset);
      const start = startOfMonth(ref);
      const end = endOfMonth(ref);
      const label = format(ref, 'MMMM/yyyy', { locale: ptBR });
      const mv = vouchers.filter(v => v.status === 'used' && v.used_at && new Date(v.used_at) >= start && new Date(v.used_at) <= end);
      return {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        used: mv.length,
        revenue: mv.reduce((s, v) => s + (v.discount_price || 0), 0),
      };
    });

    // Top products in period
    const topProducts = products
      .map(p => ({
        name: p.name,
        used: usedInPeriod.filter(v => v.product_id === p.id).length,
        revenue: usedInPeriod.filter(v => v.product_id === p.id).reduce((s, v) => s + (v.discount_price || 0), 0),
      }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 8);

    // --- Build PDF ---
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
    const W = 210;
    let y = 0;

    // Header band
    doc.setFillColor(109, 40, 217);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Performance', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${partner?.business_name || 'Parceiro'} — ${periodLabel}`, 14, 21);
    doc.setFontSize(9);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, W - 14, 21, { align: 'right' });
    y = 36;

    // KPI section title
    doc.setTextColor(109, 40, 217);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores do Período', 14, y);
    y += 6;

    // KPI cards (2x2 grid)
    const kpis = [
      { label: 'Vouchers Resgatados', value: String(usedInPeriod.length) },
      { label: 'Vouchers Gerados', value: String(generatedInPeriod.length) },
      { label: 'Receita Total', value: formatBRL(totalRevenue) },
      { label: 'Taxa de Conversão', value: conversionRate },
      { label: 'Visualizações', value: String(viewsInPeriod.length) },
      { label: 'Média de Avaliações', value: `${avgRating} ★` },
    ];

    const kpiW = (W - 28 - 10) / 3;
    kpis.forEach((kpi, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const kx = 14 + col * (kpiW + 5);
      const ky = y + row * 22;
      doc.setFillColor(248, 245, 255);
      doc.roundedRect(kx, ky, kpiW, 18, 3, 3, 'F');
      doc.setTextColor(109, 40, 217);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value, kx + kpiW / 2, ky + 10, { align: 'center' });
      doc.setTextColor(120, 100, 160);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, kx + kpiW / 2, ky + 16, { align: 'center' });
    });
    y += 50;

    // Monthly comparison
    doc.setTextColor(109, 40, 217);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Comparativo Mensal (Últimos 3 Meses)', 14, y);
    y += 6;

    const mColW = (W - 28 - 10) / 3;
    last3Months.forEach((m, i) => {
      const mx = 14 + i * (mColW + 5);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(mx, y, mColW, 22, 3, 3, 'F');
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(m.label, mx + mColW / 2, y + 7, { align: 'center' });
      doc.setFontSize(12);
      doc.text(String(m.used), mx + mColW / 2, y + 15, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(21, 128, 61);
      doc.text(formatBRL(m.revenue), mx + mColW / 2, y + 20, { align: 'center' });
    });
    y += 32;

    // Top products table
    if (topProducts.length > 0) {
      doc.setTextColor(109, 40, 217);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Produtos com Mais Vendas no Período', 14, y);
      y += 6;

      // Table header
      doc.setFillColor(233, 213, 255);
      doc.rect(14, y, W - 28, 8, 'F');
      doc.setTextColor(88, 28, 135);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Produto', 17, y + 5.5);
      doc.text('Vouchers Usados', 130, y + 5.5, { align: 'center' });
      doc.text('Receita', W - 15, y + 5.5, { align: 'right' });
      y += 9;

      topProducts.forEach((p, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
          doc.setFillColor(250, 245, 255);
          doc.rect(14, y - 1, W - 28, 8, 'F');
        }
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(p.name.substring(0, 45), 17, y + 4.5);
        doc.text(String(p.used), 130, y + 4.5, { align: 'center' });
        doc.text(formatBRL(p.revenue), W - 15, y + 4.5, { align: 'right' });
        y += 8;
      });
      y += 6;
    }

    // Weekly breakdown (if period >= 7 days)
    if (periodDays <= 30) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setTextColor(109, 40, 217);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento Semanal', 14, y);
      y += 6;

      const weeks = Math.ceil(periodDays / 7);
      for (let w = 0; w < weeks; w++) {
        const wEnd = subDays(new Date(), w * 7);
        const wStart = subDays(new Date(), (w + 1) * 7 - 1);
        const wLabel = `${format(wStart, 'dd/MM', { locale: ptBR })} – ${format(wEnd, 'dd/MM', { locale: ptBR })}`;
        const wVouchers = usedInPeriod.filter(v => {
          if (!v.used_at) return false;
          const d = new Date(v.used_at);
          return d >= wStart && d <= wEnd;
        });
        const wRevenue = wVouchers.reduce((s, v) => s + (v.discount_price || 0), 0);

        if (y > 270) { doc.addPage(); y = 20; }
        if (w % 2 === 0) {
          doc.setFillColor(248, 245, 255);
          doc.rect(14, y - 1, W - 28, 8, 'F');
        }
        doc.setTextColor(60, 60, 80);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Semana ${w + 1}: ${wLabel}`, 17, y + 4.5);
        doc.text(`${wVouchers.length} vendas`, 130, y + 4.5, { align: 'center' });
        doc.text(formatBRL(wRevenue), W - 15, y + 4.5, { align: 'right' });
        y += 8;
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(245, 243, 255);
      doc.rect(0, 285, W, 12, 'F');
      doc.setTextColor(140, 100, 200);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Clube Max Descontos — Relatório Confidencial', 14, 291);
      doc.text(`Página ${i} de ${pageCount}`, W - 14, 291, { align: 'right' });
    }

    doc.save(`performance_${partner?.business_name?.replace(/\s+/g, '_')}_${periodLabel.split(' ')[0].toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      onClick={exportPDF}
      disabled={loading}
      className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <FileText className="w-4 h-4" />
      }
      Exportar PDF
    </Button>
  );
}