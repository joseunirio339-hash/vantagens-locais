import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DailySalesSummary({ vouchers = [] }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const usedToday = useMemo(() => {
    return vouchers.filter(v => {
      if (v.status !== 'used') return false;
      const d = v.used_at ? new Date(v.used_at) : null;
      if (!d) return false;
      return d.toISOString().split('T')[0] === todayStr;
    });
  }, [vouchers, todayStr]);

  const generatedToday = useMemo(() => {
    return vouchers.filter(v => {
      const d = v.created_date ? new Date(v.created_date) : null;
      if (!d) return false;
      return d.toISOString().split('T')[0] === todayStr;
    });
  }, [vouchers, todayStr]);

  const revenueToday = usedToday.reduce((s, v) => s + (v.discount_price || 0), 0);
  const savingsToday = usedToday.reduce((s, v) => s + ((v.original_price || 0) - (v.discount_price || 0)), 0);

  const stats = [
    {
      label: 'Vouchers Resgatados Hoje',
      value: usedToday.length,
      icon: Ticket,
      color: 'bg-violet-100 text-violet-600',
      border: 'border-violet-200'
    },
    {
      label: 'Receita do Dia',
      value: `R$ ${revenueToday.toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
      border: 'border-emerald-200'
    },
    {
      label: 'Vouchers Gerados Hoje',
      value: generatedToday.length,
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200'
    },
    {
      label: 'Economia p/ Clientes',
      value: `R$ ${savingsToday.toFixed(2).replace('.', ',')}`,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
      border: 'border-amber-200'
    },
  ];

  return (
    <Card className="mb-6 border-0 shadow-md bg-gradient-to-r from-violet-50 to-fuchsia-50">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-200 flex items-center justify-center">
            <Clock className="w-4 h-4 text-violet-700" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              📅 Movimento de Hoje — {format(today, "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-xs text-slate-500">Resumo das vendas e vouchers do dia</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`bg-white rounded-xl border ${stat.border} p-3 shadow-sm`}>
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}