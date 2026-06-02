import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, Wallet, Ticket, PiggyBank } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FinancialPanel({ vouchers = [] }) {
  const usedVouchers = vouchers.filter(v => v.status === 'used');

  const totalRevenue = usedVouchers.reduce((s, v) => s + (v.discount_price || 0), 0);
  const totalSales = usedVouchers.length;
  const uniqueBuyers = new Set(usedVouchers.map(v => v.user_cpf).filter(Boolean)).size;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Current month vs last month
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const currentMonthVouchers = usedVouchers.filter(v => {
    const d = new Date(v.used_at || v.updated_date);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });
  const lastMonthVouchers = usedVouchers.filter(v => {
    const d = new Date(v.used_at || v.updated_date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const currentMonthRevenue = currentMonthVouchers.reduce((s, v) => s + (v.discount_price || 0), 0);
  const lastMonthRevenue = lastMonthVouchers.reduce((s, v) => s + (v.discount_price || 0), 0);

  // Economia gerada para clientes no mês atual (diferença entre preço original e preço com desconto)
  const currentMonthSavings = currentMonthVouchers.reduce((s, v) => s + ((v.original_price || 0) - (v.discount_price || 0)), 0);
  const totalSavingsAllTime = usedVouchers.reduce((s, v) => s + ((v.original_price || 0) - (v.discount_price || 0)), 0);
  const growthPct = lastMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : currentMonthRevenue > 0 ? 100 : 0;

  // Last 6 months bar chart
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const ref = subMonths(now, 5 - i);
      const start = startOfMonth(ref);
      const end = endOfMonth(ref);
      const monthVouchers = usedVouchers.filter(v => {
        const d = new Date(v.used_at || v.updated_date);
        return d >= start && d <= end;
      });
      return {
        mes: format(ref, 'MMM', { locale: ptBR }),
        receita: parseFloat(monthVouchers.reduce((s, v) => s + (v.discount_price || 0), 0).toFixed(2)),
        vendas: monthVouchers.length,
      };
    });
  }, [usedVouchers]);

  const kpis = [
    {
      label: 'Receita Total',
      value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Vendas (mês atual)',
      value: currentMonthVouchers.length,
      sub: growthPct !== 0 ? `${growthPct > 0 ? '+' : ''}${growthPct}% vs mês anterior` : 'vs mês anterior',
      subColor: growthPct >= 0 ? 'text-emerald-500' : 'text-red-400',
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      label: 'Clientes Únicos',
      value: uniqueBuyers,
      icon: Users,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${avgTicket.toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <Card className="mb-6 border-0 shadow-md bg-white">
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <CardTitle className="text-base">Painel Financeiro</CardTitle>
          <p className="text-xs text-slate-400">Resumo de vendas geradas pelos vouchers</p>
        </div>
        {growthPct > 0 && (
          <div className="ml-auto flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            +{growthPct}% este mês
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className={`rounded-xl border p-3 ${kpi.color.split(' ').slice(1).join(' ')}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${kpi.color.split(' ').slice(1, 3).join(' ')}`}>
                  <Icon className={`w-4 h-4 ${kpi.color.split(' ')[0]}`} />
                </div>
                <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
                <p className="text-xs text-slate-500">{kpi.label}</p>
                {kpi.sub && <p className={`text-xs mt-0.5 font-medium ${kpi.subColor}`}>{kpi.sub}</p>}
              </div>
            );
          })}
        </div>

        {/* Resumo do Mês Atual */}
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-3">
            📅 Resumo — {format(now, 'MMMM yyyy', { locale: ptBR })}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-violet-100 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{currentMonthVouchers.length}</p>
                <p className="text-xs text-slate-500">Vouchers resgatados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <PiggyBank className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-700">R$ {currentMonthSavings.toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-slate-500">Economia para clientes</p>
              </div>
            </div>
          </div>
          {totalSavingsAllTime > 0 && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              Total acumulado: clientes economizaram <strong className="text-slate-600">R$ {totalSavingsAllTime.toFixed(2).replace('.', ',')}</strong> com suas promoções
            </p>
          )}
        </div>

        {/* Receita mensal */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Receita — últimos 6 meses</p>
          {totalSales > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  formatter={(value) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Receita']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="receita" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center bg-slate-50 rounded-xl">
              <div className="text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma venda registrada ainda</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}