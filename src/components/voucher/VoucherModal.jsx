import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function VoucherModal({ 
  open, 
  onClose, 
  product, 
  partner,
  user,
  onSuccess 
}) {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState(null);

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

    const newVoucher = await base44.entities.Voucher.create({
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

    setVoucher(newVoucher);
    setLoading(false);
    toast.success('Voucher gerado com sucesso!');
    onSuccess?.(newVoucher);
  };

  const handleClose = () => {
    setCpf('');
    setVoucher(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-600" />
            {voucher ? 'Voucher Gerado!' : 'Gerar Voucher de Desconto'}
          </DialogTitle>
        </DialogHeader>

        {!voucher ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-1">{partner?.business_name}</p>
              <h3 className="font-semibold text-slate-800">{product?.name}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-emerald-600">
                  R$ {product?.discount_price?.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  R$ {product?.original_price?.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

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
              <p className="text-xs text-slate-500">
                O CPF será usado para identificar o voucher na loja
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Ticket className="w-4 h-4 mr-2" />
              )}
              Gerar Voucher
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-1">Código do Voucher</p>
              <p className="text-3xl font-bold text-emerald-600 tracking-wider">
                {voucher.code}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Válido até {new Date(voucher.expires_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Produto</span>
                <span className="font-medium">{voucher.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CPF</span>
                <span className="font-medium">{formatCPF(voucher.user_cpf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor com Desconto</span>
                <span className="font-bold text-emerald-600">
                  R$ {voucher.discount_price?.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <p className="text-xs text-center text-slate-500">
              Apresente este código na loja para usar o desconto
            </p>

            <Button onClick={handleClose} className="w-full" variant="outline">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}