import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, ChevronRight, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function MonthlyPurchaseRanking() {
  const { data: rankingData, isLoading } = useQuery({
    queryKey: ['monthlyPurchaseRanking'],
    queryFn: async () => {
      const res = await base44.functions.invoke('monthlyPurchaseRanking', {});
      return res.data;
    }
  });

  const ranking = rankingData?.ranking || [];
  const monthLabel = rankingData?.month
    ? new Date(rankingData.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '';

  if (!isLoading && ranking.length === 0) return null;

  const medalEmoji = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <Card className="border-emerald-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-700 text-base">
            <Trophy className="w-5 h-5 text-emerald-500" />
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Compras do Mês{monthLabel ? ` — ${monthLabel}` : ''}
          </CardTitle>
          <Link to={createPageUrl('Leaderboard')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Ranking completo <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        {isLoading ? (
          <div className="px-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          ranking.map((u, i) => {
            const rank = i + 1;
            const medal = medalEmoji(rank);
            const maskedEmail = u.user_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || '---';
            const initial = u.user_email?.charAt(0).toUpperCase() || '?';

            return (
              <div key={u.user_email} className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? 'bg-emerald-50/40' : ''} border-b last:border-b-0`}>
                <div className="w-6 text-center flex-shrink-0">
                  {medal ? (
                    <span className="text-base">{medal}</span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">{rank}º</span>
                  )}
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 font-medium truncate">{maskedEmail}</p>
                  {u.last_product && (
                    <p className="text-xs text-slate-400 truncate">{u.last_product}</p>
                  )}
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-emerald-600 font-bold text-sm">
                    {u.vouchers_used} compra{u.vouchers_used !== 1 ? 's' : ''}
                  </span>
                  {u.total_saved > 0 && (
                    <span className="text-xs text-slate-400">
                      R$ {u.total_saved.toFixed(2).replace('.', ',')} salvo
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}