import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Ativação do mês grátis decidida no servidor.
// Antes o navegador criava a assinatura de teste, então bastava apagar o registro
// (ou chamar a API direto) para repetir o período gratuito quantas vezes quisesse.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Faça login para ativar o teste gratuito.' }, { status: 401 });
    }

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_email: user.email
    });

    if (subscriptions.some(s => s.is_trial === true)) {
      return Response.json({ error: 'Você já usou seu mês grátis.' }, { status: 429 });
    }
    if (subscriptions.some(s => s.type === 'user')) {
      return Response.json({ error: 'Você já tem uma assinatura do plano Usuário.' }, { status: 429 });
    }

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const trial = await base44.asServiceRole.entities.Subscription.create({
      user_email: user.email,
      type: 'user',
      status: 'active',
      price: 0,
      is_trial: true,
      starts_at: startsAt.toISOString().split('T')[0],
      expires_at: expiresAt.toISOString().split('T')[0]
    });

    return Response.json({ success: true, subscription: trial });

  } catch (error) {
    console.error('activateTrial error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}