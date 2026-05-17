import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called when a new user registers via a referral link
// Payload: { referral_code, referred_email }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referral_code, referred_email } = await req.json();

    if (!referral_code || !referred_email) {
      return Response.json({ error: 'referral_code and referred_email are required' }, { status: 400 });
    }

    // Find the referrer by code
    const userPointsList = await base44.asServiceRole.entities.UserPoints.filter({ referral_code });
    if (userPointsList.length === 0) {
      return Response.json({ error: 'Referral code not found' }, { status: 404 });
    }
    const referrerPoints = userPointsList[0];
    const referrer_email = referrerPoints.user_email;

    // Avoid self-referral
    if (referrer_email === referred_email) {
      return Response.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if this user was already referred
    const existing = await base44.asServiceRole.entities.Referral.filter({ referred_email });
    if (existing.length > 0) {
      return Response.json({ success: true, already_registered: true });
    }

    // Create the referral record
    await base44.asServiceRole.entities.Referral.create({
      referrer_email,
      referrer_code: referral_code,
      referred_email,
      status: 'pending',
      reward_type: 'points',
      points_earned: 0
    });

    // Update referrer's total_referrals count
    await base44.asServiceRole.entities.UserPoints.update(referrerPoints.id, {
      total_referrals: (referrerPoints.total_referrals || 0) + 1
    });

    // Notify referrer
    await base44.asServiceRole.entities.UserNotification.create({
      user_email: referrer_email,
      type: 'new_coupon',
      title: '🎉 Amigo cadastrado!',
      message: `${referred_email} se cadastrou usando seu link! Quando assinar, você ganha 100 pontos.`,
      is_read: false,
      reference_id: ''
    });

    console.log(`[referralRegister] Referral created: ${referrer_email} -> ${referred_email}`);
    return Response.json({ success: true, referrer_email });

  } catch (error) {
    console.error('[referralRegister] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});