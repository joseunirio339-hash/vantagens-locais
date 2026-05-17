import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns or creates a UserPoints record for the authenticated user
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find existing record
    const existing = await base44.entities.UserPoints.filter({ user_email: user.email });

    if (existing.length > 0) {
      const referrals = await base44.entities.Referral.filter({ referrer_email: user.email });
      return Response.json({ userPoints: existing[0], referrals });
    }

    // Generate a unique referral code: first 4 chars of name + 6 random alphanumeric
    const namePart = (user.full_name || user.email)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referral_code = `${namePart}${randPart}`;

    const newRecord = await base44.entities.UserPoints.create({
      user_email: user.email,
      total_points: 0,
      referral_code,
      total_referrals: 0,
      successful_referrals: 0
    });

    return Response.json({ userPoints: newRecord, referrals: [] });

  } catch (error) {
    console.error('[getUserPoints] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});