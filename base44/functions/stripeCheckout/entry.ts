import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICE_MAP = {
  user: "price_1TY8efLsB3SzuNJItliAzOIn",
  lojista: "price_1TY8efLsB3SzuNJIgs5Hw2ka"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionType } = body;

    if (!subscriptionType || !PRICE_MAP[subscriptionType]) {
      return Response.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    const isIframe = req.headers.get('x-iframe-request') === 'true';
    if (isIframe) {
      return Response.json({ error: 'Checkout must be opened in a new window', isIframe: true }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_MAP[subscriptionType],
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${req.headers.get('origin')}/Subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/Subscription`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        subscription_type: subscriptionType,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});