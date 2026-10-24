import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { escapeHtml, secureCode, secureIndex } from '../../shared/security.ts';

// Geração de vouchers feita no servidor.
// O produto, o parceiro e os preços vêm do banco; pontos e selos só existem aqui,
// então o navegador não consegue mais inventar saldo nem alterar valores.
const VOUCHER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PRIZE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const money = (value) => Number(value || 0).toFixed(2).replace('.', ',');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Faça login para gerar o voucher.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const productId = body.product_id;
    const cpf = String(body.cpf || '').replace(/\D/g, '');
    const quantity = Math.min(Math.max(parseInt(body.quantity, 10) || 1, 1), 20);
    const source = body.source === 'entrepreneur' ? 'entrepreneur' : 'product';
    const useSingleVoucher = !!body.single_voucher && quantity > 3;

    if (cpf.length !== 11) {
      return Response.json({ error: 'CPF inválido. Digite os 11 dígitos.' }, { status: 400 });
    }
    if (!productId) {
      return Response.json({ error: 'Produto não informado.' }, { status: 400 });
    }

    // Produto e parceiro são lidos do banco — o cliente não escolhe preços
    const products = await base44.asServiceRole.entities.Product.filter({ id: productId });
    const product = products[0];
    if (!product || !product.is_active) {
      return Response.json({ error: 'Este produto não está disponível.' }, { status: 404 });
    }

    const partners = await base44.asServiceRole.entities.Partner.filter({ id: product.partner_id });
    const partner = partners[0];
    if (!partner) {
      return Response.json({ error: 'Parceiro não encontrado.' }, { status: 404 });
    }

    const originalPrice = Number(product.original_price || 0);
    const discountPrice = Number(product.discount_price || 0);
    if (!originalPrice || discountPrice >= originalPrice) {
      return Response.json({ error: 'Este produto não tem desconto ativo.' }, { status: 400 });
    }

    // Limite: um voucher ativo por produto e por usuário. Sem isso dá para gerar
    // vouchers sem parar e acumular pontos, selos e códigos de desconto.
    const today = new Date().toISOString().split('T')[0];
    const activeVouchers = await base44.asServiceRole.entities.Voucher.filter({
      user_email: user.email,
      product_id: product.id,
      status: 'pending',
      expires_at: { $gte: today }
    });
    if (activeVouchers.length > 0) {
      return Response.json({
        error: 'Você já tem um voucher ativo para este produto. Use-o ou aguarde a validade antes de gerar outro.'
      }, { status: 429 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const expires_at = expiresAt.toISOString().split('T')[0];

    const base = {
      partner_id: partner.id,
      partner_owner_email: partner.owner_email,
      user_cpf: cpf,
      user_name: user.full_name || '',
      user_email: user.email,
      status: 'pending',
      expires_at
    };

    const records = [];
    if (useSingleVoucher) {
      records.push({
        ...base,
        code: secureCode(8, VOUCHER_CHARS),
        product_id: product.id,
        product_name: `${product.name} (${quantity}x)`,
        original_price: originalPrice * quantity,
        discount_price: discountPrice * quantity
      });
    } else {
      for (let i = 0; i < quantity; i++) {
        records.push({
          ...base,
          code: secureCode(8, VOUCHER_CHARS),
          product_id: product.id,
          product_name: product.name,
          original_price: originalPrice,
          discount_price: discountPrice
        });
      }
    }

    const created = await base44.asServiceRole.entities.Voucher.bulkCreate(records);
    const totalDiscount = (useSingleVoucher ? discountPrice * quantity : discountPrice * quantity);

    // Notificação no painel do parceiro
    if (source === 'product') {
      await base44.asServiceRole.entities.Notification.create({
        partner_id: partner.id,
        partner_owner_email: partner.owner_email,
        type: 'new_voucher',
        title: 'Novo Voucher Gerado!',
        message: `${user.full_name || 'Um cliente'} gerou ${quantity} voucher${quantity > 1 ? 's' : ''} para "${product.name}" — Total: R$ ${money(totalDiscount)}`,
        is_read: false,
        reference_id: created[0].id
      });
    } else {
      await base44.asServiceRole.entities.Notification.create({
        partner_id: partner.id,
        partner_owner_email: partner.owner_email,
        type: 'new_voucher',
        title: '🎉 Nova venda de desconto!',
        message: `${user.full_name || 'Um cliente'} gerou ${useSingleVoucher ? 'voucher único' : `${quantity} vouchers`} para "${product.name}" — Total: R$ ${money(totalDiscount)}`,
        is_read: false,
        reference_id: created[0].id
      });
    }

    // E-mails (cliente e parceiro) do fluxo de produtos
    if (source === 'product') {
      const customerMail = base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `🎫 Seu voucher do Clube Max: ${created[0].code}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #7322c3; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #fafafa; margin: 0; font-size: 22px;">🎫 Seu voucher está pronto!</h1>
            </div>
            <div style="background: #fefcf8; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 16px 16px;">
              <p style="color: #334155; font-size: 15px; margin: 0 0 12px;">Olá ${escapeHtml(user.full_name) || 'cliente'}! Use o código abaixo na loja:</p>
              <p style="font-size: 26px; font-weight: bold; letter-spacing: 3px; color: #7322c3; text-align: center; margin: 16px 0;">${escapeHtml(created[0].code)}</p>
              <p style="color: #334155; font-size: 15px; margin: 0 0 4px;"><strong>${escapeHtml(product.name)}</strong> em ${escapeHtml(partner.business_name) || 'parceiro'}</p>
              <p style="color: #64748b; font-size: 13px; margin: 0 0 12px;">De R$ ${money(originalPrice * quantity)} por R$ ${money(totalDiscount)} · válido até ${new Date(expires_at + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://clubemaxdescontos.com.br/MyVouchers" style="background: #7322c3; color: #fafafa; padding: 12px 28px; border-radius: 16px; text-decoration: none; font-weight: bold; font-size: 15px;">Ver meus vouchers</a>
              </div>
            </div>
          </div>
        `
      }).catch(err => console.warn('E-mail para o cliente falhou:', err.message));

      const partnerMail = partner.owner_email
        ? base44.asServiceRole.integrations.Core.SendEmail({
            to: partner.owner_email,
            subject: `🎉 Novo voucher gerado: ${product.name}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7322c3; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
                  <h1 style="color: #fafafa; margin: 0; font-size: 22px;">🎉 Novo voucher gerado</h1>
                </div>
                <div style="background: #fefcf8; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 16px 16px;">
                  <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">${escapeHtml(user.full_name) || 'Um cliente'} gerou ${quantity} voucher${quantity > 1 ? 's' : ''} para "${escapeHtml(product.name)}".</p>
                  <p style="color: #334155; font-size: 15px; margin: 0;">Total com desconto: <strong>R$ ${money(totalDiscount)}</strong></p>
                </div>
              </div>
            `
          }).catch(err => console.warn('E-mail para o parceiro falhou:', err.message))
        : Promise.resolve();

      await Promise.all([customerMail, partnerMail]);
    }

    // Pontos de fidelidade: 10 pontos por voucher (fluxo de produtos)
    let pointsAdded = 0;
    if (source === 'product') {
      const pointsList = await base44.asServiceRole.entities.UserPoints.filter({ user_email: user.email });
      if (pointsList.length > 0) {
        pointsAdded = created.length * 10;
        const up = pointsList[0];
        await base44.asServiceRole.entities.UserPoints.update(up.id, {
          total_points: (up.total_points || 0) + pointsAdded,
          lifetime_points: (up.lifetime_points || 0) + pointsAdded,
          voucher_points: (up.voucher_points || 0) + pointsAdded
        });
      }
    }

    // Selos de fidelidade: 1 selo por voucher (fluxo de produtos)
    let stampPrize = null;
    let stampGoal = null;
    if (source === 'product') {
      const configs = await base44.asServiceRole.entities.StampCardConfig.filter({
        partner_id: partner.id,
        is_active: true
      });

      if (configs.length > 0) {
        const cfg = configs[0];
        const goal = cfg.stamps_goal || 5;
        stampGoal = goal;

        const existingCards = await base44.asServiceRole.entities.StampCard.filter({
          user_email: user.email,
          partner_id: partner.id
        });

        let card = existingCards[0] || null;
        if (!card) {
          card = await base44.asServiceRole.entities.StampCard.create({
            user_email: user.email,
            partner_id: partner.id,
            partner_owner_email: partner.owner_email,
            partner_name: partner.business_name,
            stamps_count: 0,
            stamps_goal: goal,
            total_completed: 0,
            reward_status: 'none'
          });
        }

        if (card.reward_status !== 'unlocked') {
          const newCount = (card.stamps_count || 0) + created.length;

          if (newCount >= goal) {
            const options = cfg.discount_options?.length ? cfg.discount_options : ['10% OFF'];
            stampPrize = options[secureIndex(options.length)];

            await base44.asServiceRole.entities.StampCard.update(card.id, {
              stamps_count: newCount - goal,
              stamps_goal: goal,
              total_completed: (card.total_completed || 0) + 1,
              discount_revealed: stampPrize,
              reward_code: 'SELO-' + secureCode(6, PRIZE_CHARS),
              reward_status: 'unlocked'
            });
          } else {
            await base44.asServiceRole.entities.StampCard.update(card.id, {
              stamps_count: newCount,
              stamps_goal: goal
            });
          }
        }
      }
    }

    return Response.json({
      success: true,
      vouchers: created,
      points_added: pointsAdded,
      stamp_prize: stampPrize,
      stamp_goal: stampGoal
    });

  } catch (error) {
    console.error('createVoucher error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}