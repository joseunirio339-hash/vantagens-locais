import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, payment_intent_id } = body;

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 5 });

    if (customers.data.length === 0) {
      return Response.json({ charges: [], subscriptions: [] });
    }

    const customerId = customers.data[0].id;

    // Get receipt URL for a specific payment intent
    if (action === 'get_receipt' && payment_intent_id) {
      const charges = await stripe.charges.list({ payment_intent: payment_intent_id, limit: 1 });
      const receiptUrl = charges.data[0]?.receipt_url || null;
      return Response.json({ receipt_url: receiptUrl });
    }

    // Get all charges/payment history
    const [chargesList, subscriptionsList] = await Promise.all([
      stripe.charges.list({ customer: customerId, limit: 50 }),
      stripe.subscriptions.list({ customer: customerId, limit: 10, status: 'all' })
    ]);

    const charges = chargesList.data.map(charge => ({
      id: charge.id,
      payment_intent: charge.payment_intent,
      amount: charge.amount / 100,
      currency: charge.currency,
      status: charge.status,
      description: charge.description,
      receipt_url: charge.receipt_url,
      created: charge.created * 1000, // to ms
      failure_message: charge.failure_message,
    }));

    const subscriptions = subscriptionsList.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: sub.current_period_start * 1000,
      current_period_end: sub.current_period_end * 1000,
      cancel_at_period_end: sub.cancel_at_period_end,
      items: sub.items.data.map(item => ({
        price_id: item.price.id,
        amount: item.price.unit_amount / 100,
        interval: item.price.recurring?.interval,
        currency: item.price.currency,
      }))
    }));

    return Response.json({ charges, subscriptions });
  } catch (error) {
    console.error('stripeHistory error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});