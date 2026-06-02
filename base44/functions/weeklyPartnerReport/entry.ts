import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Apenas admins ou chamada interna (automação)
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Busca todos os parceiros ativos
    const partners = await base44.asServiceRole.entities.Partner.filter({ subscription_status: 'active' });

    // Busca todos os vouchers usados na última semana
    const allVouchers = await base44.asServiceRole.entities.Voucher.filter({ status: 'used' });
    const weekVouchers = allVouchers.filter(v => {
      const d = new Date(v.used_at || v.updated_date);
      return d >= weekStart && d <= now;
    });

    let sent = 0;

    for (const partner of partners) {
      if (!partner.owner_email) continue;

      const partnerVouchers = weekVouchers.filter(v => v.partner_id === partner.id);
      const totalVouchers = partnerVouchers.length;
      const totalRevenue = partnerVouchers.reduce((s, v) => s + (v.discount_price || 0), 0);
      const totalSavings = partnerVouchers.reduce((s, v) => s + ((v.original_price || 0) - (v.discount_price || 0)), 0);
      const uniqueClients = new Set(partnerVouchers.map(v => v.user_cpf).filter(Boolean)).size;

      const weekLabel = `${weekStart.toLocaleDateString('pt-BR')} a ${now.toLocaleDateString('pt-BR')}`;

      // Linha por produto
      const byProduct = {};
      for (const v of partnerVouchers) {
        const key = v.product_name || 'Produto';
        if (!byProduct[key]) byProduct[key] = { qty: 0, revenue: 0 };
        byProduct[key].qty += 1;
        byProduct[key].revenue += (v.discount_price || 0);
      }

      const productRows = Object.entries(byProduct)
        .map(([name, d]) =>
          `<tr>
            <td style="padding:8px 0;color:#374151;font-size:13px;border-bottom:1px solid #f1f5f9;">${name}</td>
            <td style="padding:8px 0;text-align:center;color:#374151;font-size:13px;border-bottom:1px solid #f1f5f9;">${d.qty}</td>
            <td style="padding:8px 0;text-align:right;color:#059669;font-size:13px;font-weight:700;border-bottom:1px solid #f1f5f9;">R$ ${d.revenue.toFixed(2).replace('.', ',')}</td>
          </tr>`
        ).join('');

      const noSalesBlock = totalVouchers === 0
        ? `<div style="background:#fef9c3;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:6px;margin:16px 0;">
            <p style="margin:0;font-size:13px;color:#92400e;">😴 Nenhuma venda registrada esta semana. Que tal criar uma nova promoção para atrair clientes?</p>
           </div>`
        : '';

      const body = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
  <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:24px;font-weight:900;">📊 Relatório Semanal</h1>
    <p style="color:#e9d5ff;margin:8px 0 0;font-size:13px;">Clube Max Descontos — ${weekLabel}</p>
  </div>

  <div style="background:white;padding:32px;border-radius:0 0 12px 12px;">
    <p style="color:#374151;font-size:15px;">Olá, <strong>${partner.business_name}</strong>! 👋</p>
    <p style="color:#6b7280;font-size:13px;">Aqui está o resumo das suas vendas via voucher da última semana:</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;text-align:center;">
        <p style="font-size:28px;font-weight:900;color:#065f46;margin:0;">${totalVouchers}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">🎟️ Vouchers resgatados</p>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;text-align:center;">
        <p style="font-size:22px;font-weight:900;color:#1e40af;margin:0;">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">💰 Receita gerada</p>
      </div>
      <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px;text-align:center;">
        <p style="font-size:22px;font-weight:900;color:#7e22ce;margin:0;">R$ ${totalSavings.toFixed(2).replace('.', ',')}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">🎁 Economia p/ clientes</p>
      </div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;text-align:center;">
        <p style="font-size:28px;font-weight:900;color:#c2410c;margin:0;">${uniqueClients}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">👤 Clientes únicos</p>
      </div>
    </div>

    ${noSalesBlock}

    ${productRows ? `
    <p style="font-size:13px;font-weight:600;color:#374151;margin-top:20px;">📦 Vendas por produto</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;color:#9ca3af;padding-bottom:6px;text-transform:uppercase;">Produto</th>
          <th style="text-align:center;font-size:11px;color:#9ca3af;padding-bottom:6px;text-transform:uppercase;">Qtd</th>
          <th style="text-align:right;font-size:11px;color:#9ca3af;padding-bottom:6px;text-transform:uppercase;">Receita</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>
    ` : ''}

    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:28px;">
      Clube Max Descontos · Acesse o painel para mais detalhes 🚀
    </p>
  </div>
</div>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: partner.owner_email,
        subject: `📊 Relatório Semanal — ${partner.business_name} (${weekLabel})`,
        body,
        from_name: 'Clube Max Descontos'
      });

      sent++;
    }

    console.log(`Relatório semanal enviado para ${sent} parceiros.`);
    return Response.json({ success: true, sent });
  } catch (error) {
    console.error('Erro no relatório semanal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});