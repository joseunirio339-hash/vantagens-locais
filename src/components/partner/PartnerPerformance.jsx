import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Star, Eye, TrendingUp, Award } from 'lucide-react';
import { subDays, format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

export default function PartnerPerformance({ partner, products, vouchers, views }) {
  const [periodDays, setPeriodDays] = useState(30);

  const { data: reviews = [] } = useQuery({
    queryKey: ['partnerReviews', partner?.id],
    queryFn: () => base44.entities.Review.filter({ partner_id: partner.id }),
    enabled: !!partner?.id,
    refetchInterval: 30000,
  });

  const cutoff = useMemo(() => subDays(new Date(), periodDays), [periodDays]);

  // Vouchers resgatados (usados) no período
  const usedInPeriod = useMemo(() =>
    vouchers.filter(v => v.status === 'used' && v.used_at && isAfter(parseISO(v.used_at), cutoff)),
    [vouchers, cutoff]
  );

  // Vouchers gerados no período
  const generatedInPeriod = useMemo(() =>
    vouchers.filter(v => v.created_date && isAfter(parseISO(v.created_date), cutoff)),
    [vouchers, cutoff]
  );

  // Avaliações no período
  const reviewsInPeriod = useMemo(() =>
    reviews.filter(r => r.created_date && isAfter(parseISO(r.created_date), cutoff)),
    [reviews, cutoff]
  );

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const avgRatingPeriod = useMemo(() => {
    if (reviewsInPeriod.length === 0) return null;
    return reviewsInPeriod.reduce((sum, r) => sum + r.rating, 0) / reviewsInPeriod.length;
  }, [reviewsInPeriod]);

  // Visualizações no período
  const viewsInPeriod = useMemo(() =>
    views.filter(v => v.created_date && isAfter(parseISO(v.created_date), cutoff)),
    [views, cutoff]
  );

  // Gráfico: vouchers usados por dia
  const vouchersByDay = useMemo(() => {
    const days = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const label = format(day, periodDays <= 7 ? 'EEE' : 'dd/MM', { locale: ptBR });
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = usedInPeriod.filter(v => v.used_at?.startsWith(dayStr)).length;
      days.push({ label, count });
    }
    return days;
  }, [usedInPeriod, periodDays]);

  // Top produtos por visualizações no período
  const topProductsByViews = useMemo(() => {
    return products
      .map(p => ({
        name: p.name?.length > 18 ? p.name.substring(0, 18) + '…' : p.name,
        fullName: p.name,
        views: viewsInPeriod.filter(v => v.product_id === p.id).length,
        vouchers: generatedInPeriod.filter(v => v.product_id === p.id).length,
      }))
      .filter(p => p.views > 0 || p.vouchers > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [products, viewsInPeriod, generatedInPeriod]);

  const conversionRate = viewsInPeriod.length > 0
    ? ((generatedInPeriod.length / viewsInPeriod.length) * 100).toFixed(1)
    : '0.0';

  const stars = (rating) => {
    if (!rating) return '—';
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          Performance em Tempo Real
        </h2>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriodDays(p.days)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                periodDays === p.days
                  ? 'bg-white text-violet-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-violet-200 rounded-xl flex items-center justify-center mb-3">
              <Ticket className="w-5 h-5 text-violet-700" />
            </div>
            <p className="text-2xl font-bold text-violet-800">{usedInPeriod.length}</p>
            <p className="text-sm text-violet-600 font-medium">Vouchers Resgatados</p>
            <p className="text-xs text-violet-400 mt-0.5">nos últimos {periodDays} dias</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-2xl font-bold text-amber-800">
              {avgRatingPeriod ? avgRatingPeriod.toFixed(1) : avgRating ? avgRating.toFixed(1) : '—'}
            </p>
            <p className="text-sm text-amber-600 font-medium">Média de Avaliações</p>
            <p className="text-xs text-amber-400 mt-0.5">
              {reviewsInPeriod.length > 0
                ? `${reviewsInPeriod.length} avaliações no período`
                : reviews.length > 0
                ? `${reviews.length} avaliações no total`
                : 'nenhuma avaliação ainda'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center mb-3">
              <Eye className="w-5 h-5 text-blue-700" />
            </div>
            <p className="text-2xl font-bold text-blue-800">{viewsInPeriod.length}</p>
            <p className="text-sm text-blue-600 font-medium">Visualizações</p>
            <p className="text-xs text-blue-400 mt-0.5">nos últimos {periodDays} dias</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-emerald-200 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-2xl font-bold text-emerald-800">{conversionRate}%</p>
            <p className="text-sm text-emerald-600 font-medium">Taxa de Conversão</p>
            <p className="text-xs text-emerald-400 mt-0.5">visualizações → vouchers</p>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers resgatados por dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="w-4 h-4 text-violet-600" />
            Vouchers Resgatados por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usedInPeriod.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={vouchersByDay}>
                <defs>
                  <linearGradient id="voucherGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Resgatados']} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#voucherGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 gap-2">
              <Ticket className="w-8 h-8 text-slate-200" />
              <p className="text-sm">Nenhum voucher resgatado nesse período</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top produtos por visualizações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4 text-blue-600" />
            Produtos com Mais Visualizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProductsByViews.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProductsByViews} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullName}
                  formatter={(v, name) => [v, name === 'views' ? 'Visualizações' : 'Vouchers']}
                />
                <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} name="views" />
                <Bar dataKey="vouchers" fill="#10b981" radius={[0, 4, 4, 0]} name="vouchers" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 gap-2">
              <Eye className="w-8 h-8 text-slate-200" />
              <p className="text-sm">Nenhuma visualização registrada nesse período</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avaliações recentes */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-amber-500" />
              Avaliações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Distribuição de estrelas */}
            <div className="space-y-2 mb-4">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => Math.round(r.rating) === star).length;
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right font-medium text-slate-600">{star}★</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Últimas avaliações */}
            <div className="space-y-3 mt-4">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-start gap-3 py-3 border-t first:border-t-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-violet-600">
                      {r.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 truncate">{r.user_name || 'Usuário'}</span>
                      <span className="text-amber-400 text-xs">{stars(r.rating)}</span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{r.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}