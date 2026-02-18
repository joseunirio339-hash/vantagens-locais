import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
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