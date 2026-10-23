import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Chamada pela automação agendada "Expiração Automática de Assinaturas".
// A URL é pública: só admin (ou a automação, que age como admin) pode disparar.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ status: 'active' });
    const trialSubs = await base44.asServiceRole.entities.Subscription.filter({ status: 'trial' });
    const allActive = [...subscriptions, ...trialSubs];

    const expired = allActive.filter(s => s.expires_at && s.expires_at < today);

    let updatedCount = 0;
    for (const sub of expired) {
      await base44.asServiceRole.entities.Subscription.update(sub.id, { status: 'expired' });

      // Se for assinatura de parceiro, atualiza o status do parceiro também
      if (sub.partner_id) {
        await base44.asServiceRole.entities.Partner.update(sub.partner_id, {
          subscription_status: 'expired'
        });
      }

      updatedCount++;
    }

    console.log(`checkExpiredSubscriptions: checked=${allActive.length}, expired=${updatedCount}, date=${today}`);

    return Response.json({
      success: true,
      checked: allActive.length,
      expired: updatedCount,
      date: today
    });
  } catch (error) {
    console.error('checkExpiredSubscriptions error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});