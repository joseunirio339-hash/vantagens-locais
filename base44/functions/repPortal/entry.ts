import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Busca um cliente do próprio representante, sem estourar erro se o id for inválido.
async function findOwnedClient(base44, repId, clientId) {
  if (!clientId) return null;
  try {
    const record = await base44.asServiceRole.entities.Client.get(clientId);
    return record && record.representative_id === repId ? record : null;
  } catch (error) {
    return null;
  }
}

// Acesso do Portal do Representante e do App do Vendedor.
// A identidade vem SEMPRE da sessão logada: ninguém consulta dados de outro
// representante informando email ou id no corpo da requisição. A página pública
// de indicação recebe apenas nome, código e telefone do representante.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Perfil público (somente o necessário para a página de indicação)
    if (action === 'public_profile') {
      const code = (body.code || '').trim().toUpperCase();
      if (!code) return Response.json({ rep: null });
      const byCode = await base44.asServiceRole.entities.Representative.filter({ code, is_active: true });
      const found = byCode[0];
      return Response.json({
        rep: found ? { name: found.name, code: found.code, phone: found.phone || '' } : null
      });
    }

    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Faça login para acessar o portal.', needs_login: true }, { status: 401 });
    }

    const email = user.email.trim().toLowerCase();
    const query = { email, is_active: true };
    if (body.seller_only) {
      query.is_seller = true;
    }

    const reps = await base44.asServiceRole.entities.Representative.filter(query);
    const rep = reps[0];

    if (action === 'login') {
      return Response.json({ rep: rep || null });
    }

    if (!rep) {
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
        const owned = await findOwnedClient(base44, rep.id, client.id);
        if (!owned) {
          return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
        }
        const updated = await base44.asServiceRole.entities.Client.update(client.id, data);
        return Response.json({ client: updated });
      }

      const created = await base44.asServiceRole.entities.Client.create(data);
      return Response.json({ client: created });
    }

    if (action === 'delete_client') {
      const owned = await findOwnedClient(base44, rep.id, body.client_id);
      if (!owned) {
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