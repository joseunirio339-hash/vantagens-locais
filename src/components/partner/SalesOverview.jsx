import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingBag, Users, CalendarDays } from 'lucide-react';
import { format, subDays, eachDayOfInterval, getDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SalesOverview({ vouchers, products }) {
  const usedVouchers = vouchers.filter(v => v.status === 'used');

  // Sales by day (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 29);
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

  const salesData = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayVouchers = usedVouchers.filter(v => {
      const usedDate = v.used_at ? v.used_at.substring(0, 10) : v.updated_date?.substring(0, 10);
      return usedDate === dayStr;
    });
    const revenue = dayVouchers.reduce((sum, v) => sum + (v.discount_price || 0), 0);
    return {
      day: format(day, 'dd/MM'),
      vendas: dayVouchers.length,
      receita: revenue
    };
  });

  // Sales comparison last 3 months
  const last3Months = [2, 1, 0].map(offset => {
    const ref = subMonths(today, offset);
    const start = startOfMonth(ref);
    const end = endOfMonth(ref);
    const label = format(ref, 'MMM/yy', { locale: ptBR });
    const monthVouchers = usedVouchers.filter(v => {
      const dateStr = v.used_at ? v.used_at.substring(0, 10) : v.updated_date?.substring(0, 10);
      if (!dateStr) return false;
      const d = new Date(dateStr + 'T12:00:00');
      return d >= start && d <= end;
    });
    return {
      name: label.charAt(0).toUpperCase() + label.slice(1),
      vendas: monthVouchers.length,
      receita: monthVouchers.reduce((s, v) => s + (v.discount_price || 0), 0)
    };
  });

  // Sales by day of week (all-time used vouchers)
  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DAY_COLORS = ['#a78bfa', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#10b981', '#a78bfa'];

  const salesByDow = DAY_NAMES.map((name, idx) => ({
    name,
    vendas: usedVouchers.filter(v => {
      const dateStr = v.used_at ? v.used_at.substring(0, 10) : v.updated_date?.substring(0, 10);
      if (!dateStr) return false;
      return getDay(new Date(dateStr + 'T12:00:00')) === idx;
    }).length
  }));

  const maxDow = Math.max(...salesByDow.map(d => d.vendas), 1);

  // Top products by sales
  const topProducts = products
    .map(p => ({
      name: p.name,
      sales: usedVouchers.filter(v => v.product_id === p.id).length,
      revenue: usedVouchers.filter(v => v.product_id === p.id).reduce((s, v) => s + (v.discount_price || 0), 0)
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const totalRevenue = usedVouchers.reduce((sum, v) => sum + (v.discount_price || 0), 0);
  const uniqueBuyers = new Set(usedVouchers.map(v => v.user_cpf)).size;
  const avgTicket = usedVouchers.length > 0 ? totalRevenue / usedVouchers.length : 0;

  const kpis = [
    { label: 'Receita Total', value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Vendas Realizadas', value: usedVouchers.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-100' },
    { label: 'Clientes Únicos', value: uniqueBuyers, icon: Users, color: 'text-violet-600 bg-violet-100' },
    { label: 'Ticket Médio', value: `R$ ${avgTicket.toFixed(2).replace('.', ',')}`, icon: TrendingUp, color: 'text-amber-600 bg-amber-100' }
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                <p className="text-sm text-slate-500">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Vendas nos Últimos 30 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usedVouchers.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'vendas' ? `${value} venda${value !== 1 ? 's' : ''}` : `R$ ${value.toFixed(2)}`,
                    name === 'vendas' ? 'Vendas' : 'Receita'
                  ]}
                />
                <Area type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma venda registrada ainda</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last 3 months comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Comparativo — Últimos 3 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usedVouchers.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last3Months} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value, name) => [
                      name === 'vendas' ? `${value} venda${value !== 1 ? 's' : ''}` : `R$ ${value.toFixed(2).replace('.', ',')}`,
                      name === 'vendas' ? 'Vendas' : 'Receita'
                    ]}
                  />
                  <Bar dataKey="vendas" radius={[6, 6, 0, 0]}>
                    {last3Months.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={index === 2 ? '#10b981' : index === 1 ? '#3b82f6' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-3">
                {last3Months.map((m, i) => {
                  const growth = i > 0 ? last3Months[i - 1].vendas > 0
                    ? (((m.vendas - last3Months[i - 1].vendas) / last3Months[i - 1].vendas) * 100).toFixed(0)
                    : null : null;
                  return (
                    <div key={i} className="text-center">
                      <p className="text-xs text-slate-500">{m.name}</p>
                      <p className="text-sm font-bold text-slate-800">{m.vendas} vendas</p>
                      {growth !== null && (
                        <p className={`text-xs font-medium ${Number(growth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {Number(growth) >= 0 ? '▲' : '▼'} {Math.abs(Number(growth))}%
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma venda registrada ainda</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by day of week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-violet-600" />
            Volume de Vendas por Dia da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usedVouchers.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByDow} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value) => [`${value} venda${value !== 1 ? 's' : ''}`, 'Volume']}
                />
                <Bar dataKey="vendas" radius={[6, 6, 0, 0]}>
                  {salesByDow.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.vendas === maxDow && entry.vendas > 0 ? '#7c3aed' : DAY_COLORS[index]}
                      opacity={entry.vendas === 0 ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma venda registrada ainda</p>
              </div>
            </div>
          )}
          {usedVouchers.length > 0 && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              O dia mais movimentado aparece em destaque roxo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${topProducts[0].sales > 0 ? (p.sales / topProducts[0].sales) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-800">{p.sales} vendas</p>
                    <p className="text-xs text-emerald-600">R$ {p.revenue.toFixed(2).replace('.', ',')}</p>
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