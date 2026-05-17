import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a Voucher is updated to status=used
// Also callable directly: { user_email }

const LEVELS = [
  { level: 1, name: 'Iniciante',   icon: '🌱', minVouchers: 0  },
  { level: 2, name: 'Explorador',  icon: '🧭', minVouchers: 3  },
  { level: 3, name: 'Econômico',   icon: '💡', minVouchers: 7  },
  { level: 4, name: 'Caçador',     icon: '🎯', minVouchers: 15 },
  { level: 5, name: 'Mestre',      icon: '👑', minVouchers: 30 },
];

const BADGES = [
  { id: 'first_voucher',  name: 'Primeiro Passo',     icon: '🎫', threshold: 1,  type: 'used' },
  { id: 'five_vouchers',  name: 'Frequente',           icon: '⚡', threshold: 5,  type: 'used' },
  { id: 'ten_vouchers',   name: 'Fiel',                icon: '🔥', threshold: 10, type: 'used' },
  { id: 'twenty_five',    name: 'Lenda Local',         icon: '🏆', threshold: 25, type: 'used' },
  { id: 'three_partners', name: 'Explorador de Lojas', icon: '🗺️', threshold: 3,  type: 'partners' },
  { id: 'five_partners',  name: 'Globetrotter',        icon: '🌟', threshold: 5,  type: 'partners' },
];

function getLevel(usedCount) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (usedCount >= LEVELS[i].minVouchers) return LEVELS[i];
  }
  return LEVELS[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let userEmail;

    // Support entity automation payload (Voucher updated to used)
    if (body.event && body.data) {
      if (body.data.status !== 'used') {
        return Response.json({ success: true, skipped: 'not a used voucher' });
      }
      userEmail = body.data.user_email;
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
    const currentLevel = getLevel(usedCount);

    let notifCount = 0;

    // Check level-up: see if there's already a notification for this exact level
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
        message: `Parabéns! Você atingiu o nível "${currentLevel.name}". Continue usando cupons para desbloquear mais recompensas!`,
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
        // Save badge to Badge entity
        await base44.asServiceRole.entities.Badge.create({
          user_email: userEmail,
          badge_id: badge.id,
          badge_name: badge.name,
          badge_icon: badge.icon,
          badge_category: badge.type === 'used' || badge.type === 'partners' ? (badge.type === 'partners' ? 'exploracao' : 'compras') : 'fidelidade',
          description: `${badge.threshold} ${badge.type === 'used' ? 'vouchers utilizados' : 'parceiros diferentes visitados'}`
        });

        await base44.asServiceRole.entities.UserNotification.create({
          user_email: userEmail,
          type: 'badge_earned',
          title: `${badge.icon} Conquista desbloqueada!`,
          message: `Você ganhou a conquista "${badge.name}"! ${badge.threshold} ${badge.type === 'used' ? 'vouchers utilizados' : 'parceiros diferentes visitados'}.`,
          is_read: false,
          reference_id: `badge_${badge.id}`
        });
        notifCount++;
      }
    }

    console.log(`checkLevelUp: ${notifCount} notifications for ${userEmail} (${usedCount} used, level ${currentLevel.level})`);
    return Response.json({ success: true, notifications_created: notifCount, level: currentLevel.level, used_count: usedCount });
  } catch (error) {
    console.error('checkLevelUp error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});