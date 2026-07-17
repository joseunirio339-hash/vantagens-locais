import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICE_MAP = {
  user: "price_1TY8efLsB3SzuNJItliAzOIn",
  stander: "price_1TlVAZLsB3SzuNJINp3y63jX"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // App público: não exige login, mas vendedores autenticados usam seus próprios dados.
    const body = await req.json();
    const { subscriptionType, representative_code, customer_email } = body;

    if (!subscriptionType || !PRICE_MAP[subscriptionType]) {
      return Response.json({ error: 'Tipo de plano inválido' }, { status: 400 });
    }
    if (!customer_email) {
      return Response.json({ error: 'Email do cliente é obrigatório' }, { status: 400 });
    }

    let origin = req.headers.get('origin') || Deno.env.get("BASE44_APP_URL") || '';
    if (origin && !origin.startsWith('http')) {
      origin = 'https://' + origin.replace(/^\/+/, '');
    }
    if (!origin) origin = 'https://app.base44.com';

    const isIframe = req.headers.get('x-iframe-request') === 'true';
    if (isIframe) {
      return Response.json({ error: 'Abra o checkout em uma nova janela', isIframe: true }, { status: 400 });
    }

    // Valida o código do vendedor (opcional, mas recomendado)
    if (representative_code) {
      try {
        const reps = await base44.asServiceRole.entities.Representative.filter({ code: representative_code, is_seller: true, is_active: true });
        if (reps.length === 0) {
          console.warn('sellerCheckout: código de vendedor inválido/inativo ->', representative_code);
        }
      } catch (e) {
        console.warn('sellerCheckout: falha ao validar vendedor ->', e.message);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_MAP[subscriptionType], quantity: 1 }],
      customer_email,
      subscription_data: {
        metadata: {
          user_email: customer_email,
          subscription_type: subscriptionType,
          representative_code: representative_code || '',
          customer_origin: 'vendedor_app'
        }
      },
      success_url: `${origin}/Subscription?session_id={CHECKOUT_SESSION_ID}&from=vendedor`,
      cancel_url: `${origin}/Subscription`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        customer_email,
        subscription_type: subscriptionType,
        representative_code: representative_code || ''
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Seller checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});