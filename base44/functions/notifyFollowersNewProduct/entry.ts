import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Avisa os seguidores de um parceiro quando ele cadastra um produto com desconto.
// Roda apenas pela automação/admin e sempre relê o produto e o parceiro do banco
// (o que chega no corpo da requisição não é usado como fonte de verdade).
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { event, data } = body;

    // Only handle create events
    if (event?.type !== 'create') {
      return Response.json({ skipped: true, reason: 'not a create event' });
    }

    const productId = data?.id;
    if (!productId) {
      return Response.json({ skipped: true, reason: 'missing product id' });
    }

    // Relê o produto do banco — nada de confiar no texto recebido
    const products = await base44.asServiceRole.entities.Product.filter({ id: productId });
    const product = products[0];

    if (!product || !product.is_active || !product.partner_id || !product.discount_price) {
      return Response.json({ skipped: true, reason: 'product not eligible for notification' });
    }

    if (!product.original_price || product.discount_price >= product.original_price) {
      return Response.json({ skipped: true, reason: 'no real discount' });
    }

    const discountPct = Math.round(((product.original_price - product.discount_price) / product.original_price) * 100);

    // Get partner info from the database
    const partners = await base44.asServiceRole.entities.Partner.filter({ id: product.partner_id });
    const partner = partners?.[0];

    if (!partner) {
      return Response.json({ skipped: true, reason: 'partner not found' });
    }

    // Find all users who favorited this partner
    const favorites = await base44.asServiceRole.entities.FavoritePartner.filter({
      partner_id: product.partner_id
    });

    if (!favorites || favorites.length === 0) {
      return Response.json({ notified: 0, reason: 'no followers' });
    }

    const businessName = partner.business_name || 'Parceiro';
    const productName = product.name || 'Produto';

    console.log(`Notifying ${favorites.length} followers of ${businessName} about new product: ${productName}`);

    // Build WhatsApp link if partner has WhatsApp Business enabled
    const whatsappNumber = partner.whatsapp_business_enabled && partner.whatsapp_business_number
      ? String(partner.whatsapp_business_number).replace(/[\s\+\-\(\)]/g, '')
      : null;
    const whatsappLink = whatsappNumber ? `\n\n💬 Fale direto com a loja: https://wa.me/${whatsappNumber}` : '';

    // Create in-app notifications for each follower
    const notifications = favorites.map(fav => ({
      user_email: fav.user_email,
      type: 'new_coupon',
      title: `🛍️ Novo desconto em ${businessName}!`,
      message: `${productName} por apenas R$ ${product.discount_price.toFixed(2).replace('.', ',')} — ${discountPct}% OFF. Corra para garantir!${whatsappLink}`,
      reference_id: product.id,
      is_read: false,
    }));

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.UserNotification.bulkCreate(notifications);
    }

    // Build WhatsApp button for email when available
    const whatsappEmailButton = whatsappNumber
      ? `<div style="text-align: center; margin-top: 12px;">
           <a href="https://wa.me/${whatsappNumber}"
              style="background: #25D366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
             💬 Falar com a loja no WhatsApp
           </a>
         </div>`
      : '';

    // Send emails to followers (up to 50)
    const emailTargets = favorites.slice(0, 50);
    const emailPromises = emailTargets.map(fav =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: fav.user_email,
        subject: `🛍️ Novo desconto em ${businessName}: ${discountPct}% OFF!`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">🛍️ Novo Desconto Exclusivo!</h1>
            </div>
            <div style="background: #f8f5ff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e9d5ff;">
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 8px;">
                Uma loja que você segue acabou de cadastrar um novo desconto:
              </p>
              <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #ddd6fe; margin: 16px 0;">
                <p style="font-size: 13px; color: #7c3aed; font-weight: bold; margin: 0 0 4px;">${escapeHtml(businessName)}</p>
                <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 8px;">${escapeHtml(productName)}</p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px; text-decoration: line-through;">
                  De R$ ${product.original_price.toFixed(2).replace('.', ',')}
                </p>
                <p style="font-size: 22px; font-weight: bold; color: #059669; margin: 0;">
                  Por R$ ${product.discount_price.toFixed(2).replace('.', ',')}
                  <span style="font-size: 14px; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 99px; margin-left: 8px;">${discountPct}% OFF</span>
                </p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://clubemaxdescontos.com.br/Partners"
                   style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                  Ver Desconto Agora →
                </a>
              </div>
              ${whatsappEmailButton}
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                Você recebeu este e-mail pois segue ${escapeHtml(businessName)} no Clube Max Descontos.
              </p>
            </div>
          </div>
        `
      }).catch(err => console.warn(`Email failed for ${fav.user_email}:`, err.message))
    );

    await Promise.all(emailPromises);

    return Response.json({
      success: true,
      notified: favorites.length,
      partner: businessName,
      product: productName,
      discount: `${discountPct}%`
    });

  } catch (error) {
    console.error('notifyFollowersNewProduct error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}