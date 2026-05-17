import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Esta função é chamada via automação agendada (sem usuário logado)
    // Usa apenas service role
    const today = new Date();
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const todayStr = today.toISOString().split('T')[0];
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const pendingVouchers = await base44.asServiceRole.entities.Voucher.filter({ status: 'pending' });

    const expiringVouchers = pendingVouchers.filter(v => {
      if (!v.expires_at) return false;
      const expiryStr = v.expires_at.split('T')[0];
      return expiryStr >= todayStr && expiryStr <= in3DaysStr;
    });

    let notifCount = 0;

    for (const voucher of expiringVouchers) {
      if (!voucher.user_email) continue;

      const existing = await base44.asServiceRole.entities.UserNotification.filter({
        user_email: voucher.user_email,
        reference_id: voucher.id,
        type: 'voucher_expiring'
      });

      if (existing.length > 0) continue;

      const daysLeft = Math.ceil((new Date(voucher.expires_at) - today) / (1000 * 60 * 60 * 24));
      const daysText = daysLeft <= 0 ? 'hoje' : daysLeft === 1 ? 'amanhã' : `em ${daysLeft} dias`;

      await base44.asServiceRole.entities.UserNotification.create({
        user_email: voucher.user_email,
        type: 'voucher_expiring',
        title: '⚠️ Voucher prestes a expirar!',
        message: `Seu voucher "${voucher.product_name}" expira ${daysText}. Use antes que seja tarde!`,
        is_read: false,
        reference_id: voucher.id
      });
      notifCount++;
    }

    console.log(`checkVoucherExpiry: expiring=${expiringVouchers.length}, notified=${notifCount}`);

    return Response.json({ success: true, notifications_created: notifCount, checked: expiringVouchers.length });
  } catch (error) {
    console.error('checkVoucherExpiry error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});