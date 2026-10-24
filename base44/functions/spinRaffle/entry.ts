import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { secureIndex } from '../../shared/security.ts';

// Giro da roleta decidido e gravado no servidor.
// Antes o navegador sorteava o prêmio com Math.random e gravava o RaffleSpin,
// então dava para inventar o prêmio máximo e reaproveitar o mesmo voucher
// quantas vezes quisesse. Agora só o servidor sorteia e grava, e cada voucher
// usado participa de um único giro.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Faça login para girar a roleta.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const raffleId = body.raffle_id;
    const voucherId = body.voucher_id;
    if (!raffleId || !voucherId) {
      return Response.json({ error: 'Sorteio e voucher são obrigatórios.' }, { status: 400 });
    }

    const raffles = await base44.asServiceRole.entities.Raffle.filter({ id: raffleId });
    const raffle = raffles[0];
    if (!raffle || !raffle.is_active) {
      return Response.json({ error: 'Este sorteio não está mais ativo.' }, { status: 404 });
    }
    if (raffle.ends_at && new Date(raffle.ends_at) < new Date()) {
      return Response.json({ error: 'Este sorteio já foi encerrado.' }, { status: 400 });
    }

    // A ordem dos prêmios é a mesma que a roleta desenha na tela
    const prizes = Array.isArray(raffle.prizes) ? raffle.prizes : [];
    if (prizes.length === 0) {
      return Response.json({ error: 'Este sorteio não tem prêmios configurados.' }, { status: 400 });
    }

    const vouchers = await base44.asServiceRole.entities.Voucher.filter({ id: voucherId });
    const voucher = vouchers[0];
    if (!voucher || voucher.user_email !== user.email) {
      return Response.json({ error: 'Voucher não encontrado nesta conta.' }, { status: 404 });
    }
    if (voucher.status !== 'used') {
      return Response.json({ error: 'Use o voucher na loja antes de participar do sorteio.' }, { status: 400 });
    }
    if (voucher.partner_id !== raffle.partner_id) {
      return Response.json({ error: 'Este voucher é de outro parceiro.' }, { status: 400 });
    }

    // Cada voucher participa de um único giro — checagem no banco, não na tela
    const alreadySpun = await base44.asServiceRole.entities.RaffleSpin.filter({ voucher_id: voucherId });
    if (alreadySpun.length > 0) {
      return Response.json({ error: 'Este voucher já foi usado em um giro.' }, { status: 409 });
    }

    const [mySpins, myVouchers] = await Promise.all([
      base44.asServiceRole.entities.RaffleSpin.filter({
        partner_id: raffle.partner_id,
        user_email: user.email
      }),
      base44.asServiceRole.entities.Voucher.filter({
        partner_id: raffle.partner_id,
        user_email: user.email,
        status: 'used'
      })
    ]);

    const needed = Math.max(parseInt(raffle.vouchers_per_spin, 10) || 1, 1);
    const spentIds = new Set(mySpins.map(s => s.voucher_id));
    const spendable = myVouchers.filter(v => !spentIds.has(v.id));
    if (spendable.length < needed) {
      return Response.json({
        error: `Você precisa de ${needed} voucher(s) usado(s) neste parceiro para girar.`
      }, { status: 400 });
    }

    // Sorteio ponderado com aleatoriedade criptográfica
    const weights = prizes.map(p => (Number(p?.weight) > 0 ? Number(p.weight) : 1));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const steps = 1000000;
    const ticket = (secureIndex(steps) / steps) * totalWeight;
    let prizeIndex = prizes.length - 1;
    let accumulated = 0;
    for (let i = 0; i < weights.length; i++) {
      accumulated += weights[i];
      if (ticket < accumulated) {
        prizeIndex = i;
        break;
      }
    }

    const wonPrize = prizes[prizeIndex] || {};

    const spin = await base44.asServiceRole.entities.RaffleSpin.create({
      raffle_id: raffle.id,
      partner_id: raffle.partner_id,
      user_email: user.email,
      voucher_id: voucher.id,
      prize_won: wonPrize.label || 'Prêmio'
    });

    return Response.json({
      success: true,
      spin_id: spin.id,
      prize_index: prizeIndex,
      prize: wonPrize.label || 'Prêmio'
    });

  } catch (error) {
    console.error('spinRaffle error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}