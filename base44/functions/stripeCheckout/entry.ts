import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICE_MAP = {
  user: "price_1TY8efLsB3SzuNJItliAzOIn",
  stander: "price_1TlVAZLsB3SzuNJINp3y63jX",
  lojista: "price_1TlVAZLsB3SzuNJI9WCkdyNW"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionType, representative_code } = body;

    if (!subscriptionType || !PRICE_MAP[subscriptionType]) {
      return Response.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    const appUrl = req.headers.get('X-Base44-App-Url');
    if (!appUrl) {
      console.error('Missing X-Base44-App-Url header');
      return Response.json({ error: 'App URL not available' }, { status: 500 });
    }

    const sessionMetadata = {
      base44_app_id: Deno.env.get("BASE44_APP_ID"),
      user_email: user.email,
      subscription_type: subscriptionType,
      ...(representative_code ? { representative_code } : {}),
    };

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
      success_url: `${appUrl}/Subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Subscription`,
      metadata: sessionMetadata,
      // O webhook le os metadados da ASSINATURA, nao da sessao:
      // sem isso nenhuma assinatura e registrada e nenhuma comissao e gerada.
      subscription_data: {
        metadata: sessionMetadata,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});