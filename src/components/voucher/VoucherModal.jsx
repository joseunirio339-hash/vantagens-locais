import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, CheckCircle, Loader2, ShoppingCart, Plus, Minus, Package, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function VoucherModal({ open, onClose, product, partner, user, onSuccess }) {
  const [cpf, setCpf] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [useSingleVoucher, setUseSingleVoucher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);

  const showSingleVoucherOption = quantity > 3;

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const totalOriginal = (product?.original_price || 0) * quantity;
  const totalDesconto = (product?.discount_price || 0) * quantity;
  const economia = totalOriginal - totalDesconto;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      toast.error('CPF inválido. Digite os 11 dígitos.');
      return;
    }

    setLoading(true);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const createdVouchers = [];
    const isSingle = showSingleVoucherOption && useSingleVoucher;

    if (isSingle) {
      // 1 voucher único representando todas as unidades
      const v = await base44.entities.Voucher.create({
        code: generateVoucherCode(),
        product_id: product.id,
        partner_id: partner.id,
        user_cpf: cleanCPF,
        user_name: user?.full_name || '',
        user_email: user?.email || '',
        product_name: `${product.name} (${quantity}x)`,
        original_price: product.original_price * quantity,
        discount_price: product.discount_price * quantity,
        status: 'pending',
        expires_at: expiresAt.toISOString().split('T')[0]
      });
      createdVouchers.push(v);
    } else {
      for (let i = 0; i < quantity; i++) {
        const v = await base44.entities.Voucher.create({
          code: generateVoucherCode(),
          product_id: product.id,
          partner_id: partner.id,
          user_cpf: cleanCPF,
          user_name: user?.full_name || '',
          user_email: user?.email || '',
          product_name: product.name,
          original_price: product.original_price,
          discount_price: product.discount_price,
          status: 'pending',
          expires_at: expiresAt.toISOString().split('T')[0]
        });
        createdVouchers.push(v);
      }
    }

    await base44.entities.Notification.create({
      partner_id: partner.id,
      type: 'new_voucher',
      title: 'Novo Voucher Gerado!',
      message: `${user?.full_name || 'Um cliente'} gerou ${quantity} voucher${quantity > 1 ? 's' : ''} para "${product.name}" — Total: R$ ${totalDesconto.toFixed(2).replace('.', ',')}`,
      is_read: false,
      reference_id: createdVouchers[0].id
    });

    // E-mail para o cliente
    if (user?.email) {
      base44.functions.invoke('sendEmailNotification', {
        type: 'voucher_generated',
        data: {
          user_email: user.email,
          user_name: user.full_name || 'Cliente',
          voucher_code: createdVouchers[0].code,
          product_name: createdVouchers[0].product_name,
          partner_name: partner.business_name,
          original_price: totalOriginal.toFixed(2).replace('.', ','),
          discount_price: totalDesconto.toFixed(2).replace('.', ','),
          expires_at: new Date(createdVouchers[0].expires_at).toLocaleDateString('pt-BR')
        }
      });
    }

    // E-mail para o parceiro (novo voucher gerado)
    if (partner?.owner_email) {
      base44.functions.invoke('sendEmailNotification', {
        type: 'new_voucher_partner',
        data: {
          partner_email: partner.owner_email,
          partner_name: partner.business_name,
          user_name: user?.full_name || 'Não informado',
          product_name: product.name,
          quantity: quantity,
          discount_price: totalDesconto.toFixed(2).replace('.', ',')
        }
      });
    }

    // Creditar pontos de fidelidade: 10 pts por voucher
    if (user?.email) {
      const pointsToAdd = createdVouchers.length * 10;
      const pointsList = await base44.entities.UserPoints.filter({ user_email: user.email });
      if (pointsList.length > 0) {
        const up = pointsList[0];
        await base44.entities.UserPoints.update(up.id, {
          total_points: (up.total_points || 0) + pointsToAdd,
          lifetime_points: (up.lifetime_points || 0) + pointsToAdd,
          voucher_points: (up.voucher_points || 0) + pointsToAdd
        });
      }
    }

    // Selos de fidelidade: 1 selo por voucher (não por quantidade em lote)
    if (user?.email && partner?.id) {
      const stampConfigs = await base44.entities.StampCardConfig.filter({ partner_id: partner.id, is_active: true });
      if (stampConfigs.length > 0) {
        const cfg = stampConfigs[0];
        const stampsToAdd = createdVouchers.length; // 1 selo por voucher individual
        const existingCards = await base44.entities.StampCard.filter({ user_email: user.email, partner_id: partner.id });
        
        let card = existingCards.length > 0 ? existingCards[0] : null;
        if (!card) {
          card = await base44.entities.StampCard.create({
            user_email: user.email,
            partner_id: partner.id,
            partner_name: partner.business_name,
            stamps_count: 0,
            stamps_goal: cfg.stamps_goal,
            total_completed: 0,
            reward_status: 'none'
          });
        }

        // Only add stamps if no pending prize
        if (card.reward_status !== 'unlocked') {
          const newCount = (card.stamps_count || 0) + stampsToAdd;
          const goal = cfg.stamps_goal || 5;

          if (newCount >= goal) {
            // Unlock prize!
            const options = cfg.discount_options || ['10% OFF'];
            const prize = options[Math.floor(Math.random() * options.length)];
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const code = 'SELO-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

            await base44.entities.StampCard.update(card.id, {
              stamps_count: newCount - goal, // carry over extra stamps
              stamps_goal: goal,
              total_completed: (card.total_completed || 0) + 1,
              discount_revealed: prize,
              reward_code: code,
              reward_status: 'unlocked'
            });
            toast.success(`🎉 Cartão completo! Você desbloqueou: ${prize}! Veja em Loja de Fidelidade.`, { duration: 6000 });
          } else {
            await base44.entities.StampCard.update(card.id, {
              stamps_count: newCount,
              stamps_goal: goal
            });
          }
        }
      }
    }

    setVouchers(createdVouchers);
    setLoading(false);
    toast.success(`${quantity} voucher${quantity > 1 ? 's' : ''} gerado${quantity > 1 ? 's' : ''}! +${createdVouchers.length * 10} pontos de fidelidade 🪙`);
    onSuccess?.(createdVouchers[0]);
  };

  const handleClose = () => {
    setCpf('');
    setQuantity(1);
    setUseSingleVoucher(false);
    setVouchers([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            {vouchers.length > 0 ? 'Vouchers Gerados!' : 'Gerar Voucher de Desconto'}
          </DialogTitle>
        </DialogHeader>

        {vouchers.length === 0 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Produto */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">{partner?.business_name}</p>
              <h3 className="font-semibold text-slate-800">{product?.name}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-emerald-600">
                  R$ {product?.discount_price?.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  R$ {product?.original_price?.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-emerald-600 font-medium">por unidade</span>
              </div>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold text-slate-800 w-10 text-center">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => Math.min(20, q + 1))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Opção voucher único (acima de 3 itens) */}
            {showSingleVoucherOption && (
              <div
                onClick={() => setUseSingleVoucher(v => !v)}
                className={`cursor-pointer flex items-start gap-3 border-2 rounded-xl p-3 transition-all ${
                  useSingleVoucher
                    ? 'border-violet-400 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-violet-200'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  useSingleVoucher ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
                }`}>
                  {useSingleVoucher && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-slate-800">Voucher Único de Compra</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gera 1 código único para todas as {quantity} unidades. Ideal para compras em lote — apresente um só código na loja.
                  </p>
                </div>
              </div>
            )}

            {/* Resumo do total */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal original ({quantity}x)</span>
                <span className="line-through">R$ {totalOriginal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Economia total</span>
                <span>- R$ {economia.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-slate-800 text-base">
                <span>Total com desconto</span>
                <span className="text-emerald-600">R$ {totalDesconto.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF do Comprador</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14}
                required
              />
              <p className="text-xs text-slate-500">O CPF será usado para identificar o voucher na loja</p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Ticket className="w-4 h-4 mr-2" />
              )}
              {showSingleVoucherOption && useSingleVoucher
                ? `Gerar 1 Voucher Único (${quantity}x)`
                : quantity > 1 ? `Gerar ${quantity} Vouchers` : 'Gerar Voucher'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-5 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-1 font-medium">
                {vouchers.length} Voucher{vouchers.length > 1 ? 's' : ''} gerado{vouchers.length > 1 ? 's' : ''}!
              </p>
              {vouchers.length === 1 ? (
                <>
                  <div className="flex justify-center my-3">
                    <QRCodeSVG value={vouchers[0].code} size={160} bgColor="#f0fdf4" fgColor="#065f46" level="M" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 tracking-wider font-mono">{vouchers[0].code}</p>
                </>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {vouchers.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <QRCodeSVG value={v.code} size={100} bgColor="#f0fdf4" fgColor="#065f46" level="M" />
                      <span className="bg-white border border-emerald-300 rounded-lg px-3 py-1 text-sm font-bold text-emerald-700 tracking-wider">
                        {v.code}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Válido até {new Date(vouchers[0].expires_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Produto</span>
                <span className="font-medium">{vouchers[0].product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantidade</span>
                <span className="font-medium">{vouchers.length}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CPF</span>
                <span className="font-medium">{formatCPF(vouchers[0].user_cpf)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span className="text-slate-700">Total com Desconto</span>
                <span className="text-emerald-600">
                  R$ {(vouchers[0].discount_price * vouchers.length).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <p className="text-xs text-center text-slate-500">Apresente os códigos na loja para usar o desconto</p>

            {partner?.whatsapp_business_enabled && partner?.whatsapp_business_number && (
              <a
                href={`https://wa.me/${partner.whatsapp_business_number}?text=${encodeURIComponent(`Olá! Gerei o voucher *${vouchers[0]?.code}* para o produto *${vouchers[0]?.product_name}* com desconto. Gostaria de finalizar minha compra!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 h-11 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Comprar pelo WhatsApp Business
              </a>
            )}

            <Button onClick={handleClose} className="w-full" variant="outline">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}