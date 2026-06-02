import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all confirmed appointments
    const appointments = await base44.asServiceRole.entities.Appointment.filter({ status: 'confirmed' });

    const now = new Date();
    // Window: appointments starting between 1h55min and 2h05min from now (10-min window to avoid duplicates)
    const windowStart = new Date(now.getTime() + 115 * 60 * 1000); // +1h55min
    const windowEnd   = new Date(now.getTime() + 125 * 60 * 1000); // +2h05min

    const upcoming = appointments.filter(appt => {
      if (!appt.date || !appt.time_slot) return false;
      const [hours, minutes] = appt.time_slot.split(':').map(Number);
      const apptTime = new Date(`${appt.date}T${String(hours).padStart(2,'0')}:${String(minutes || 0).padStart(2,'0')}:00`);
      return apptTime >= windowStart && apptTime <= windowEnd;
    });

    console.log(`appointmentReminder: ${upcoming.length} appointment(s) in the 2h window`);

    let sent = 0;

    for (const appt of upcoming) {
      const appointmentId = appt.id;
      const REMINDER_TYPE = 'appointment_reminder_2h';

      // Skip if already sent reminder for this appointment
      const existing = await base44.asServiceRole.entities.UserNotification.filter({
        user_email: appt.user_email,
        type: REMINDER_TYPE,
        reference_id: appointmentId
      });
      if (existing.length > 0) {
        console.log(`Already reminded ${appt.user_email} for appointment ${appointmentId}`);
        continue;
      }

      // Get partner info
      const partners = await base44.asServiceRole.entities.Partner.filter({ id: appt.partner_id });
      const partner = partners[0];
      if (!partner) continue;

      const partnerName = partner.business_name;
      const dateFormatted = new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
      const productPart = appt.product_name ? ` de "${appt.product_name}"` : '';

      // --- Notify client via in-app notification ---
      await base44.asServiceRole.entities.UserNotification.create({
        user_email: appt.user_email,
        type: REMINDER_TYPE,
        title: '⏰ Lembrete de Agendamento',
        message: `Seu agendamento${productPart} em ${partnerName} começa em 2 horas! (${dateFormatted} às ${appt.time_slot})`,
        is_read: false,
        reference_id: appointmentId
      });

      // --- E-mail for client ---
      if (appt.user_email) {
        const clientHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #7c3aed, #db2777); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900;">⏰ CLUBE MAX DESCONTOS</h1>
    <p style="color: #e9d5ff; margin: 8px 0 0; font-size: 14px;">Lembrete de Agendamento</p>
  </div>
  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Olá, <strong>${appt.user_name || 'Cliente'}</strong>! 👋</p>
    <p style="color: #6b7280; font-size: 14px;">Seu agendamento está chegando! Não se esqueça:</p>
    <div style="background: #f5f3ff; border: 2px solid #7c3aed; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="font-size: 32px; margin: 0 0 8px;">⏰</p>
      <p style="font-size: 22px; font-weight: 900; color: #5b21b6; margin: 0;">Em 2 horas!</p>
      <p style="color: #6d28d9; font-size: 15px; margin: 8px 0 0;">${dateFormatted} às <strong>${appt.time_slot}</strong></p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Estabelecimento</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${partnerName}</td>
      </tr>
      ${appt.product_name ? `<tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Serviço</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${appt.product_name}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Endereço</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${partner.address || 'Ver no app'}</td>
      </tr>
    </table>
    ${appt.notes ? `<div style="background: #fef9c3; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin-top: 16px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">📝 <strong>Observações:</strong> ${appt.notes}</p>
    </div>` : ''}
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 28px;">Clube Max Descontos — Bom atendimento! 🛒</p>
  </div>
</div>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: appt.user_email,
          subject: `⏰ Lembrete: seu agendamento em ${partnerName} é em 2 horas!`,
          body: clientHtml,
          from_name: 'Clube Max Descontos'
        });
      }

      // --- Notify partner via in-app notification ---
      await base44.asServiceRole.entities.Notification.create({
        partner_id: appt.partner_id,
        type: 'new_voucher', // reusing existing type as closest match
        title: '⏰ Agendamento em 2 horas',
        message: `${appt.user_name || appt.user_email}${appt.product_name ? ` (${appt.product_name})` : ''} chega em 2 horas — ${dateFormatted} às ${appt.time_slot}.`,
        is_read: false,
        reference_id: appointmentId
      });

      // --- E-mail for partner ---
      if (partner.owner_email) {
        const partnerHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #059669, #0891b2); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900;">🏪 CLUBE MAX DESCONTOS</h1>
    <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 14px;">Lembrete de Agendamento</p>
  </div>
  <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Olá, <strong>${partnerName}</strong>! 👋</p>
    <p style="color: #6b7280; font-size: 14px;">Um cliente chega em <strong>2 horas</strong>. Prepare-se para o atendimento:</p>
    <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="font-size: 28px; font-weight: 900; color: #065f46; margin: 0;">${appt.user_name || 'Cliente'}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 6px 0 0;">${dateFormatted} às <strong>${appt.time_slot}</strong></p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      ${appt.product_name ? `<tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Serviço</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${appt.product_name}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">E-mail do cliente</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827; font-size: 14px; text-align: right;">${appt.user_email}</td>
      </tr>
    </table>
    ${appt.notes ? `<div style="background: #fef9c3; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin-top: 16px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">📝 <strong>Observações do cliente:</strong> ${appt.notes}</p>
    </div>` : ''}
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 28px;">Clube Max Descontos — Boas vendas! 🚀</p>
  </div>
</div>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: partner.owner_email,
          subject: `⏰ Cliente chega em 2h: ${appt.user_name || appt.user_email} — ${appt.time_slot}`,
          body: partnerHtml,
          from_name: 'Clube Max Descontos'
        });
      }

      sent++;
      console.log(`Reminder sent for appointment ${appointmentId} (client: ${appt.user_email}, partner: ${partner.owner_email})`);
    }

    return Response.json({ success: true, checked: appointments.length, sent });
  } catch (error) {
    console.error('appointmentReminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});