import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { to_phone, message, partner_name } = body;

    if (!to_phone || !message) {
      return Response.json({ error: 'Missing to_phone or message' }, { status: 400 });
    }

    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      console.warn('WhatsApp credentials not configured');
      return Response.json({ skipped: true, reason: 'whatsapp_not_configured' });
    }

    // Format phone: ensure it has country code, no +, no spaces
    const cleanPhone = to_phone.replace(/[\s\+\-\(\)]/g, '');
    
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
        error: result.error?.message || 'WhatsApp API error',
        details: result 
      }, { status: 500 });
    }

    console.log(`WhatsApp message sent to ${to_phone}`);
    return Response.json({ success: true, message_id: result.messages?.[0]?.id });

  } catch (error) {
    console.error('whatsappNotify error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});