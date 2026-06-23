import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';

function buildRows(vouchers, products) {
  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));
  return vouchers.map(v => ({
    codigo: v.code || '-',
    produto: v.product_name || productMap[v.product_id] || '-',
    cliente: v.user_name || '-',
    cpf: v.user_cpf || '-',
    valorOriginal: v.original_price != null ? `R$ ${Number(v.original_price).toFixed(2).replace('.', ',')}` : '-',
    valorDesconto: v.discount_price != null ? `R$ ${Number(v.discount_price).toFixed(2).replace('.', ',')}` : '-',
    status: v.status === 'used' ? 'Utilizado' : v.status === 'pending' ? 'Pendente' : 'Expirado',
    dataGeracao: v.created_date ? format(new Date(v.created_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
    dataUso: v.used_at ? format(new Date(v.used_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
  }));
}

export default function ExportSalesButton({ vouchers, products, views = [], partnerName }) {
  const [loading, setLoading] = useState(null);

  const exportExcel = () => {
    setLoading('excel');
    const rows = buildRows(vouchers, products);
    const headers = ['Código', 'Produto', 'Cliente', 'CPF', 'Preço Original', 'Preço c/ Desconto', 'Status', 'Data Geração', 'Data Uso'];
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => [
        r.codigo, r.produto, r.cliente, r.cpf,
        r.valorOriginal, r.valorDesconto, r.status, r.dataGeracao, r.dataUso
      ].map(v => `"${v}"`).join(';'))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${partnerName?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(null);
  };

  const exportPDF = () => {
    setLoading('pdf');
    const rows = buildRows(vouchers, products);
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFillColor(109, 40, 217);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório de Vendas — ${partnerName || 'Parceiro'}`, 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 230, 13);

    const used = vouchers.filter(v => v.status === 'used');
    const totalRevenue = used.reduce((s, v) => s + (v.discount_price || 0), 0);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Vouchers: ${vouchers.length}   |   Utilizados: ${used.length}   |   Receita Total: R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, 14, 30);

    const colX = [14, 50, 95, 130, 158, 185, 214, 238, 265];
    const colLabels = ['Código', 'Produto', 'Cliente', 'CPF', 'Original', 'Desconto', 'Status', 'Geração', 'Uso'];
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 35, 270, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    colLabels.forEach((label, i) => doc.text(label, colX[i], 41));

    doc.setFont('helvetica', 'normal');
    let y = 50;
    rows.forEach((r, idx) => {
      if (y > 185) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 270, 8, 'F');
      }
      doc.setTextColor(30, 30, 30);
      const vals = [r.codigo, r.produto.substring(0, 18), r.cliente.substring(0, 16), r.cpf, r.valorOriginal, r.valorDesconto, r.status, r.dataGeracao, r.dataUso];
      vals.forEach((val, i) => doc.text(String(val), colX[i], y));
      y += 8;
    });

    doc.save(`vendas_${partnerName?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    setLoading(null);
  };

  const exportFullReport = () => {
    setLoading('full');
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthLabel = format(now, 'MMMM yyyy', { locale: ptBR });

    // Filter month data
    const monthVouchers = vouchers.filter(v => {
      const d = new Date(v.created_date);
      return d >= monthStart && d <= monthEnd;
    });
    const usedThisMonth = monthVouchers.filter(v => v.status === 'used');
    const viewsThisMonth = views.filter(v => v.created_date && new Date(v.created_date) >= monthStart);

    const totalRevenue = usedThisMonth.reduce((s, v) => s + (v.discount_price || 0), 0);
    const totalSavings = usedThisMonth.reduce((s, v) => s + ((v.original_price || 0) - (v.discount_price || 0)), 0);
    const convRate = viewsThisMonth.length > 0 ? ((monthVouchers.length / viewsThisMonth.length) * 100).toFixed(1) : '0';

    // Top products by views
    const productViews = {};
    viewsThisMonth.forEach(v => {
      productViews[v.product_id] = (productViews[v.product_id] || 0) + 1;
    });
    const topProducts = products
      .map(p => ({
        name: p.name,
        clicks: productViews[p.id] || 0,
        vouchers: monthVouchers.filter(v => v.product_id === p.id).length,
        revenue: usedThisMonth.filter(v => v.product_id === p.id).reduce((s, v) => s + (v.discount_price || 0), 0),
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
    const W = 210;
    let y = 0;

    // Header
    doc.setFillColor(109, 40, 217);
    doc.rect(0, 0, W, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Mensal Completo', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${partnerName || 'Parceiro'} — ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`, 14, 23);
    doc.setFontSize(8);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, W - 14, 23, { align: 'right' });
    y = 38;

    // KPIs
    doc.setFillColor(248, 245, 255);
    doc.roundedRect(14, y, W - 28, 32, 4, 4, 'F');
    doc.setTextColor(109, 40, 217);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Indicadores do Mês', 20, y + 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Vouchers gerados: ${monthVouchers.length}    |    Utilizados: ${usedThisMonth.length}    |    Receita: R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, 20, y + 16);
    doc.text(`Visualizações: ${viewsThisMonth.length}    |    Taxa de conversão: ${convRate}%    |    Economia p/ clientes: R$ ${totalSavings.toFixed(2).replace('.', ',')}`, 20, y + 23);
    y += 40;

    // Top products by clicks
    if (topProducts.some(p => p.clicks > 0)) {
      doc.setTextColor(109, 40, 217);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('🏆 Produtos com Mais Cliques e Vendas', 14, y);
      y += 8;

      // Table header
      doc.setFillColor(233, 213, 255);
      doc.rect(14, y, W - 28, 8, 'F');
      doc.setTextColor(88, 28, 135);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Produto', 17, y + 5.5);
      doc.text('Cliques', 110, y + 5.5, { align: 'center' });
      doc.text('Vouchers', 140, y + 5.5, { align: 'center' });
      doc.text('Receita', W - 15, y + 5.5, { align: 'right' });
      y += 9;

      topProducts.forEach((p, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
          doc.setFillColor(250, 245, 255);
          doc.rect(14, y - 1, W - 28, 8, 'F');
        }
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(p.name.substring(0, 40), 17, y + 4.5);
        doc.text(String(p.clicks), 110, y + 4.5, { align: 'center' });
        doc.text(String(p.vouchers), 140, y + 4.5, { align: 'center' });
        doc.text(`R$ ${p.revenue.toFixed(2).replace('.', ',')}`, W - 15, y + 4.5, { align: 'right' });
        y += 8;
      });
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
      doc.text(`Clube Max Descontos — Relatório Mensal • ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`, 14, 291);
      doc.text(`Página ${i} de ${pageCount}`, W - 14, 291, { align: 'right' });
    }

    doc.save(`relatorio_mensal_${partnerName?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM')}.pdf`);
    setLoading(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportFullReport} className="gap-2 cursor-pointer">
          <BarChart3 className="w-4 h-4 text-violet-600" />
          Relatório Mensal Completo (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-red-500" />
          Vendas Detalhadas (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar como Excel / CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}