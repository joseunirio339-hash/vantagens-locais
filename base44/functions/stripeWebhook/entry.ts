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
      const isActive = subscription.status === 'active';

      const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
        user_email: userEmail,
        type: subscriptionType
      });

      if (existingSubscriptions.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubscriptions[0].id, {
          status: isActive ? 'active' : 'pending',
          starts_at: startDate,
          expires_at: endDate,
        });
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          user_email: userEmail,
          type: subscriptionType,
          status: isActive ? 'active' : 'pending',
          starts_at: startDate,
          expires_at: endDate,
          price: subscription.items.data[0]?.price?.unit_amount / 100 || 0,
        });
      }

      // Se é assinatura de parceiro e está ativa, atualiza o Partner também
      if (isActive && (subscriptionType === 'lojista' || subscriptionType === 'empreendedor')) {
        const partners = await base44.asServiceRole.entities.Partner.filter({ owner_email: userEmail });
        for (const partner of partners) {
          await base44.asServiceRole.entities.Partner.update(partner.id, {
            subscription_status: 'active',
            subscription_expires_at: endDate
          });
        }
      }

      // Check for representative commission
      const repCode = subscription.metadata?.representative_code;
      if (repCode && isActive) {
        const reps = await base44.asServiceRole.entities.Representative.filter({ code: repCode, is_active: true });
        if (reps.length > 0) {
          const rep = reps[0];
          const subPrice = subscription.items.data[0]?.price?.unit_amount / 100 || 0;
          const commissionAmount = subPrice * (rep.commission_percentage / 100);

          // Check if commission already exists for this session
          const existingCommissions = await base44.asServiceRole.entities.RepresentativeCommission.filter({
            stripe_session_id: subscription.id
          });

          if (existingCommissions.length === 0 && commissionAmount > 0) {
            await base44.asServiceRole.entities.RepresentativeCommission.create({
              representative_id: rep.id,
              representative_name: rep.name,
              customer_email: userEmail,
              subscription_type: subscriptionType,
              subscription_price: subPrice,
              commission_amount: commissionAmount,
              status: 'pending',
              stripe_session_id: subscription.id,
            });

            // Update rep totals
            await base44.asServiceRole.entities.Representative.update(rep.id, {
              total_sales: (rep.total_sales || 0) + 1,
              total_earned: (rep.total_earned || 0) + commissionAmount,
            });

            console.log(`Commission created: ${rep.name} earned R$ ${commissionAmount.toFixed(2)} from ${userEmail}`);
          }
        }
      }

      console.log(`Subscription ${subscription.id} processed for ${userEmail} (${subscriptionType})`);
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

        // Atualiza o Partner para expirado
        if (subscriptionType === 'lojista' || subscriptionType === 'empreendedor') {
          const partners = await base44.asServiceRole.entities.Partner.filter({ owner_email: userEmail });
          for (const partner of partners) {
            await base44.asServiceRole.entities.Partner.update(partner.id, {
              subscription_status: 'expired'
            });
          }
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