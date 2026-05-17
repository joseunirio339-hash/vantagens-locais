import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a new Product is created
// Notifies users who favorited that partner
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct calls (partner_id, product_name) and entity automation payload
    let partner_id, product_name, product_id;

    if (body.event && body.data) {
      // Entity automation payload
      partner_id = body.data.partner_id;
      product_name = body.data.name;
      product_id = body.event.entity_id;

      // Only notify if product is active
      if (body.data.is_active === false) {
        return Response.json({ success: true, skipped: 'inactive product' });
      }
    } else {
      partner_id = body.partner_id;
      product_name = body.product_name;
      product_id = body.product_id;
    }

    if (!partner_id || !product_name) {
      return Response.json({ error: 'partner_id and product_name are required' }, { status: 400 });
    }

    // Get partner info
    const partners = await base44.asServiceRole.entities.Partner.filter({ id: partner_id });
    const partner = partners[0];
    const partnerName = partner?.business_name || 'Um parceiro favorito';

    // Collect unique emails: users who favorited OR already used vouchers at this partner
    const favorites = await base44.asServiceRole.entities.FavoritePartner.filter({ partner_id });
    const pastVouchers = await base44.asServiceRole.entities.Voucher.filter({ partner_id, status: 'used' });

    const emailSet = new Set([
      ...favorites.map(f => f.user_email),
      ...pastVouchers.map(v => v.user_email).filter(Boolean)
    ]);

    if (emailSet.size === 0) {
      return Response.json({ success: true, notifications_created: 0 });
    }

    let count = 0;
    for (const userEmail of emailSet) {
      // Avoid duplicate notifications for same product+user
      const existing = await base44.asServiceRole.entities.UserNotification.filter({
        user_email: userEmail,
        type: 'new_coupon',
        reference_id: product_id || ''
      });
      if (existing.length > 0) continue;

      await base44.asServiceRole.entities.UserNotification.create({
        user_email: userEmail,
        type: 'new_coupon',
        title: `🏷️ Novo cupom disponível!`,
        message: `${partnerName} adicionou um novo desconto: "${product_name}". Confira agora!`,
        is_read: false,
        reference_id: product_id || ''
      });
      count++;
    }

    console.log(`notifyNewCoupon: ${count} notifications created for product "${product_name}"`);
    return Response.json({ success: true, notifications_created: count });
  } catch (error) {
    console.error('notifyNewCoupon error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});