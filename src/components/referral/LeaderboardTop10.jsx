import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, ChevronRight, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeaderboardTop10() {
  const { data: topUsers = [], isLoading } = useQuery({
    queryKey: ['leaderboard-top10'],
    queryFn: async () => {
      const all = await base44.entities.UserPoints.list('-total_points', 10);
      return all.filter(u => u.total_points > 0).slice(0, 10);
    }
  });

  if (!isLoading && topUsers.length === 0) return null;

  const medalEmoji = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <Card className="border-violet-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-700 text-base">
            <Trophy className="w-5 h-5 text-yellow-500" />
            🏆 Top Pontuadores
          </CardTitle>
          <Link to={createPageUrl('Leaderboard')} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
            Ver ranking <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        {isLoading ? (
          <div className="px-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : (
          topUsers.map((u, i) => {
            const rank = i + 1;
            const medal = medalEmoji(rank);
            const maskedEmail = u.user_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || '---';
            const initial = u.user_email?.charAt(0).toUpperCase() || '?';

            return (
              <div key={u.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < 3 ? 'bg-violet-50/40' : ''} border-b last:border-b-0`}>
                <div className="w-6 text-center flex-shrink-0">
                  {medal ? (
                    <span className="text-base">{medal}</span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">{rank}º</span>
                  )}
                </div>
                <div className="w-7 h-7 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{initial}</span>
                </div>
                <p className="flex-1 text-sm text-slate-600 truncate">{maskedEmail}</p>
                <div className="flex items-center gap-1 text-violet-600 font-bold text-sm flex-shrink-0">
                  <Star className="w-3 h-3" />
                  {u.total_points}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}