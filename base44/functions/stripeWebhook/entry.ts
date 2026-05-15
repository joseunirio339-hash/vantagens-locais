import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    const base44 = createClientFromRequest(req);

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const userEmail = subscription.metadata?.user_email;
      const subscriptionType = subscription.metadata?.subscription_type;

      if (!userEmail || !subscriptionType) {
        console.error('Missing metadata in subscription', subscription.id);
        return Response.json({ received: true });
      }

      const startDate = new Date(subscription.current_period_start * 1000).toISOString().split('T')[0];
      const endDate = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];

      // Procura por subscription existente
      const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
        user_email: userEmail,
        type: subscriptionType
      });

      if (existingSubscriptions.length > 0) {
        // Atualiza a existente
        await base44.asServiceRole.entities.Subscription.update(existingSubscriptions[0].id, {
          status: subscription.status === 'active' ? 'active' : 'pending',
          starts_at: startDate,
          expires_at: endDate,
        });
      } else {
        // Cria nova assinatura
        await base44.asServiceRole.entities.Subscription.create({
          user_email: userEmail,
          type: subscriptionType,
          status: subscription.status === 'active' ? 'active' : 'pending',
          starts_at: startDate,
          expires_at: endDate,
          price: subscription.items.data[0]?.price?.unit_amount / 100 || 0,
        });
      }

      console.log(`Subscription ${subscription.id} processed for ${userEmail}`);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userEmail = subscription.metadata?.user_email;
      const subscriptionType = subscription.metadata?.subscription_type;

      if (userEmail && subscriptionType) {
        const subs = await base44.asServiceRole.entities.Subscription.filter({
          user_email: userEmail,
          type: subscriptionType
        });

        if (subs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
            status: 'expired',
          });
        }
      }

      console.log(`Subscription ${subscription.id} cancelled for ${userEmail}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});