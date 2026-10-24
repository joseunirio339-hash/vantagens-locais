import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Envio de WhatsApp restrito: exige login e só permite enviar para números
// que já pertencem ao próprio usuário (sua loja ou seus registros).
// Não é um relay aberto: o destino nunca é escolhido livremente pelo cliente.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { to_phone, message } = body;

    if (!to_phone || !message) {
      return Response.json({ error: 'Missing to_phone or message' }, { status: 400 });
    }

    const cleanPhone = String(to_phone).replace(/[\s\+\-\(\)]/g, '');

    if (user.role !== 'admin') {
      const partners = await base44.asServiceRole.entities.Partner.filter({ owner_email: user.email });
      const ownsNumber = partners.some(p =>
        String(p.whatsapp_business_number || '').replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
      );
      if (!ownsNumber) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      console.warn('WhatsApp credentials not configured');
      return Response.json({ skipped: true, reason: 'whatsapp_not_configured' });
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', JSON.stringify(result));
      return Response.json({
        success: false,
        error: result.error?.message || 'WhatsApp API error'
      }, { status: 500 });
    }

    return Response.json({ success: true, message_id: result.messages?.[0]?.id });

  } catch (error) {
    console.error('whatsappNotify error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}