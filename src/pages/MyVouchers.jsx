import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { Ticket, CheckCircle, Clock, XCircle, Store, Calendar, Star, Trophy, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewModal from '@/components/voucher/ReviewModal';
import AchievementsTab from '@/components/gamification/AchievementsTab';
import MyReviewsList from '@/components/reviews/MyReviewsList';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  used: { label: 'Utilizado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  expired: { label: 'Expirado', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle }
};

export default function MyVouchers() {
  const [user, setUser] = useState(null);
  const [reviewingVoucher, setReviewingVoucher] = useState(null);
  const [reviewedVoucherIds, setReviewedVoucherIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth || cancelled) {
          if (!isAuth) base44.auth.redirectToLogin(createPageUrl('MyVouchers'));
          return;
        }
        const currentUser = await base44.auth.me();
        if (cancelled) return;
        setUser(currentUser);
      } catch (_) { /* rate limit / network error */ }
    };
    loadUser();
    return () => { cancelled = true; };
  }, []);

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['myVouchers', user?.email],
    queryFn: () => base44.entities.Voucher.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list()
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['myReviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const reviewedIds = new Set([...myReviews.map(r => r.voucher_id), ...reviewedVoucherIds]);

  const formatCPF = (cpf) => {
    const clean = cpf?.replace(/\D/g, '');
    if (!clean || clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getPartner = (partnerId) => partners.find(p => p.id === partnerId);

  const activeVouchers = vouchers.filter(v => v.status === 'pending');
  const usedVouchers = vouchers.filter(v => v.status === 'used');
  const expiredVouchers = vouchers.filter(v => v.status === 'expired');

  const VoucherCard = ({ voucher }) => {
    const status = statusConfig[voucher.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const partner = getPartner(voucher.partner_id);
    const alreadyReviewed = reviewedIds.has(voucher.id);

    return (
      <Card className={`border-2 ${voucher.status === 'pending' ? 'border-emerald-200' : 'border-slate-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Store className="w-3 h-3" />
                {partner?.business_name || 'Loja'}
              </p>
              <h3 className="font-semibold text-slate-800">{voucher.product_name}</h3>
            </div>
            <Badge className={`${status.color} border gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </div>

          <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center mb-3">
            <p className="text-xs text-slate-500 mb-1">Código do Voucher</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-wider font-mono">
              {voucher.code}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-slate-500">CPF</p>
              <p className="font-medium font-mono">{formatCPF(voucher.user_cpf)}</p>
            </div>
            <div>
              <p className="text-slate-500">Valor</p>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-emerald-600">
                  R$ {voucher.discount_price?.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  R$ {voucher.original_price?.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-3 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {voucher.status === 'used' && voucher.used_at ? (
              `Usado em ${format(new Date(voucher.used_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
            ) : voucher.expires_at ? (
              `Válido até ${format(new Date(voucher.expires_at), "dd/MM/yyyy", { locale: ptBR })}`
            ) : (
              `Criado em ${format(new Date(voucher.created_date), "dd/MM/yyyy", { locale: ptBR })}`
            )}
          </div>

          {voucher.status === 'used' && (
            <div className="mt-3 pt-3 border-t">
              {alreadyReviewed ? (
                <p className="text-xs text-slate-400 flex items-center gap-1 justify-center">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Você já avaliou este estabelecimento
                </p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-violet-600 border-violet-200 hover:bg-violet-50"
                  onClick={() => setReviewingVoucher(voucher)}
                >
                  <Star className="w-3 h-3 mr-2" />
                  Avaliar Experiência
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Meus Vouchers</h1>
              <p className="text-slate-500">
                {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''} no total
              </p>
            </div>
            {usedVouchers.length > 0 && (
              <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 shrink-0">
                <Trophy className="w-4 h-4 text-violet-600" />
                <div className="text-right">
                  <p className="text-xs text-violet-500 font-medium">Vouchers usados</p>
                  <p className="text-lg font-black text-violet-700 leading-none">{usedVouchers.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white border w-full justify-start">
            <TabsTrigger value="active" className="flex-1">
              Ativos ({activeVouchers.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="flex-1">
              Usados ({usedVouchers.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex-1">
              Expirados ({expiredVouchers.length})
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1 gap-1 text-xs">
              <Trophy className="w-3.5 h-3.5" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 gap-1 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              Avaliações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeVouchers.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum voucher ativo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeVouchers.map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="used">
            {usedVouchers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum voucher utilizado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {usedVouchers.map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired">
            {expiredVouchers.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum voucher expirado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiredVouchers.map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="achievements">
            <AchievementsTab vouchers={vouchers} userEmail={user?.email} />
          </TabsContent>
          <TabsContent value="reviews">
            <MyReviewsList userEmail={user?.email} />
          </TabsContent>
        </Tabs>
      </div>

      {reviewingVoucher && (
        <ReviewModal
          open={!!reviewingVoucher}
          onClose={() => setReviewingVoucher(null)}
          voucher={reviewingVoucher}
          partnerName={getPartner(reviewingVoucher.partner_id)?.business_name || 'Estabelecimento'}
          user={user}
          onReviewed={(voucherId) => setReviewedVoucherIds(prev => new Set([...prev, voucherId]))}
        />
      )}
    </div>
  );
}