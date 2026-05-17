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

    const customers = await stripe.customers.list({ email: user.email, limit: 5 });

    if (customers.data.length === 0) {
      return Response.json({ error: 'Nenhuma conta Stripe encontrada para esse usuário.' }, { status: 404 });
    }

    const customerId = customers.data[0].id;
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/UserProfile`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('stripePortal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});