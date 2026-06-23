import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Only handle create events
    if (event?.type !== 'create') {
      return Response.json({ skipped: true, reason: 'not a create event' });
    }

    const product = data;

    // Only notify if product is active and has a discount
    if (!product || !product.is_active || !product.discount_price || !product.partner_id) {
      return Response.json({ skipped: true, reason: 'product not eligible for notification' });
    }

    if (!product.original_price || product.discount_price >= product.original_price) {
      return Response.json({ skipped: true, reason: 'no real discount' });
    }

    const discountPct = Math.round(((product.original_price - product.discount_price) / product.original_price) * 100);

    // Get partner info
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

    console.log(`Notifying ${favorites.length} followers of ${partner.business_name} about new product: ${product.name}`);

    // 1. Create in-app notifications for all followers
    const notifications = favorites.map(fav => ({
      user_email: fav.user_email,
      type: 'new_coupon',
      title: `🛍️ Novo desconto em ${partner.business_name}!`,
      message: `${product.name} por apenas R$ ${product.discount_price.toFixed(2).replace('.', ',')} — ${discountPct}% OFF. Corra para garantir!`,
      reference_id: product.id,
      is_read: false,
    }));

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.UserNotification.bulkCreate(notifications);
    }

    // 2. Send emails to followers (up to 50)
    const emailTargets = favorites.slice(0, 50);
    const emailPromises = emailTargets.map(fav =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: fav.user_email,
        subject: `🛍️ Novo desconto em ${partner.business_name}: ${discountPct}% OFF!`,
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
                <p style="font-size: 13px; color: #7c3aed; font-weight: bold; margin: 0 0 4px;">${partner.business_name}</p>
                <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 8px;">${product.name}</p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px; text-decoration: line-through;">
                  De R$ ${product.original_price.toFixed(2).replace('.', ',')}
                </p>
                <p style="font-size: 22px; font-weight: bold; color: #059669; margin: 0;">
                  Por R$ ${product.discount_price.toFixed(2).replace('.', ',')}
                  <span style="font-size: 14px; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 99px; margin-left: 8px;">${discountPct}% OFF</span>
                </p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://app.clubemaxdescontos.com.br/Partners"
                   style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                  Ver Desconto Agora →
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                Você recebeu este e-mail pois segue ${partner.business_name} no Clube Max Descontos.
              </p>
            </div>
          </div>
        `
      }).catch(err => console.warn(`Email failed for ${fav.user_email}:`, err.message))
    );

    await Promise.all(emailPromises);

    // 3. WhatsApp notifications — only if partner has WhatsApp Business enabled
    let whatsappSent = 0;
    if (partner.whatsapp_business_enabled && partner.whatsapp_business_number) {
      const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
      const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

      if (accessToken && phoneNumberId) {
        // Get follower users to find those with phone numbers
        const followerEmails = favorites.map(f => f.user_email).filter(Boolean);
        
        // Fetch users by email to get their phone numbers (if stored)
        const allUsers = await base44.asServiceRole.entities.User.list();
        const followerUsers = allUsers.filter(u => followerEmails.includes(u.email));
        
        // For WhatsApp, we'd need user phone numbers. Since User entity doesn't have phone,
        // we send WhatsApp only to followers who have provided their phone via updateMe or similar.
        // For now, we can notify via WhatsApp using the partner's own number as a fallback,
        // or we can skip WhatsApp if no user phones are available.
        
        // Attempt to send WhatsApp to followers who have phone data stored
        const whatsappMsg = `🛍️ *Novo desconto em ${partner.business_name}!*\n\n` +
          `${product.name}\n` +
          `De R$ ${product.original_price.toFixed(2).replace('.', ',')} por R$ ${product.discount_price.toFixed(2).replace('.', ',')}\n` +
          `${discountPct}% OFF — Aproveite!\n\n` +
          `👉 Acesse o app Clube Max Descontos para garantir seu voucher.`;

        // Send to followers who have phone in their user data
        const followerPhones = followerUsers
          .filter(u => u.phone)
          .map(u => u.phone)
          .slice(0, 20); // Max 20 WhatsApp messages per batch

        for (const phone of followerPhones) {
          try {
            const cleanPhone = phone.replace(/[\s\+\-\(\)]/g, '');
            await fetch(
              `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  recipient_type: 'individual',
                  to: cleanPhone,
                  type: 'text',
                  text: { preview_url: false, body: whatsappMsg },
                }),
              }
            );
            whatsappSent++;
          } catch (e) {
            console.warn(`WhatsApp failed for ${phone}:`, e.message);
          }
        }
      }
    }

    console.log(`Successfully notified ${favorites.length} followers (${whatsappSent} via WhatsApp)`);

    return Response.json({
      success: true,
      notified: favorites.length,
      whatsapp_sent: whatsappSent,
      partner: partner.business_name,
      product: product.name,
      discount: `${discountPct}%`
    });

  } catch (error) {
    console.error('notifyFollowersNewProduct error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});