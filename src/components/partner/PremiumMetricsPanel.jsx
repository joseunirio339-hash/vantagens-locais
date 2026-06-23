import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MousePointerClick, TrendingUp, Target, Flame, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9', '#5b21b6'];

export default function PremiumMetricsPanel({ products = [], views = [], vouchers = [], isPremium }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthLabel = format(now, 'MMMM yyyy', { locale: ptBR });

  // Top products by clicks this month
  const topByClicks = useMemo(() => {
    const viewsThisMonth = views.filter(v =>
      v.created_date && new Date(v.created_date) >= monthStart
    );

    const productClicks = {};
    viewsThisMonth.forEach(v => {
      productClicks[v.product_id] = (productClicks[v.product_id] || 0) + 1;
    });

    return products
      .map(p => ({
        name: p.name?.length > 20 ? p.name.substring(0, 20) + '…' : p.name,
        fullName: p.name,
        clicks: productClicks[p.id] || 0,
        vouchers: vouchers.filter(v => v.product_id === p.id && v.created_date && new Date(v.created_date) >= monthStart).length,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 6);
  }, [products, views, vouchers]);

  // Click-through rate
  const totalClicks = views.filter(v => v.created_date && new Date(v.created_date) >= monthStart).length;
  const totalVouchers = vouchers.filter(v => v.created_date && new Date(v.created_date) >= monthStart).length;
  const ctr = totalClicks > 0 ? ((totalVouchers / totalClicks) * 100).toFixed(1) : '0';
  const activeProducts = products.filter(p => p.is_active).length;

  if (!isPremium) return null;

  return (
    <Card className="border-0 shadow-md bg-white mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <CardTitle className="text-white text-sm font-bold">Métricas Premium</CardTitle>
          <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase">
            Exclusivo
          </span>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        {/* KPIs row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <MousePointerClick className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-xl font-black text-violet-700">{totalClicks}</p>
            <p className="text-[10px] text-violet-500 font-medium uppercase tracking-wide">Cliques no mês</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <Target className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-black text-emerald-700">{totalVouchers}</p>
            <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">Vouchers gerados</p>
          </div>
          <div className="bg-fuchsia-50 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-fuchsia-500 mx-auto mb-1" />
            <p className="text-xl font-black text-fuchsia-700">{ctr}%</p>
            <p className="text-[10px] text-fuchsia-500 font-medium uppercase tracking-wide">Taxa de conversão</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-black text-amber-700">{activeProducts}</p>
            <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Produtos ativos</p>
          </div>
        </div>

        {/* Top products by clicks chart */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-slate-700">
              Produtos com Mais Cliques — <span className="capitalize text-violet-600">{monthLabel}</span>
            </span>
          </div>
          {topByClicks.some(p => p.clicks > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topByClicks} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v, name) => [v, name === 'clicks' ? 'Cliques' : 'Vouchers']}
                  labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                />
                <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                  {topByClicks.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-sm">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhum clique registrado este mês
              </div>
            </div>
          )}
        </div>

        {/* Click leaderboard */}
        {topByClicks.some(p => p.clicks > 0) && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              🏆 Ranking de Cliques
            </p>
            <div className="space-y-1.5">
              {topByClicks.filter(p => p.clicks > 0).map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-slate-200 text-slate-600' :
                    i === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{p.fullName}</span>
                  <span className="text-xs font-bold text-violet-600">{p.clicks} cliques</span>
                  {p.vouchers > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                      {p.vouchers} vouchers
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}