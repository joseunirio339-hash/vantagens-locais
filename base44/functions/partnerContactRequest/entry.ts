import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Recebe o interesse de um lojista na página "Seja Parceiro" e avisa a equipe do clube.
// O destinatário é fixo: quem preenche o formulário não escolhe para onde o e-mail vai.
const TEAM_EMAIL = 'joseunirio339@gmail.com';

const clean = (value, max) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const nome = clean(body.nome, 120);
    const negocio = clean(body.negocio, 120);
    const telefone = clean(body.telefone, 40);
    const cidade = clean(body.cidade, 120);
    const mensagem = String(body.mensagem ?? '').trim().slice(0, 1000);

    if (!nome || !negocio || !telefone) {
      return Response.json({ error: 'Informe nome, negócio e telefone.' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: TEAM_EMAIL,
      subject: `[Clube Max] Novo interesse de parceiro: ${negocio}`,
      body: `
Novo interesse de lojista parceiro:

Nome: ${nome}
Negócio: ${negocio}
Telefone: ${telefone}
Cidade: ${cidade || '(não informada)'}
Mensagem: ${mensagem || '(sem mensagem)'}
      `.trim()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('partnerContactRequest error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}