import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Flame, Eye, Ticket } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PartnerStatsPanel({ vouchers = [], products = [], views = [] }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Vouchers usados este mês por dia
  const dailyVoucherData = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: now });
    return days.map(day => {
      const used = vouchers.filter(v =>
        v.status === 'used' &&
        v.updated_date &&
        isSameDay(new Date(v.updated_date), day)
      ).length;
      const generated = vouchers.filter(v =>
        v.created_date &&
        isSameDay(new Date(v.created_date), day)
      ).length;
      return {
        day: format(day, 'dd/MM'),
        Usados: used,
        Gerados: generated,
      };
    });
  }, [vouchers]);

  // Produtos com mais interesse no mês (views + vouchers gerados)
  const topProductsMonth = useMemo(() => {
    const viewsThisMonth = views.filter(v =>
      v.created_date && new Date(v.created_date) >= monthStart
    );
    const vouchersThisMonth = vouchers.filter(v =>
      v.created_date && new Date(v.created_date) >= monthStart
    );

    return products
      .map(p => {
        const viewCount = viewsThisMonth.filter(v => v.product_id === p.id).length;
        const voucherCount = vouchersThisMonth.filter(v => v.product_id === p.id).length;
        const score = viewCount + voucherCount * 3; // vouchers pesam mais
        return {
          name: p.name?.length > 18 ? p.name.substring(0, 18) + '…' : p.name,
          fullName: p.name,
          Visualizações: viewCount,
          Vouchers: voucherCount,
          score,
        };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [products, views, vouchers]);

  // Totais do mês
  const usedThisMonth = vouchers.filter(v =>
    v.status === 'used' && v.updated_date && new Date(v.updated_date) >= monthStart
  ).length;
  const generatedThisMonth = vouchers.filter(v =>
    v.created_date && new Date(v.created_date) >= monthStart
  ).length;
  const viewsThisMonth = views.filter(v =>
    v.created_date && new Date(v.created_date) >= monthStart
  ).length;
  const convRate = generatedThisMonth > 0
    ? Math.round((usedThisMonth / generatedThisMonth) * 100)
    : 0;

  const monthLabel = format(now, 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="space-y-4 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-violet-600" />
        <h2 className="text-base font-bold text-slate-700">
          Estatísticas de <span className="capitalize">{monthLabel}</span>
        </h2>
      </div>

      {/* KPIs mensais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Vouchers Gerados', value: generatedThisMonth, icon: Ticket, from: 'from-blue-500', to: 'to-blue-600' },
          { label: 'Vouchers Usados', value: usedThisMonth, icon: TrendingUp, from: 'from-emerald-500', to: 'to-emerald-600' },
          { label: 'Visualizações', value: viewsThisMonth, icon: Eye, from: 'from-violet-500', to: 'to-violet-600' },
          { label: 'Taxa de Uso', value: `${convRate}%`, icon: Flame, from: 'from-fuchsia-500', to: 'to-fuchsia-600' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="border-0 overflow-hidden">
              <CardContent className={`p-4 bg-gradient-to-br ${kpi.from} ${kpi.to} text-white`}>
                <Icon className="w-5 h-5 mb-2 opacity-80" />
                <p className="text-2xl font-black">{kpi.value}</p>
                <p className="text-xs text-white/80 mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Vouchers ao longo do mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-500" />
              Uso de Vouchers no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyVoucherData.some(d => d.Gerados > 0 || d.Usados > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyVoucherData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradGerados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradUsados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={Math.floor(dailyVoucherData.length / 6)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="Gerados" stroke="#3b82f6" fill="url(#gradGerados)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Usados" stroke="#10b981" fill="url(#gradUsados)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-300 text-sm">
                Nenhum voucher ainda este mês
              </div>
            )}
            <div className="flex gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-1.5 rounded-full bg-blue-500" /> Gerados
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-1.5 rounded-full bg-emerald-500" /> Usados
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos mais populares do mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Flame className="w-4 h-4 text-fuchsia-500" />
              Produtos em Alta no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProductsMonth} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v, name) => [v, name]}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="Visualizações" fill="#8b5cf6" radius={[0, 4, 4, 0]} stackId="a" />
                  <Bar dataKey="Vouchers" fill="#f43f5e" radius={[0, 4, 4, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-300 text-sm">
                Nenhuma interação este mês ainda
              </div>
            )}
            <div className="flex gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-sm bg-violet-500" /> Visualizações
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-sm bg-rose-500" /> Vouchers
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}