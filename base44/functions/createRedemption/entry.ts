import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { secureCode } from '../../shared/security.ts';

// Resgate na Loja de Fidelidade feito no servidor.
// O saldo de pontos é conferido e debitado aqui — o navegador não altera mais pontos.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Entre na sua conta para resgatar.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rewardId = body.reward_id;
    if (!rewardId) {
      return Response.json({ error: 'Recompensa não informada.' }, { status: 400 });
    }

    const rewards = await base44.asServiceRole.entities.LoyaltyReward.filter({ id: rewardId });
    const reward = rewards[0];
    if (!reward || !reward.is_active) {
      return Response.json({ error: 'Esta recompensa não está disponível.' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    if (reward.expires_at && reward.expires_at < today) {
      return Response.json({ error: 'Esta recompensa expirou.' }, { status: 400 });
    }
    if (reward.max_redemptions > 0 && (reward.total_redeemed || 0) >= reward.max_redemptions) {
      return Response.json({ error: 'Esta recompensa já foi esgotada.' }, { status: 400 });
    }

    const pointsRequired = Number(reward.points_required || 0);

    const pointsList = await base44.asServiceRole.entities.UserPoints.filter({ user_email: user.email });
    const userPoints = pointsList[0];
    if (!userPoints) {
      return Response.json({ error: 'Pontos insuficientes para este resgate.' }, { status: 400 });
    }

    // Débito atômico: o filtro do saldo e o desconto rodam na mesma operação do banco,
    // então dois resgates simultâneos nunca gastam o mesmo saldo duas vezes.
    const debit = await base44.asServiceRole.entities.UserPoints.updateMany(
      { id: userPoints.id, total_points: { $gte: pointsRequired } },
      { $inc: { total_points: -pointsRequired } }
    );
    if (!debit?.updated) {
      return Response.json({ error: 'Pontos insuficientes para este resgate.' }, { status: 400 });
    }

    // Reserva atômica da vaga na recompensa (respeita o limite de resgates)
    const reservation = await base44.asServiceRole.entities.LoyaltyReward.updateMany(
      reward.max_redemptions > 0
        ? { id: reward.id, total_redeemed: { $lt: reward.max_redemptions } }
        : { id: reward.id },
      { $inc: { total_redeemed: 1 } }
    );
    if (!reservation?.updated) {
      await base44.asServiceRole.entities.UserPoints.updateMany(
        { id: userPoints.id },
        { $inc: { total_points: pointsRequired } }
      );
      return Response.json({ error: 'Esta recompensa já foi esgotada.' }, { status: 400 });
    }

    const partners = await base44.asServiceRole.entities.Partner.filter({ id: reward.partner_id });
    const partner = partners[0];

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const code = 'LYL-' + secureCode(6);

    let redemption;
    try {
      redemption = await base44.asServiceRole.entities.LoyaltyRedemption.create({
        user_email: user.email,
        reward_id: reward.id,
        partner_id: reward.partner_id,
        partner_owner_email: partner?.owner_email || '',
        points_spent: pointsRequired,
        redemption_code: code,
        status: 'pending',
        reward_title: reward.title,
        partner_name: partner?.business_name || '',
        expires_at: expiresAt.toISOString().split('T')[0]
      });
    } catch (createError) {
      // Devolve os pontos e a vaga se o resgate não puder ser gravado
      await base44.asServiceRole.entities.UserPoints.updateMany(
        { id: userPoints.id },
        { $inc: { total_points: pointsRequired } }
      );
      await base44.asServiceRole.entities.LoyaltyReward.updateMany(
        { id: reward.id },
        { $inc: { total_redeemed: -1 } }
      );
      throw createError;
    }

    if (partner) {
      await base44.asServiceRole.entities.Notification.create({
        partner_id: partner.id,
        partner_owner_email: partner.owner_email,
        type: 'new_voucher',
        title: 'Novo Resgate de Fidelidade!',
        message: `${user.full_name || 'Um cliente'} resgatou: "${reward.title}" — Código: ${code}`,
        is_read: false,
        reference_id: redemption.id
      }).catch((err) => console.warn('Aviso ao parceiro falhou:', err.message));
    }

    return Response.json({
      success: true,
      redemption,
      code,
      expires_at: expiresAt.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('createRedemption error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}