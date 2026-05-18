import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a Voucher is updated to status=used
// Also callable directly: { user_email }

const LEVELS = [
  { level: 1, name: 'Iniciante',   icon: '🌱', minPoints: 0,   color: 'slate'   },
  { level: 2, name: 'Explorador',  icon: '🧭', minPoints: 50,  color: 'emerald' },
  { level: 3, name: 'Econômico',   icon: '💡', minPoints: 150, color: 'blue'    },
  { level: 4, name: 'Caçador',     icon: '🎯', minPoints: 350, color: 'violet'  },
  { level: 5, name: 'Mestre',      icon: '👑', minPoints: 700, color: 'amber'   },
];

const BADGES = [
  { id: 'first_voucher',  name: 'Primeiro Passo',     icon: '🎫', category: 'compras',    threshold: 1,  type: 'used',     desc: '1 voucher utilizado' },
  { id: 'five_vouchers',  name: 'Frequente',           icon: '⚡', category: 'compras',    threshold: 5,  type: 'used',     desc: '5 vouchers utilizados' },
  { id: 'ten_vouchers',   name: 'Fiel',                icon: '🔥', category: 'fidelidade', threshold: 10, type: 'used',     desc: '10 vouchers utilizados' },
  { id: 'twenty_five',    name: 'Lenda Local',         icon: '🏆', category: 'fidelidade', threshold: 25, type: 'used',     desc: '25 vouchers utilizados' },
  { id: 'fifty_vouchers', name: 'Elite',               icon: '💎', category: 'fidelidade', threshold: 50, type: 'used',     desc: '50 vouchers utilizados' },
  { id: 'three_partners', name: 'Explorador de Lojas', icon: '🗺️', category: 'exploracao', threshold: 3,  type: 'partners', desc: '3 parceiros visitados' },
  { id: 'five_partners',  name: 'Globetrotter',        icon: '🌟', category: 'exploracao', threshold: 5,  type: 'partners', desc: '5 parceiros visitados' },
  { id: 'ten_partners',   name: 'Conhecedor',          icon: '🏙️', category: 'exploracao', threshold: 10, type: 'partners', desc: '10 parceiros visitados' },
];

// Points per voucher used (base 10, bonus for higher discounts)
const POINTS_PER_VOUCHER = 10;

function getLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let userEmail;
    let voucherData = null;

    // Support entity automation payload (Voucher updated to used)
    if (body.event && body.data) {
      if (body.data.status !== 'used') {
        return Response.json({ success: true, skipped: 'not a used voucher' });
      }
      userEmail = body.data.user_email;
      voucherData = body.data;
    } else {
      userEmail = body.user_email;
    }

    if (!userEmail) {
      return Response.json({ error: 'user_email is required' }, { status: 400 });
    }

    // Get all used vouchers for this user
    const allVouchers = await base44.asServiceRole.entities.Voucher.filter({
      user_email: userEmail,
      status: 'used'
    });
    const usedCount = allVouchers.length;
    const uniquePartners = new Set(allVouchers.map(v => v.partner_id)).size;

    // --- AWARD POINTS ---
    // Calculate bonus points: bigger discount = more points
    let pointsToAdd = POINTS_PER_VOUCHER;
    if (voucherData) {
      const saved = (voucherData.original_price || 0) - (voucherData.discount_price || 0);
      if (saved >= 50) pointsToAdd = 25;
      else if (saved >= 20) pointsToAdd = 15;
    }

    // Only award points if called from automation (voucherData present)
    let totalPoints = 0;
    if (voucherData) {
      const existingPoints = await base44.asServiceRole.entities.UserPoints.filter({ user_email: userEmail });
      if (existingPoints.length > 0) {
        totalPoints = (existingPoints[0].total_points || 0) + pointsToAdd;
        await base44.asServiceRole.entities.UserPoints.update(existingPoints[0].id, {
          total_points: totalPoints
        });
      } else {
        const namePart = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
        const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newRecord = await base44.asServiceRole.entities.UserPoints.create({
          user_email: userEmail,
          total_points: pointsToAdd,
          referral_code: `${namePart}${randPart}`,
          total_referrals: 0,
          successful_referrals: 0
        });
        totalPoints = newRecord.total_points;
      }
    } else {
      const existingPoints = await base44.asServiceRole.entities.UserPoints.filter({ user_email: userEmail });
      totalPoints = existingPoints[0]?.total_points || 0;
    }

    const currentLevel = getLevel(totalPoints);

    let notifCount = 0;

    // Notify points earned
    if (voucherData) {
      await base44.asServiceRole.entities.UserNotification.create({
        user_email: userEmail,
        type: 'new_coupon',
        title: `+${pointsToAdd} pontos ganhos! ⭐`,
        message: `Você usou um voucher de "${voucherData.product_name || 'produto'}" e ganhou ${pointsToAdd} pontos. Total: ${totalPoints} pontos.`,
        is_read: false,
        reference_id: voucherData.id
      });
      notifCount++;
    }

    // Check level-up notification
    const levelNotifs = await base44.asServiceRole.entities.UserNotification.filter({
      user_email: userEmail,
      type: 'level_up',
      reference_id: `level_${currentLevel.level}`
    });

    if (levelNotifs.length === 0 && currentLevel.level > 1) {
      await base44.asServiceRole.entities.UserNotification.create({
        user_email: userEmail,
        type: 'level_up',
        title: `${currentLevel.icon} Novo nível desbloqueado!`,
        message: `Parabéns! Você atingiu o nível "${currentLevel.name}" com ${totalPoints} pontos! Continue usando vouchers para ir mais longe!`,
        is_read: false,
        reference_id: `level_${currentLevel.level}`
      });
      notifCount++;
    }

    // Check badges
    for (const badge of BADGES) {
      const reached = badge.type === 'used' ? usedCount >= badge.threshold
                    : badge.type === 'partners' ? uniquePartners >= badge.threshold
                    : false;

      if (!reached) continue;

      const existing = await base44.asServiceRole.entities.UserNotification.filter({
        user_email: userEmail,
        type: 'badge_earned',
        reference_id: `badge_${badge.id}`
      });

      if (existing.length === 0) {
        // Check if badge already in Badge entity
        const existingBadge = await base44.asServiceRole.entities.Badge.filter({
          user_email: userEmail,
          badge_id: badge.id
        });

        if (existingBadge.length === 0) {
          await base44.asServiceRole.entities.Badge.create({
            user_email: userEmail,
            badge_id: badge.id,
            badge_name: badge.name,
            badge_icon: badge.icon,
            badge_category: badge.category,
            description: badge.desc
          });
        }

        await base44.asServiceRole.entities.UserNotification.create({
          user_email: userEmail,
          type: 'badge_earned',
          title: `${badge.icon} Conquista desbloqueada!`,
          message: `Você ganhou a medalha "${badge.name}"! ${badge.desc}.`,
          is_read: false,
          reference_id: `badge_${badge.id}`
        });
        notifCount++;
      }
    }

    console.log(`checkLevelUp: ${notifCount} notifications for ${userEmail}, points=${totalPoints}, level=${currentLevel.level}, used=${usedCount}`);
    return Response.json({
      success: true,
      notifications_created: notifCount,
      level: currentLevel.level,
      used_count: usedCount,
      total_points: totalPoints,
      points_added: voucherData ? pointsToAdd : 0
    });
  } catch (error) {
    console.error('checkLevelUp error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});