import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when Appointment status changes to 'confirmed' or 'cancelled'
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let appointment_id, user_email, partner_id, product_name, time_slot, date, new_status;

    if (body.event && body.data) {
      // Entity automation payload
      appointment_id = body.event.entity_id;
      user_email = body.data.user_email;
      partner_id = body.data.partner_id;
      product_name = body.data.product_name;
      time_slot = body.data.time_slot;
      date = body.data.date;
      new_status = body.data.status;
    } else {
      return Response.json({ error: 'Only entity automation payload supported' }, { status: 400 });
    }

    if (!user_email || !partner_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Only notify on confirmed or cancelled
    if (new_status !== 'confirmed' && new_status !== 'cancelled') {
      return Response.json({ success: true, skipped: `status=${new_status}` });
    }

    // Get partner info
    const partners = await base44.asServiceRole.entities.Partner.filter({ id: partner_id });
    const partner = partners[0];
    const partnerName = partner?.business_name || 'Parceiro';

    // Format date for display
    const dateFormatted = date
      ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      : date;

    const isConfirmed = new_status === 'confirmed';
    const notifType = isConfirmed ? 'appointment_confirmed' : 'appointment_cancelled';
    const title = isConfirmed ? '✅ Agendamento Confirmado!' : '❌ Agendamento Cancelado';
    const productPart = product_name ? ` para "${product_name}"` : '';
    const message = isConfirmed
      ? `Seu agendamento${productPart} em ${partnerName} foi confirmado para ${dateFormatted} às ${time_slot}.`
      : `Seu agendamento${productPart} em ${partnerName} em ${dateFormatted} às ${time_slot} foi cancelado. Entre em contato com o parceiro.`;

    // Avoid duplicate notification for same appointment + status
    const existing = await base44.asServiceRole.entities.UserNotification.filter({
      user_email,
      type: notifType,
      reference_id: appointment_id
    });
    if (existing.length > 0) {
      return Response.json({ success: true, skipped: 'duplicate' });
    }

    await base44.asServiceRole.entities.UserNotification.create({
      user_email,
      type: notifType,
      title,
      message,
      is_read: false,
      reference_id: appointment_id
    });

    console.log(`notifyAppointmentConfirmed: notified ${user_email} - status=${new_status}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyAppointmentConfirmed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});