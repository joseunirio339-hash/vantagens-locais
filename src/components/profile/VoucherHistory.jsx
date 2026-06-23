import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Ticket, Store, MapPin, TrendingDown, Loader2, ShoppingBag,
  Receipt, ArrowDown, ArrowUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  used: { label: 'Usado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  expired: { label: 'Expirado', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function VoucherHistory({ user }) {
  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery({
    queryKey: ['userVouchers', user?.email],
    queryFn: () => base44.entities.Voucher.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: !!user?.email,
  });

  if (vouchersLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  // Sort by date (newest first)
  const sortedVouchers = [...vouchers].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  const totalSaved = sortedVouchers.reduce(
    (sum, v) => sum + ((v.original_price || 0) - (v.discount_price || 0)),
    0
  );

  const totalSpent = sortedVouchers.reduce(
    (sum, v) => sum + (v.discount_price || 0),
    0
  );

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-16">
        <Receipt className="w-14 h-14 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Nenhum voucher gerado ainda</p>
        <p className="text-slate-400 text-sm mt-1">
          Seus vouchers aparecerão aqui conforme você gerar cupons de desconto
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-violet-700">{vouchers.length}</p>
            <p className="text-xs text-violet-500 mt-0.5">Vouchers gerados</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-black text-emerald-700">
              R$ {totalSaved.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-emerald-500 mt-0.5">Total economizado</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-black text-amber-700">
              R$ {totalSpent.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-amber-500 mt-0.5">Total gasto</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings Highlight */}
      {totalSaved > 0 && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          <TrendingDown className="w-8 h-8 text-white/80 mx-auto mb-2" />
          <p className="text-white/80 text-sm mb-1">Você economizou no total</p>
          <p className="text-4xl font-black text-white">
            R$ {totalSaved.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-white/70 text-xs mt-1">
            com vouchers do Clube Max Descontos 🎉
          </p>
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            Histórico Completo de Vouchers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedVouchers.map((v, i) => {
            const partner = partners.find(p => p.id === v.partner_id);
            const saved = (v.original_price || 0) - (v.discount_price || 0);
            const sc = statusConfig[v.status] || statusConfig.pending;
            const createdDate = v.created_date
              ? format(new Date(v.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : '—';
            const isEven = i % 2 === 0;

            return (
              <div
                key={v.id}
                className={`flex items-center gap-4 px-4 py-4 border-b last:border-b-0 ${
                  isEven ? '' : 'bg-slate-50/50'
                }`}
              >
                {/* Index */}
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                  {i + 1}
                </div>

                {/* Partner logo / initial */}
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                  {partner?.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {v.product_name || 'Voucher'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-500 truncate">
                      {partner?.business_name || 'Parceiro'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{createdDate}</p>
                </div>

                {/* Prices */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="font-bold text-slate-800 text-sm">
                      R$ {(v.discount_price || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {saved > 0 && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-0.5 justify-end">
                      <ArrowDown className="w-3 h-3" />
                      R$ {saved.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                  <Badge className={`${sc.color} border text-xs mt-1`}>{sc.label}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}