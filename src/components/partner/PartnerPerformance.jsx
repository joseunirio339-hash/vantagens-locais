import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, PieChart, Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Star, Eye, TrendingUp, Award, Target, Zap, DollarSign } from 'lucide-react';
import ExportPerformanceButton from './ExportPerformanceButton';
import { subDays, subMonths, format, parseISO, isAfter, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

const VOUCHER_COLORS = ['#7c3aed', '#a855f7', '#c084fc', '#ddd6fe', '#ede9fe', '#8b5cf6', '#6d28d9', '#4c1d95'];

export default function PartnerPerformance({ partner, products, vouchers, views }) {
  const [periodDays, setPeriodDays] = useState(30);

  const { data: reviews = [] } = useQuery({
    queryKey: ['partnerReviews', partner?.id],
    queryFn: () => base44.entities.Review.filter({ partner_id: partner.id }),
    enabled: !!partner?.id,
    refetchInterval: 30000,
  });

  const cutoff = useMemo(() => subDays(new Date(), periodDays), [periodDays]);

  const usedInPeriod = useMemo(() =>
    vouchers.filter(v => v.status === 'used' && v.used_at && isAfter(parseISO(v.used_at), cutoff)),
    [vouchers, cutoff]
  );

  const generatedInPeriod = useMemo(() =>
    vouchers.filter(v => v.created_date && isAfter(parseISO(v.created_date), cutoff)),
    [vouchers, cutoff]
  );

  const reviewsInPeriod = useMemo(() =>
    reviews.filter(r => r.created_date && isAfter(parseISO(r.created_date), cutoff)),
    [reviews, cutoff]
  );

  const viewsInPeriod = useMemo(() =>
    views.filter(v => v.created_date && isAfter(parseISO(v.created_date), cutoff)),
    [views, cutoff]
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const avgRatingPeriod = useMemo(() => {
    if (reviewsInPeriod.length === 0) return null;
    return reviewsInPeriod.reduce((sum, r) => sum + r.rating, 0) / reviewsInPeriod.length;
  }, [reviewsInPeriod]);

  const avgRatingAll = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const conversionRate = viewsInPeriod.length > 0
    ? ((generatedInPeriod.length / viewsInPeriod.length) * 100).toFixed(1)
    : '0.0';

  const totalRevenue = usedInPeriod.reduce((sum, v) => sum + (v.discount_price || 0), 0);

  // ── CHART 1: Vouchers usados por dia ────────────────────────────────────
  const vouchersByDay = useMemo(() => {
    const step = periodDays <= 7 ? 1 : periodDays <= 30 ? 1 : 3;
    const days = [];
    for (let i = periodDays - 1; i >= 0; i -= step) {
      const day = subDays(new Date(), i);
      const label = format(day, periodDays <= 7 ? 'EEE' : 'dd/MM', { locale: ptBR });
      const dayStr = format(day, 'yyyy-MM-dd');
      const used = usedInPeriod.filter(v => v.used_at?.startsWith(dayStr)).length;
      const generated = generatedInPeriod.filter(v => v.created_date?.startsWith(dayStr)).length;
      days.push({ label, used, generated });
    }
    return days;
  }, [usedInPeriod, generatedInPeriod, periodDays]);

  // ── CHART 2: Média de avaliações por mês (últimos 6 meses) ───────────────
  const ratingsByMonth = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });
    return months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthReviews = reviews.filter(r => {
        if (!r.created_date) return false;
        const d = parseISO(r.created_date);
        return d >= start && d <= end;
      });
      return {
        label: format(month, 'MMM/yy', { locale: ptBR }),
        avg: monthReviews.length > 0
          ? parseFloat((monthReviews.reduce((s, r) => s + r.rating, 0) / monthReviews.length).toFixed(2))
          : null,
        count: monthReviews.length
      };
    });
  }, [reviews]);

  // ── CHART 3: Top produtos por conversão ──────────────────────────────────
  const topByConversion = useMemo(() => {
    return products
      .map(p => {
        const pViews = viewsInPeriod.filter(v => v.product_id === p.id).length;
        const pVouchers = generatedInPeriod.filter(v => v.product_id === p.id).length;
        const pUsed = usedInPeriod.filter(v => v.product_id === p.id).length;
        const conversion = pViews > 0 ? parseFloat(((pVouchers / pViews) * 100).toFixed(1)) : 0;
        const revenue = usedInPeriod
          .filter(v => v.product_id === p.id)
          .reduce((s, v) => s + (v.discount_price || 0), 0);
        return {
          name: p.name?.length > 20 ? p.name.substring(0, 20) + '…' : p.name,
          fullName: p.name,
          views: pViews,
          vouchers: pVouchers,
          used: pUsed,
          conversion,
          revenue
        };
      })
      .filter(p => p.views > 0 || p.vouchers > 0)
      .sort((a, b) => b.conversion - a.conversion)
      .slice(0, 8);
  }, [products, viewsInPeriod, generatedInPeriod, usedInPeriod]);

  // ── CHART 4: Distribuição de vouchers por produto (pie) ──────────────────
  const vouchersByProduct = useMemo(() => {
    return products
      .map(p => ({
        name: p.name?.length > 16 ? p.name.substring(0, 16) + '…' : p.name,
        value: usedInPeriod.filter(v => v.product_id === p.id).length
      }))
      .filter(p => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products, usedInPeriod]);

  const CustomTooltipConversion = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-800 mb-1">{d?.fullName}</p>
        <p className="text-blue-600">👁 Visualizações: {d?.views}</p>
        <p className="text-violet-600">🎟 Vouchers: {d?.vouchers}</p>
        <p className="text-emerald-600">✅ Usados: {d?.used}</p>
        <p className="text-amber-600 font-semibold">📈 Conversão: {d?.conversion}%</p>
        <p className="text-green-700">💰 Receita: R$ {d?.revenue?.toFixed(2).replace('.', ',')}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          Dashboard de Performance
        </h2>
        <div className="flex items-center gap-3">
          <ExportPerformanceButton
            partner={partner}
            products={products}
            vouchers={vouchers}
            views={views}
            reviews={reviews}
            periodDays={periodDays}
          />
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-violet-200 rounded-xl flex items-center justify-center mb-3">
              <Ticket className="w-5 h-5 text-violet-700" />
            </div>
            <p className="text-2xl font-bold text-violet-800">{usedInPeriod.length}</p>
            <p className="text-sm text-violet-600 font-medium">Vouchers Resgatados</p>
            <p className="text-xs text-violet-400 mt-0.5">de {generatedInPeriod.length} gerados</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-2xl font-bold text-amber-800">
              {(avgRatingPeriod ?? avgRatingAll)?.toFixed(1) ?? '—'}
            </p>
            <p className="text-sm text-amber-600 font-medium">Média de Avaliações</p>
            <p className="text-xs text-amber-400 mt-0.5">{reviewsInPeriod.length} no período</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-emerald-200 rounded-xl flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-2xl font-bold text-emerald-800">{conversionRate}%</p>
            <p className="text-sm text-emerald-600 font-medium">Taxa de Conversão</p>
            <p className="text-xs text-emerald-400 mt-0.5">{viewsInPeriod.length} visualizações</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-green-700" />
            </div>
            <p className="text-2xl font-bold text-green-800">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-green-600 font-medium">Receita no Período</p>
            <p className="text-xs text-green-400 mt-0.5">valor dos vouchers usados</p>
          </CardContent>
        </Card>
      </div>

      {/* CHART 1: Vouchers por dia */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="w-4 h-4 text-violet-600" />
            Uso de Vouchers por Período
          </CardTitle>
          <p className="text-xs text-slate-400">Vouchers gerados vs resgatados</p>
        </CardHeader>
        <CardContent>
          {generatedInPeriod.length > 0 || usedInPeriod.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={vouchersByDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradGenerated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v, name) => [v, name === 'generated' ? 'Gerados' : 'Resgatados']}
                />
                <Legend
                  formatter={(value) => value === 'generated' ? 'Gerados' : 'Resgatados'}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Area type="monotone" dataKey="generated" stroke="#a855f7" strokeWidth={1.5} fill="url(#gradGenerated)" name="generated" />
                <Area type="monotone" dataKey="used" stroke="#7c3aed" strokeWidth={2} fill="url(#gradUsed)" name="used" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={Ticket} label="Nenhum voucher nesse período" />
          )}
        </CardContent>
      </Card>

      {/* CHART 2: Média de avaliações mensais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="w-4 h-4 text-amber-500" />
            Média de Avaliações Mensais
          </CardTitle>
          <p className="text-xs text-slate-400">Evolução da nota média nos últimos 6 meses</p>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ratingsByMonth} margin={{ top: 4, right: 24, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v, name) => [
                    v !== null ? `${v} ★` : 'Sem dados',
                    name === 'avg' ? 'Média' : 'Avaliações'
                  ]}
                />
                <Legend
                  formatter={(value) => value === 'avg' ? 'Nota Média' : 'Qtd. Avaliações'}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                {/* Reference line at 4 stars */}
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  connectNulls
                  name="avg"
                />
                <Bar dataKey="count" fill="#fde68a" name="count" radius={[4, 4, 0, 0]} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={Star} label="Nenhuma avaliação registrada ainda" />
          )}
        </CardContent>
      </Card>

      {/* CHART 3: Ranking de conversão por cupom */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-emerald-600" />
            Cupons com Maior Conversão
          </CardTitle>
          <p className="text-xs text-slate-400">% de visualizações convertidas em vouchers</p>
        </CardHeader>
        <CardContent>
          {topByConversion.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={topByConversion.length > 4 ? 280 : 200}>
                <BarChart
                  data={topByConversion}
                  layout="vertical"
                  margin={{ left: 8, right: 32, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltipConversion />} />
                  <Bar dataKey="conversion" radius={[0, 6, 6, 0]} name="Conversão">
                    {topByConversion.map((_, idx) => (
                      <Cell key={idx} fill={VOUCHER_COLORS[idx % VOUCHER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Table summary */}
              <div className="mt-4 border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Produto</th>
                      <th className="text-center px-3 py-2 font-medium">Vis.</th>
                      <th className="text-center px-3 py-2 font-medium">Vouchers</th>
                      <th className="text-center px-3 py-2 font-medium">Usados</th>
                      <th className="text-center px-3 py-2 font-medium">Conv.</th>
                      <th className="text-right px-3 py-2 font-medium">Receita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topByConversion.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VOUCHER_COLORS[i % VOUCHER_COLORS.length] }} />
                            {p.name}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-500">{p.views}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{p.vouchers}</td>
                        <td className="px-3 py-2 text-center text-emerald-600 font-medium">{p.used}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-semibold ${p.conversion >= 50 ? 'text-emerald-600' : p.conversion >= 20 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {p.conversion}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-green-700 font-medium">
                          R$ {p.revenue.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyChart icon={Target} label="Sem dados de conversão nesse período" />
          )}
        </CardContent>
      </Card>

      {/* CHART 4: Pie - Distribuição de resgates por produto */}
      {vouchersByProduct.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-violet-500" />
              Distribuição de Resgates por Produto
            </CardTitle>
            <p className="text-xs text-slate-400">Proporção de vouchers usados por produto</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={vouchersByProduct}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {vouchersByProduct.map((_, idx) => (
                      <Cell key={idx} fill={VOUCHER_COLORS[idx % VOUCHER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v) => [v, 'Resgates']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 w-full sm:w-auto min-w-[180px]">
                {vouchersByProduct.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: VOUCHER_COLORS[i % VOUCHER_COLORS.length] }} />
                    <span className="text-slate-600 flex-1 truncate">{p.name}</span>
                    <span className="font-semibold text-slate-800">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição de estrelas */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="w-4 h-4 text-amber-500" />
              Distribuição de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => Math.round(r.rating) === star).length;
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right font-medium text-slate-600">{star}★</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-xs text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyChart({ icon: Icon, label }) {
  return (
    <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 gap-2">
      <Icon className="w-8 h-8 text-slate-200" />
      <p className="text-sm">{label}</p>
    </div>
  );
}