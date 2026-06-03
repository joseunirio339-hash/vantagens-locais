import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Permite chamada por automação (sem auth) ou por admin
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Define o mês anterior
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const monthLabel = monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Busca todos os parceiros ativos
    const partners = await base44.asServiceRole.entities.Partner.filter({ subscription_status: 'active' });

    // Busca todos os vouchers usados no mês anterior
    const allVouchers = await base44.asServiceRole.entities.Voucher.filter({ status: 'used' });
    const monthVouchers = allVouchers.filter(v => {
      const d = new Date(v.used_at || v.updated_date);
      return d >= monthStart && d <= monthEnd;
    });

    // Todos os vouchers históricos (para identificar clientes novos)
    const allUsedEver = allVouchers;

    let sent = 0;

    for (const partner of partners) {
      if (!partner.owner_email) continue;

      const partnerVouchers = monthVouchers.filter(v => v.partner_id === partner.id);
      const totalVouchers = partnerVouchers.length;
      const totalRevenue = partnerVouchers.reduce((s, v) => s + (v.discount_price || 0), 0);
      const totalSavings = partnerVouchers.reduce((s, v) => s + ((v.original_price || 0) - (v.discount_price || 0)), 0);

      // Clientes que usaram voucher neste parceiro ANTES do mês atual
      const previousClients = new Set(
        allUsedEver
          .filter(v => v.partner_id === partner.id && new Date(v.used_at || v.updated_date) < monthStart)
          .map(v => v.user_email)
          .filter(Boolean)
      );

      // Clientes do mês
      const monthClients = new Set(partnerVouchers.map(v => v.user_email).filter(Boolean));

      // Novos clientes = compraram este mês mas nunca tinham comprado antes
      const newClients = [...monthClients].filter(email => !previousClients.has(email)).length;

      // Produtos mais vendidos
      const byProduct = {};
      for (const v of partnerVouchers) {
        const key = v.product_name || 'Produto';
        if (!byProduct[key]) byProduct[key] = { qty: 0, revenue: 0 };
        byProduct[key].qty += 1;
        byProduct[key].revenue += (v.discount_price || 0);
      }

      const topProducts = Object.entries(byProduct)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 5);

      const productRows = topProducts.map(([name, d], i) =>
        `<tr style="background:${i % 2 === 0 ? '#f8fafc' : 'white'}">
          <td style="padding:10px 12px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;">
            ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`} ${name}
          </td>
          <td style="padding:10px 12px;text-align:center;font-size:13px;font-weight:700;color:#7c3aed;border-bottom:1px solid #e5e7eb;">${d.qty}</td>
          <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:700;color:#059669;border-bottom:1px solid #e5e7eb;">R$ ${d.revenue.toFixed(2).replace('.', ',')}</td>
        </tr>`
      ).join('');

      const noSalesBlock = totalVouchers === 0
        ? `<div style="background:#fef9c3;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;font-size:14px;color:#92400e;">😴 Nenhum voucher utilizado em ${monthLabel}. Que tal criar uma promoção especial para o próximo mês?</p>
           </div>`
        : '';

      const body = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:36px 32px;text-align:center;border-radius:12px 12px 0 0;">
    <p style="color:#e9d5ff;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px;">Relatório Mensal</p>
    <h1 style="color:white;margin:0;font-size:26px;font-weight:900;">📊 Resumo de ${monthLabel}</h1>
    <p style="color:#e9d5ff;margin:8px 0 0;font-size:14px;">Clube Max Descontos — Painel do Parceiro</p>
  </div>

  <!-- Body -->
  <div style="background:white;padding:32px;border-radius:0 0 12px 12px;">
    <p style="color:#374151;font-size:16px;margin-bottom:4px;">Olá, <strong>${partner.business_name}</strong>! 👋</p>
    <p style="color:#6b7280;font-size:14px;margin-top:0;">Aqui está o resumo completo do desempenho da sua loja em <strong>${monthLabel}</strong>:</p>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px;text-align:center;">
        <p style="font-size:32px;font-weight:900;color:#065f46;margin:0;">${totalVouchers}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">🎟️ Vouchers utilizados</p>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;text-align:center;">
        <p style="font-size:24px;font-weight:900;color:#1e40af;margin:0;">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">💰 Receita gerada</p>
      </div>
      <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:18px;text-align:center;">
        <p style="font-size:32px;font-weight:900;color:#7e22ce;margin:0;">${newClients}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">🆕 Novos clientes</p>
      </div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:18px;text-align:center;">
        <p style="font-size:24px;font-weight:900;color:#c2410c;margin:0;">R$ ${totalSavings.toFixed(2).replace('.', ',')}</p>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">🎁 Economia p/ clientes</p>
      </div>
    </div>

    ${noSalesBlock}

    <!-- Top Produtos -->
    ${topProducts.length > 0 ? `
    <div style="margin-top:24px;">
      <h3 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 12px;">🏆 Produtos mais vendidos</h3>
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="text-align:left;font-size:11px;color:#9ca3af;padding:8px 12px;text-transform:uppercase;letter-spacing:0.5px;">Produto</th>
            <th style="text-align:center;font-size:11px;color:#9ca3af;padding:8px 12px;text-transform:uppercase;">Qtd</th>
            <th style="text-align:right;font-size:11px;color:#9ca3af;padding:8px 12px;text-transform:uppercase;">Receita</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>
    </div>
    ` : ''}

    <!-- Dica -->
    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:14px 16px;border-radius:6px;margin-top:24px;">
      <p style="margin:0;font-size:13px;color:#065f46;">
        💡 <strong>Dica:</strong> Acesse seu painel para ver análises detalhadas, adicionar novos produtos e acompanhar agendamentos em tempo real.
      </p>
    </div>

    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:28px;border-top:1px solid #f1f5f9;padding-top:16px;">
      Clube Max Descontos · Conectando descontos a você 🛍️<br/>
      <span style="font-size:10px;">Para cancelar o recebimento deste e-mail, entre em contato com o suporte.</span>
    </p>
  </div>
</div>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: partner.owner_email,
        subject: `📊 Resumo Mensal de ${monthLabel} — ${partner.business_name}`,
        body,
        from_name: 'Clube Max Descontos'
      });

      console.log(`Resumo mensal enviado para ${partner.business_name} (${partner.owner_email})`);
      sent++;
    }

    return Response.json({ success: true, sent, month: monthLabel });
  } catch (error) {
    console.error('Erro no relatório mensal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});