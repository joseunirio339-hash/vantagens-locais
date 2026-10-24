import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Validação de voucher pelo QR Code, feita no servidor.
// O dono da loja é identificado pela sessão e só ele pode marcar o voucher como usado.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ success: false, message: 'Entre na sua conta de parceiro para validar.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim().toUpperCase();
    if (!code) {
      return Response.json({ success: false, message: 'Código não informado.' }, { status: 400 });
    }

    const partners = await base44.asServiceRole.entities.Partner.filter({ owner_email: user.email });
    const partner = partners[0];
    if (!partner) {
      return Response.json({ success: false, message: 'Nenhuma loja vinculada a esta conta.' }, { status: 403 });
    }

    const vouchers = await base44.asServiceRole.entities.Voucher.filter({ code });
    const voucher = vouchers[0];
    if (!voucher) {
      return Response.json({ success: false, message: 'Voucher não encontrado.' });
    }

    if (voucher.partner_id !== partner.id) {
      return Response.json({ success: false, message: 'Este voucher não pertence ao seu estabelecimento.' });
    }

    if (voucher.status === 'used') {
      return Response.json({ success: false, voucher, message: 'Voucher já foi utilizado.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (voucher.status === 'expired' || (voucher.expires_at && voucher.expires_at < today)) {
      return Response.json({ success: false, voucher, message: 'Voucher expirado.' });
    }

    const updated = await base44.asServiceRole.entities.Voucher.update(voucher.id, {
      status: 'used',
      used_at: new Date().toISOString()
    });

    await base44.asServiceRole.entities.Notification.create({
      partner_id: partner.id,
      partner_owner_email: partner.owner_email,
      type: 'voucher_used',
      title: '✅ Voucher Validado via QR Code!',
      message: `Voucher ${voucher.code} para "${voucher.product_name}" foi validado com sucesso via QR Code.`,
      is_read: false,
      reference_id: voucher.id
    });

    if (partner.owner_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: partner.owner_email,
        subject: `✅ Voucher validado: ${voucher.code}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #7322c3; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #fafafa; margin: 0; font-size: 22px;">✅ Voucher validado</h1>
            </div>
            <div style="background: #fefcf8; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">O voucher <strong>${voucher.code}</strong> foi validado com sucesso.</p>
              <p style="color: #64748b; font-size: 13px; margin: 0;">Produto: ${voucher.product_name || '-'} · Cliente: ${voucher.user_name || 'não informado'} · Valor: R$ ${Number(voucher.discount_price || 0).toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        `
      }).catch(err => console.warn('E-mail de voucher validado falhou:', err.message));
    }

    return Response.json({ success: true, voucher: updated, message: 'Voucher validado com sucesso!' });

  } catch (error) {
    console.error('validateVoucher error:', error.message);
    return Response.json({ success: false, message: 'Erro ao validar voucher. Tente novamente.' }, { status: 500 });
  }
}