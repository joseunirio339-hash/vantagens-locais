import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Acesso do Portal do Representante e do App do Vendedor.
// O representante se identifica pelo email (ou pelo código do link) e o servidor
// devolve apenas os dados daquele representante: comissões, clientes do funil e
// as ações de cadastrar/editar/remover cliente do próprio funil.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const action = body.action;
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim().toUpperCase();

    if (action === 'login') {
      if (code) {
        const byCode = await base44.asServiceRole.entities.Representative.filter({ code, is_active: true });
        return Response.json({ rep: byCode[0] || null });
      }
      if (!email) {
        return Response.json({ rep: null });
      }
      const query = { email, is_active: true };
      if (body.seller_only) {
        query.is_seller = true;
      }
      const reps = await base44.asServiceRole.entities.Representative.filter(query);
      return Response.json({ rep: reps[0] || null });
    }

    // As demais ações só valem para o representante ativo dono dos dados.
    const reps = await base44.asServiceRole.entities.Representative.filter({ email, is_active: true });
    const rep = reps[0];
    if (!rep || rep.id !== body.rep_id) {
      return Response.json({ error: 'Acesso não autorizado para este representante.' }, { status: 403 });
    }

    if (action === 'commissions') {
      const all = await base44.asServiceRole.entities.RepresentativeCommission.filter({ representative_id: rep.id });
      const commissions = all
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 50);
      return Response.json({ commissions });
    }

    if (action === 'clients') {
      const all = await base44.asServiceRole.entities.Client.filter({ representative_id: rep.id });
      const clients = all
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 100);
      return Response.json({ clients });
    }

    if (action === 'save_client') {
      const client = body.client || {};
      if (!client.name) {
        return Response.json({ error: 'Informe o nome do cliente.' }, { status: 400 });
      }
      const data = {
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        status: client.status || 'prospect',
        plan_interest: client.plan_interest || 'indefinido',
        representative_id: rep.id,
        representative_name: rep.name,
      };
      if (client.notes || client.id) {
        data.notes = client.notes || '';
      }

      if (client.id) {
        const existing = await base44.asServiceRole.entities.Client.filter({ id: client.id, representative_id: rep.id });
        if (!existing[0]) {
          return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
        }
        const updated = await base44.asServiceRole.entities.Client.update(client.id, data);
        return Response.json({ client: updated });
      }

      const created = await base44.asServiceRole.entities.Client.create(data);
      return Response.json({ client: created });
    }

    if (action === 'delete_client') {
      const existing = await base44.asServiceRole.entities.Client.filter({
        id: body.client_id,
        representative_id: rep.id,
      });
      if (!existing[0]) {
        return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
      }
      await base44.asServiceRole.entities.Client.delete(body.client_id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    console.error('[repPortal] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}