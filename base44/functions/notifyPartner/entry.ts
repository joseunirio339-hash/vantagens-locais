import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automations:
//  - Voucher: status changed to "used"
//  - Review: created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    if (!event || !data) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const entityName = event.entity_name;

    // ── VOUCHER VALIDATED ────────────────────────────────────────────────────
    if (entityName === 'Voucher') {
      const voucher = data;
      const partnerId = voucher.partner_id;
      if (!partnerId) return Response.json({ success: true, skipped: 'no partner_id' });

      // Get partner for email
      const partners = await base44.asServiceRole.entities.Partner.filter({ id: partnerId });
      const partner = partners[0];

      // In-app notification
      await base44.asServiceRole.entities.Notification.create({
        partner_id: partnerId,
        type: 'voucher_used',
        title: '✅ Voucher Resgatado!',
        message: `O cliente ${voucher.user_name || 'Não identificado'} resgatou o voucher "${voucher.product_name || voucher.code}" com sucesso.`,
        is_read: false,
        reference_id: event.entity_id
      });

      // E-mail notification
      if (partner?.owner_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: partner.owner_email,
          subject: `✅ Voucher resgatado em ${partner.business_name}`,
          body: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#059669">✅ Voucher Resgatado!</h2>
              <p>Um cliente acabou de resgatar um voucher na sua loja <strong>${partner.business_name}</strong>.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;background:#f1faf5;border-radius:6px;font-size:13px"><strong>Produto:</strong> ${voucher.product_name || '—'}</td></tr>
                <tr><td style="padding:8px;font-size:13px"><strong>Código:</strong> <code>${voucher.code}</code></td></tr>
                <tr><td style="padding:8px;background:#f1faf5;border-radius:6px;font-size:13px"><strong>Cliente:</strong> ${voucher.user_name || 'Não identificado'}</td></tr>
                <tr><td style="padding:8px;font-size:13px"><strong>Valor:</strong> R$ ${voucher.discount_price?.toFixed(2).replace('.', ',') || '—'}</td></tr>
              </table>
              <p style="color:#6b7280;font-size:12px">Acesse o Painel do Parceiro para ver todos os detalhes.</p>
            </div>
          `
        });
      }

      console.log(`notifyPartner: voucher_used notification sent for partner ${partnerId}`);
      return Response.json({ success: true, type: 'voucher_used' });
    }

    // ── NEW REVIEW ───────────────────────────────────────────────────────────
    if (entityName === 'Review') {
      const review = data;
      const partnerId = review.partner_id;
      if (!partnerId) return Response.json({ success: true, skipped: 'no partner_id' });

      const partners = await base44.asServiceRole.entities.Partner.filter({ id: partnerId });
      const partner = partners[0];

      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

      // In-app notification
      await base44.asServiceRole.entities.Notification.create({
        partner_id: partnerId,
        type: 'new_review',
        title: `⭐ Nova Avaliação Recebida!`,
        message: `${review.user_name || 'Um cliente'} avaliou sua loja com ${review.rating} estrelas (${stars}).${review.comment ? ` "${review.comment}"` : ''}`,
        is_read: false,
        reference_id: event.entity_id
      });

      // E-mail notification
      if (partner?.owner_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: partner.owner_email,
          subject: `⭐ Nova avaliação em ${partner.business_name}`,
          body: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#d97706">⭐ Nova Avaliação Recebida!</h2>
              <p>Sua loja <strong>${partner.business_name}</strong> recebeu uma nova avaliação.</p>
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0 0 8px;font-weight:600">${review.user_name || 'Usuário anônimo'}</p>
                <p style="margin:0 0 8px;font-size:20px;letter-spacing:2px;color:#f59e0b">${stars}</p>
                ${review.comment ? `<p style="margin:0;color:#374151;font-size:14px">"${review.comment}"</p>` : ''}
              </div>
              <p style="color:#6b7280;font-size:12px">Acesse o Painel do Parceiro para responder e ver todas as avaliações.</p>
            </div>
          `
        });
      }

      console.log(`notifyPartner: new_review notification sent for partner ${partnerId}`);
      return Response.json({ success: true, type: 'new_review' });
    }

    return Response.json({ success: true, skipped: 'unhandled entity' });
  } catch (error) {
    console.error('notifyPartner error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});