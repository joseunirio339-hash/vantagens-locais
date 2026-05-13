import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, data } = await req.json();

    // Templates de e-mail
    const templates = {

      // E-mail para o CLIENTE quando gera voucher
      voucher_generated: {
        to: data.user_email,
        subject: `🎟️ Seu voucher "${data.product_name}" está pronto! - Clube Max Descontos`,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900;">🛍️ CLUBE MAX DESCONTOS</h1>
    <p style="color: #fef3c7; margin: 8px 0 0; font-size: 14px;">Seu voucher foi gerado com sucesso!</p>
  </div>
  
  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Olá, <strong>${data.user_name || 'Cliente'}</strong>! 👋</p>
    <p style="color: #6b7280; font-size: 14px;">Seu voucher de desconto está pronto. Veja os detalhes abaixo:</p>

    <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #059669; font-size: 13px; margin: 0 0 8px; font-weight: 600;">CÓDIGO DO VOUCHER</p>
      <p style="font-size: 32px; font-weight: 900; color: #065f46; letter-spacing: 6px; font-family: monospace; margin: 0;">${data.voucher_code}</p>
      <p style="color: #6b7280; font-size: 12px; margin: 12px 0 0;">Válido até ${data.expires_at}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Estabelecimento</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${data.partner_name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Produto</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${data.product_name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Preço original</td>
        <td style="padding: 10px 0; font-weight: 600; color: #9ca3af; font-size: 14px; text-align: right; text-decoration: line-through;">R$ ${data.original_price}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">💰 Você paga</td>
        <td style="padding: 10px 0; font-weight: 900; color: #059669; font-size: 18px; text-align: right;">R$ ${data.discount_price}</td>
      </tr>
    </table>

    <div style="background: #fef9c3; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin-top: 16px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        📌 <strong>Como usar:</strong> Apresente este código (ou o QR Code no app) diretamente no estabelecimento para garantir seu desconto.
      </p>
    </div>

    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 28px;">
      Clube Max Descontos — Economize no comércio local 🛒
    </p>
  </div>
</div>
        `
      },

      // E-mail para o PARCEIRO quando voucher é usado
      voucher_used: {
        to: data.partner_email,
        subject: `✅ Voucher utilizado na sua loja! - Clube Max Descontos`,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #7c3aed, #db2777); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900;">🏪 CLUBE MAX DESCONTOS</h1>
    <p style="color: #e9d5ff; margin: 8px 0 0; font-size: 14px;">Painel do Parceiro</p>
  </div>

  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Olá, <strong>${data.partner_name}</strong>! 👋</p>
    <p style="color: #6b7280; font-size: 14px;">Um voucher foi utilizado na sua loja agora há pouco. Confira os detalhes:</p>

    <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #1e40af; font-size: 13px; margin: 0 0 6px; font-weight: 600;">CÓDIGO UTILIZADO</p>
      <p style="font-size: 28px; font-weight: 900; color: #1d4ed8; letter-spacing: 4px; font-family: monospace; margin: 0;">${data.voucher_code}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Cliente</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${data.user_name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Produto</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${data.product_name}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Valor da venda</td>
        <td style="padding: 10px 0; font-weight: 900; color: #059669; font-size: 18px; text-align: right;">R$ ${data.discount_price}</td>
      </tr>
    </table>

    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 28px;">
      Clube Max Descontos — Gerando vendas para o seu negócio 🚀
    </p>
  </div>
</div>
        `
      },

      // E-mail para PARCEIRO quando novo voucher é gerado (cliente interessado)
      new_voucher_partner: {
        to: data.partner_email,
        subject: `🎟️ Novo voucher gerado para "${data.product_name}"! - Clube Max Descontos`,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #059669, #0891b2); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900;">🏪 CLUBE MAX DESCONTOS</h1>
    <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 14px;">Nova venda em andamento!</p>
  </div>

  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Olá, <strong>${data.partner_name}</strong>! 🎉</p>
    <p style="color: #6b7280; font-size: 14px;">Um cliente gerou um voucher para o seu produto. Fique preparado para atendê-lo:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Cliente</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${data.user_name || 'Não informado'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Produto</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${data.product_name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Quantidade</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${data.quantity}x</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Valor esperado</td>
        <td style="padding: 10px 0; font-weight: 900; color: #059669; font-size: 18px; text-align: right;">R$ ${data.discount_price}</td>
      </tr>
    </table>

    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 28px;">
      Clube Max Descontos — Gerando vendas para o seu negócio 🚀
    </p>
  </div>
</div>
        `
      }
    };

    const template = templates[type];
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: template.to,
      subject: template.subject,
      body: template.body,
      from_name: 'Clube Max Descontos'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});