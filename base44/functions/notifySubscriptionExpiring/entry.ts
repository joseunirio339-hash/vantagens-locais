import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const sevenStr = sevenDaysFromNow.toISOString().split('T')[0];

    // Find active lojista subscriptions expiring in 7 days
    const activeSubs = await base44.asServiceRole.entities.Subscription.filter({
      status: 'active',
      type: 'lojista'
    });

    const expiring = activeSubs.filter(s =>
      s.expires_at && s.expires_at >= todayStr && s.expires_at <= sevenStr
    );

    let notified = 0;

    for (const sub of expiring) {
      const partners = await base44.asServiceRole.entities.Partner.filter({
        owner_email: sub.user_email
      });

      for (const partner of partners) {
        const daysLeft = Math.ceil(
          (new Date(sub.expires_at) - today) / (1000 * 60 * 60 * 24)
        );

        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          partner_id: partner.id,
          type: 'subscription_expiring',
          title: '⏰ Assinatura prestes a vencer',
          message: `Sua assinatura vence em ${daysLeft} dia(s) (${new Date(sub.expires_at).toLocaleDateString('pt-BR')}). Renove para evitar bloqueios!`
        });

        // Send email alert
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: sub.user_email,
            subject: `⏰ Sua assinatura vence em ${daysLeft} dia(s) — ${partner.business_name}`,
            body: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;">
  <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">⏰ Assinatura Prestes a Vencer</h1>
    <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">Não deixe sua loja ficar indisponível!</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
    <p style="color:#374151;font-size:16px;">Olá, <strong>${partner.business_name}</strong>!</p>
    <p style="color:#6b7280;font-size:14px;">Sua assinatura do <strong>Clube Max Descontos</strong> vence em <strong style="color:#dc2626;">${daysLeft} dia(s)</strong> — no dia <strong>${new Date(sub.expires_at).toLocaleDateString('pt-BR')}</strong>.</p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:8px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#991b1b;"><strong>⚠️ Atenção:</strong> Após o vencimento, seus produtos ficarão indisponíveis no app e você perderá acesso ao painel do parceiro.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${Deno.env.get('BASE44_APP_URL') || '#'}/Subscription" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Renovar Assinatura Agora →</a>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">Clube Max Descontos — Vantagens Locais 🛍️</p>
  </div>
</div>`,
            from_name: 'Clube Max Descontos'
          });
        } catch (e) {
          console.error('Erro ao enviar email de alerta:', e.message);
        }

        notified++;
      }
    }

    console.log(`notifySubscriptionExpiring: ${notified} parceiros notificados`);
    return Response.json({ success: true, notified, expiringSoon: expiring.length });
  } catch (error) {
    console.error('Erro em notifySubscriptionExpiring:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});