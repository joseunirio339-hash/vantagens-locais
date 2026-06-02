import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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

export default function ExportSalesButton({ vouchers, products, partnerName }) {
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

    // Header
    doc.setFillColor(109, 40, 217);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório de Vendas — ${partnerName || 'Parceiro'}`, 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 230, 13);

    // Summary
    const used = vouchers.filter(v => v.status === 'used');
    const totalRevenue = used.reduce((s, v) => s + (v.discount_price || 0), 0);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Vouchers: ${vouchers.length}   |   Utilizados: ${used.length}   |   Receita Total: R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, 14, 30);

    // Table header
    const colX = [14, 50, 95, 130, 158, 185, 214, 238, 265];
    const colLabels = ['Código', 'Produto', 'Cliente', 'CPF', 'Original', 'Desconto', 'Status', 'Geração', 'Uso'];
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 35, 270, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    colLabels.forEach((label, i) => doc.text(label, colX[i], 41));

    // Table rows
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar como Excel / CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-red-500" />
          Exportar como PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}