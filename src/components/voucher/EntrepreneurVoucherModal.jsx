import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Ticket, CheckCircle, Loader2, ShoppingBag, MapPin, Phone, Tag, Plus, Minus, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const categoryLabels = {
  doceria: '🍰 Doceria',
  hamburgueria: '🍔 Hamburgueria',
  trailer_food: '🚚 Trailer / Food Truck',
  artesanato: '🎨 Artesanato',
  confeitaria: '🎂 Confeitaria',
  salgados: '🥟 Salgados',
  costura: '🧵 Costura / Moda',
  beleza: '💅 Beleza',
  saude: '💚 Saúde',
  servicos: '🔧 Serviços',
  outros: '✨ Empreendedor'
};

export default function EntrepreneurVoucherModal({
  open,
  onClose,
  product,
  partner,
  user,
  onSuccess
}) {
  const [cpf, setCpf] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);

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
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const discountPct = product
    ? Math.round(((product.original_price - product.discount_price) / product.original_price) * 100)
    : 0;

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

    await base44.entities.Notification.create({
      partner_id: partner.id,
      type: 'new_voucher',
      title: '🎉 Nova venda de desconto!',
      message: `${user?.full_name || 'Um cliente'} gerou ${quantity} voucher${quantity > 1 ? 's' : ''} para "${product.name}" — Total: R$ ${totalDesconto.toFixed(2).replace('.', ',')}`,
      is_read: false,
      reference_id: createdVouchers[0].id
    });

    setVouchers(createdVouchers);
    setLoading(false);
    toast.success(`${quantity} voucher${quantity > 1 ? 's' : ''} gerado${quantity > 1 ? 's' : ''} com sucesso!`);
    onSuccess?.(createdVouchers[0]);
  };

  const handleClose = () => {
    setCpf('');
    setQuantity(1);
    setVouchers([]);
    onClose();
  };

  const categoryLabel = categoryLabels[partner?.category] || '✨ Empreendedor';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            {vouchers.length > 0 ? 'Vouchers Gerados com Sucesso!' : 'Garantir Desconto'}
          </DialogTitle>
        </DialogHeader>

        {vouchers.length === 0 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card do empreendedor */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {partner?.logo_url ? (
                    <img src={partner.logo_url} alt={partner.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-sm">{partner?.business_name}</h3>
                    <Badge className="bg-amber-100 text-amber-700 text-xs border-0">{categoryLabel}</Badge>
                  </div>
                  {partner?.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {partner.address}
                    </p>
                  )}
                  {partner?.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {partner.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Produto */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              {product?.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover rounded-lg mb-3" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-slate-800">{product?.name}</h4>
                  {product?.description && (
                    <p className="text-xs text-slate-500 mt-1">{product.description}</p>
                  )}
                </div>
                {discountPct > 0 && (
                  <Badge className="bg-emerald-500 text-white border-0 flex-shrink-0">
                    <Tag className="w-3 h-3 mr-1" />-{discountPct}%
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-emerald-600">R$ {product?.discount_price?.toFixed(2).replace('.', ',')}</span>
                <span className="text-sm text-slate-400 line-through">R$ {product?.original_price?.toFixed(2).replace('.', ',')}</span>
                <span className="text-xs text-emerald-600 font-medium">por unidade</span>
              </div>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold text-slate-800 w-10 text-center">{quantity}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(q => Math.min(20, q + 1))}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

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
              <Label htmlFor="cpf">Seu CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14}
                required
              />
              <p className="text-xs text-slate-500">O CPF identifica seu voucher na hora da compra</p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Ticket className="w-5 h-5 mr-2" />
              )}
              {quantity > 1 ? `Gerar ${quantity} Vouchers` : 'Gerar Meu Voucher de Desconto'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Sucesso */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-1 font-medium">{partner?.business_name}</p>
              <p className="text-xs text-slate-400 mb-2">{categoryLabel}</p>
              {vouchers.length === 1 ? (
                <p className="text-4xl font-bold text-emerald-600 tracking-widest font-mono">{vouchers[0].code}</p>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {vouchers.map((v, i) => (
                    <span key={i} className="bg-white border border-emerald-300 rounded-lg px-3 py-1 text-sm font-bold text-emerald-700 tracking-wider">
                      {v.code}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-3">
                Válido por 7 dias • até {new Date(vouchers[0].expires_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Detalhes */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Produto</span>
                <span className="font-medium text-right max-w-[60%]">{vouchers[0].product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantidade</span>
                <span className="font-medium">{vouchers.length}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preço original</span>
                <span className="line-through text-slate-400">R$ {(vouchers[0].original_price * vouchers.length).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-slate-700 font-semibold">Total com desconto</span>
                <span className="font-bold text-emerald-600 text-base">
                  R$ {(vouchers[0].discount_price * vouchers.length).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Instrução */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 text-center">
                Apresente os códigos ao empreendedor e informe seu CPF para usar o desconto
              </p>
              {partner?.phone && (
                <p className="text-xs text-amber-600 text-center mt-1 flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3" /> Contato: {partner.phone}
                </p>
              )}
            </div>

            <Button onClick={handleClose} className="w-full" variant="outline">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}