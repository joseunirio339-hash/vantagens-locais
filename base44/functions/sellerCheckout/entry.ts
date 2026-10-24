import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// Preços em BRL (o app exibe em R$; antes eram cobrados em USD)
const PRICE_MAP = {
  user: "price_1UTqaiLsB3SzuNJIu39eafrY",
  stander: "price_1UTqaiLsB3SzuNJIliWw9GeB"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Somente o próprio vendedor logado pode gerar links de venda
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Faça login para gerar o link de venda.' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionType, representative_code, customer_email } = body;

    if (!subscriptionType || !PRICE_MAP[subscriptionType]) {
      return Response.json({ error: 'Tipo de plano inválido' }, { status: 400 });
    }
    if (!customer_email) {
      return Response.json({ error: 'Email do cliente é obrigatório' }, { status: 400 });
    }

    // URL de retorno vem do cabeçalho definido pelo servidor: vale tanto no app
    // publicado quanto no editor, e não pode ser escolhida por quem chama.
    const appUrl = req.headers.get('X-Base44-App-Url');
    if (!appUrl) {
      console.error('sellerCheckout: cabeçalho X-Base44-App-Url ausente');
      return Response.json({ error: 'App URL not available' }, { status: 500 });
    }

    // O código do vendedor precisa existir, estar ativo e pertencer à conta logada
    if (!representative_code) {
      return Response.json({ error: 'Código de vendedor é obrigatório' }, { status: 400 });
    }
    const reps = await base44.asServiceRole.entities.Representative.filter({
      code: representative_code,
      is_seller: true,
      is_active: true
    });
    const rep = reps[0];
    if (!rep || (rep.email || '').trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      console.error('sellerCheckout: código de vendedor inválido para', user.email);
      return Response.json({ error: 'Código de vendedor inválido para esta conta' }, { status: 403 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_MAP[subscriptionType], quantity: 1 }],
      customer_email,
      subscription_data: {
        metadata: {
          base44_app_id: Deno.env.get("BASE44_APP_ID"),
          user_email: customer_email,
          subscription_type: subscriptionType,
          representative_code: representative_code || '',
          customer_origin: 'vendedor_app'
        }
      },
      success_url: `${appUrl}/Subscription?session_id={CHECKOUT_SESSION_ID}&from=vendedor`,
      cancel_url: `${appUrl}/Subscription`,
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