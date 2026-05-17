import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called when a referred user activates a subscription
// Payload: { referred_email }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct calls { referred_email } and entity automation payloads { data: { user_email } }
    const referred_email = body.referred_email || body.data?.user_email;

    if (!referred_email) {
      return Response.json({ error: 'referred_email is required' }, { status: 400 });
    }

    // Find pending referral for this user
    const referrals = await base44.asServiceRole.entities.Referral.filter({
      referred_email,
      status: 'pending'
    });

    if (referrals.length === 0) {
      return Response.json({ success: true, no_referral: true });
    }

    const referral = referrals[0];
    const POINTS_REWARD = 100;

    // Update referral status to rewarded
    await base44.asServiceRole.entities.Referral.update(referral.id, {
      status: 'rewarded',
      reward_type: 'points',
      points_earned: POINTS_REWARD
    });

    // Add points to referrer
    const referrerPointsList = await base44.asServiceRole.entities.UserPoints.filter({
      user_email: referral.referrer_email
    });

    if (referrerPointsList.length > 0) {
      const rp = referrerPointsList[0];
      await base44.asServiceRole.entities.UserPoints.update(rp.id, {
        total_points: (rp.total_points || 0) + POINTS_REWARD,
        successful_referrals: (rp.successful_referrals || 0) + 1
      });
    }

    // Notify referrer of reward
    await base44.asServiceRole.entities.UserNotification.create({
      user_email: referral.referrer_email,
      type: 'level_up',
      title: '🏆 Você ganhou pontos!',
      message: `Seu amigo ${referred_email} assinou o plano! Você ganhou ${POINTS_REWARD} pontos de indicação.`,
      is_read: false,
      reference_id: referral.id
    });

    console.log(`[referralReward] Rewarded ${referral.referrer_email} with ${POINTS_REWARD} points for referring ${referred_email}`);
    return Response.json({ success: true, points_earned: POINTS_REWARD, referrer: referral.referrer_email });

  } catch (error) {
    console.error('[referralReward] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});