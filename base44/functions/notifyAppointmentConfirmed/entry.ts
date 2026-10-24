import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Avisa o cliente quando o parceiro confirma ou cancela o agendamento.
// Roda apenas pela automação/admin: o destinatário vem do agendamento no banco.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    if (!body.event || !body.data) {
      return Response.json({ error: 'Only entity automation payload supported' }, { status: 400 });
    }

    const appointment_id = body.event.entity_id || body.data.id;
    if (!appointment_id) {
      return Response.json({ error: 'Missing appointment id' }, { status: 400 });
    }

    // Relê o agendamento do banco (não confia no conteúdo recebido)
    const found = await base44.asServiceRole.entities.Appointment.filter({ id: appointment_id });
    const appointment = found[0];
    if (!appointment) {
      return Response.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const user_email = appointment.user_email;
    const partner_id = appointment.partner_id;
    const product_name = appointment.product_name;
    const time_slot = appointment.time_slot;
    const date = appointment.date;
    const new_status = appointment.status;

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

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyAppointmentConfirmed error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}