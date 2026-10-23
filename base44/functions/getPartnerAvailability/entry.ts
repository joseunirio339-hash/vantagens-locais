import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Retorna apenas os horários já ocupados de um parceiro em uma data,
// sem expor os dados dos outros clientes agendados.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partner_id, date } = await req.json();
    if (!partner_id || !date) {
      return Response.json({ error: 'Informe partner_id e date' }, { status: 400 });
    }

    const appointments = await base44.asServiceRole.entities.Appointment.filter({
      partner_id,
      date
    });

    const taken_slots = appointments
      .filter((a) => a.status !== 'cancelled')
      .map((a) => a.time_slot)
      .filter(Boolean);

    return Response.json({ taken_slots });
  } catch (error) {
    console.error('[getPartnerAvailability] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}