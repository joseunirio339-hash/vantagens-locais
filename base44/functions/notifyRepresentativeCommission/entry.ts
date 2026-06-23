import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Payload da automação de entidade
    const payload = await req.json();
    const commission = payload.data;
    if (!commission) {
      return Response.json({ error: 'No commission data' }, { status: 400 });
    }

    // Buscar dados do representante
    const reps = await base44.asServiceRole.entities.Representative.filter({
      id: commission.representative_id
    });
    if (reps.length === 0) {
      console.log('Representative not found for commission');
      return Response.json({ skipped: true, reason: 'Representative not found' });
    }

    const rep = reps[0];

    // Nome amigável do plano
    const planNames = {
      user: 'Usuário (R$ 19,99)',
      stander: 'Stander (R$ 99,99)',
      lojista: 'Lojista (R$ 49,99)',
      partner: 'Partner (R$ 149,99)',
      empreendedor: 'Empreendedor (R$ 29,99)'
    };

    const planLabel = planNames[commission.subscription_type] || commission.subscription_type;
    const commissionValue = commission.commission_amount?.toFixed(2).replace('.', ',') || '0,00';
    const planPrice = commission.subscription_price?.toFixed(2).replace('.', ',') || '0,00';

    // Enviar e-mail para o representante
    const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900;">💰 NOVA VENDA! 🎉</h1>
    <p style="color: #e9d5ff; margin: 8px 0 0; font-size: 14px;">Clube Max Descontos — Portal do Representante</p>
  </div>

  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Olá, <strong>${rep.name}</strong>! 👋</p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
      🚀 <strong>Parabéns!</strong> Um cliente acabou de assinar usando o seu link de representante. 
      Veja os detalhes da sua nova comissão:
    </p>

    <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #059669; font-size: 13px; margin: 0 0 8px; font-weight: 600;">SUA COMISSÃO</p>
      <p style="font-size: 36px; font-weight: 900; color: #065f46; margin: 0;">R$ ${commissionValue}</p>
      <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">5% de comissão sobre a venda</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">👤 Cliente</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${commission.customer_email}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">📦 Plano contratado</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${planLabel}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">💵 Valor do plano</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">R$ ${planPrice}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">📊 Sua comissão (5%)</td>
        <td style="padding: 10px 0; font-weight: 900; color: #059669; font-size: 16px; text-align: right;">R$ ${commissionValue}</td>
      </tr>
    </table>

    <div style="background: #fef9c3; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin-top: 16px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        📌 <strong>Importante:</strong> Acompanhe todas as suas vendas e comissões acessando o 
        <a href="https://app.clubemaxdescontos.com.br/RepresentativePortal" style="color: #92400e; font-weight: 600;">Portal do Representante</a>.
      </p>
    </div>

    <div style="text-align: center; margin-top: 28px;">
      <a href="https://app.clubemaxdescontos.com.br/RepresentativePortal" 
         style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
        📊 Ver Painel de Vendas
      </a>
    </div>

    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
      Clube Max Descontos — Seu link, suas vendas, sua renda 💰
    </p>
  </div>
</div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: rep.email,
      subject: `💰 Nova venda! R$ ${commissionValue} de comissão — ${commission.customer_email}`,
      body: emailBody,
      from_name: 'Clube Max Descontos'
    });

    console.log(`Notification sent to representative ${rep.name} (${rep.email}) for commission R$ ${commissionValue}`);

    return Response.json({ success: true, representative: rep.name, commission: commissionValue });
  } catch (error) {
    console.error('Error in notifyRepresentativeCommission:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});