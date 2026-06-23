import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Fetch all vouchers used this month
    let allVouchers = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await base44.asServiceRole.entities.Voucher.filter(
        { status: 'used' },
        '-used_at',
        100,
        skip
      );
      // Filter manually for used_at within this month
      const monthVouchers = batch.filter(v => {
        if (!v.used_at) return false;
        return v.used_at >= startOfMonth && v.used_at <= endOfMonth;
      });
      allVouchers = allVouchers.concat(monthVouchers);
      skip += 100;
      // Check if we got fewer than 100 or if the last result is older than this month
      if (batch.length < 100) {
        hasMore = false;
      } else {
        const last = batch[batch.length - 1];
        if (last.used_at && last.used_at < startOfMonth) {
          hasMore = false;
        }
      }
      // Safety limit
      if (allVouchers.length >= 1000) hasMore = false;
    }

    // Group by user_email and count
    const userCounts = {};
    for (const v of allVouchers) {
      const email = v.user_email;
      if (!email) continue;
      if (!userCounts[email]) {
        userCounts[email] = { user_email: email, count: 0, total_saved: 0, partner_names: new Set() };
      }
      userCounts[email].count += 1;
      const saved = (v.original_price || 0) - (v.discount_price || 0);
      if (saved > 0) userCounts[email].total_saved += saved;
      if (v.product_name) userCounts[email].partner_names.add(v.product_name.split(' ').slice(0, 2).join(' '));
    }

    // Convert to array, sort by count desc, top 10
    const ranking = Object.values(userCounts)
      .map(u => ({
        user_email: u.user_email,
        vouchers_used: u.count,
        total_saved: Math.round(u.total_saved * 100) / 100,
        last_product: [...u.partner_names].slice(0, 3).join(', ')
      }))
      .sort((a, b) => b.vouchers_used - a.vouchers_used)
      .slice(0, 10);

    return Response.json({ success: true, month: startOfMonth, ranking });
  } catch (error) {
    console.error('monthlyPurchaseRanking error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});