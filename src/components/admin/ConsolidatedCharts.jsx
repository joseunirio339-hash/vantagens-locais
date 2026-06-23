import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign, BarChart3, PieChart as PieIcon } from 'lucide-react';

const PARTNER_COLORS = [
  '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#e11d48', '#a855f7', '#22c55e', '#eab308'
];

export default function ConsolidatedCharts({ vouchers, partners, reps, repCommissions }) {
  const partnerSales = useMemo(() => {
    const map = {};
    vouchers.forEach(v => {
      const partner = partners.find(p => p.id === v.partner_id);
      const name = partner?.business_name || v.partner_id?.slice(0, 8) || 'Desconhecido';
      if (!map[name]) map[name] = { name, total: 0, used: 0, revenue: 0 };
      map[name].total++;
      if (v.status === 'used') map[name].used++;
      map[name].revenue += (v.discount_price || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 12);
  }, [vouchers, partners]);

  const partnerRevenue = useMemo(() => {
    return [...partnerSales].sort((a, b) => b.revenue - a.revenue).slice(0, 12);
  }, [partnerSales]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyComms = repCommissions.filter(c => c.created_date >= monthStart);

  const repPerformance = useMemo(() => {
    return reps
      .map(r => {
        const comms = repCommissions.filter(c => c.representative_id === r.id);
        const paid = comms.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0);
        const pending = comms.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission_amount, 0);
        return {
          name: r.name?.split(' ')[0] || '—',
          fullName: r.name,
          total: paid + pending,
          paid,
          pending,
          sales: r.total_sales || 0
        };
      })
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [reps, repCommissions]);

  const commsStatus = useMemo(() => {
    const paidTotal = repCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0);
    const pendingTotal = repCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission_amount, 0);
    const cancelledTotal = repCommissions.filter(c => c.status === 'cancelled').reduce((s, c) => s + c.commission_amount, 0);
    return [
      { name: 'Pagas', value: paidTotal, color: '#10b981' },
      { name: 'Pendentes', value: pendingTotal, color: '#f59e0b' },
      ...(cancelledTotal > 0 ? [{ name: 'Canceladas', value: cancelledTotal, color: '#ef4444' }] : [])
    ].filter(d => d.value > 0);
  }, [repCommissions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-stone-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-stone-700 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-stone-600">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="font-semibold">
              {entry.name.includes('R$') || entry.name.includes('Receita') || entry.name.includes('Comissão')
                ? `R$ ${Number(entry.value).toFixed(2).replace('.', ',')}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const formatYAxis = (value) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Partner Sales Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Vouchers por Parceiro (Top 12)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partnerSales.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">Nenhum dado de venda disponível</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={partnerSales} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} angle={-35} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="used" name="Usados" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Partner Revenue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Receita por Parceiro (Top 12)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partnerRevenue.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">Nenhum dado de receita disponível</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={partnerRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} angle={-35} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} tickFormatter={v => `R$${formatYAxis(v)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Receita" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {partnerRevenue.map((_, i) => (
                    <Cell key={i} fill={PARTNER_COLORS[i % PARTNER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Representative Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-violet-500" />
              Comissões por Representante
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repPerformance.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">Nenhuma comissão registrada</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={repPerformance} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716c' }} tickFormatter={v => `R$${formatYAxis(v)}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="paid" name="Pagas" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Pendentes" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Commission Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="w-5 h-5 text-rose-500" />
              Status das Comissões
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {commsStatus.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">Nenhuma comissão registrada</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie
                      data={commsStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {commsStatus.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-6 mt-2">
                  {commsStatus.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                      <span className="text-stone-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rep Sales Count */}
      {repPerformance.some(r => r.sales > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Total de Vendas por Representante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={repPerformance.filter(r => r.sales > 0)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" name="Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}