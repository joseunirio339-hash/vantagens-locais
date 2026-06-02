import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calcula a janela: vouchers que vencem entre 23h e 25h a partir de agora
    const now = new Date();
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const in23hDate = in23h.toISOString().split('T')[0];
    const in25hDate = in25h.toISOString().split('T')[0];

    // Busca todos os vouchers pendentes
    const vouchers = await base44.asServiceRole.entities.Voucher.filter({ status: 'pending' });

    const toRemind = vouchers.filter(v => {
      if (!v.expires_at || !v.user_email) return false;
      const expDate = v.expires_at.split('T')[0];
      return expDate >= in23hDate && expDate <= in25hDate;
    });

    console.log(`Vouchers próximos do vencimento: ${toRemind.length}`);

    let sent = 0;
    let errors = 0;

    for (const voucher of toRemind) {
      try {
        const productName = voucher.product_name || 'seu produto';
        const partnerName = voucher.partner_id ? `parceiro` : 'parceiro';
        const expiresFormatted = new Date(voucher.expires_at + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric'
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: voucher.user_email,
          subject: `⏰ Seu voucher vence amanhã! — ${productName}`,
          body: `
Olá${voucher.user_name ? ', ' + voucher.user_name : ''}!

Seu voucher está prestes a vencer. Não perca essa oportunidade!

🎟️ Voucher: ${voucher.code}
🛍️ Produto: ${productName}
📅 Vence em: ${expiresFormatted}

Apresente este código na loja para aproveitar seu desconto antes que expire.

Acesse seus vouchers em: https://app.linka.com.br/MyVouchers

---
LINKA — Conectando descontos a você
          `.trim()
        });

        // Registra notificação no sistema
        await base44.asServiceRole.entities.UserNotification.create({
          user_email: voucher.user_email,
          type: 'voucher_expiring',
          title: '⏰ Voucher vencendo amanhã!',
          message: `Seu voucher de "${productName}" vence amanhã. Use antes que expire!`,
          reference_id: voucher.id,
          is_read: false
        });

        sent++;
        console.log(`Lembrete enviado para ${voucher.user_email} - voucher ${voucher.code}`);
      } catch (err) {
        errors++;
        console.error(`Erro ao enviar lembrete para voucher ${voucher.code}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      checked: vouchers.length,
      reminded: sent,
      errors
    });
  } catch (error) {
    console.error('Erro na função voucherExpiryReminder:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});