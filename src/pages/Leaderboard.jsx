import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Medal, Star, Users, ArrowLeft, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const MEDAL_CONFIG = [
  { bg: 'bg-yellow-400', text: 'text-yellow-900', shadow: 'shadow-yellow-200', icon: '🥇', label: '1º' },
  { bg: 'bg-slate-300', text: 'text-slate-700', shadow: 'shadow-slate-200', icon: '🥈', label: '2º' },
  { bg: 'bg-amber-500', text: 'text-amber-900', shadow: 'shadow-amber-200', icon: '🥉', label: '3º' },
];

function PodiumCard({ userPoint, rank }) {
  const m = MEDAL_CONFIG[rank - 1];
  const initial = userPoint.user_email?.charAt(0).toUpperCase() || '?';
  const maskedEmail = userPoint.user_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || '---';

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? 'order-first md:order-none scale-110' : ''}`}>
      <div className="relative mb-2">
        <div className={`w-16 h-16 ${m.bg} rounded-full flex items-center justify-center shadow-lg ${m.shadow} text-2xl font-black ${m.text}`}>
          {initial}
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl">{m.icon}</span>
      </div>
      <p className="font-bold text-slate-800 text-sm text-center">{maskedEmail}</p>
      <p className="text-xs text-slate-500 mb-1">{m.label} lugar</p>
      <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
        <Star className="w-3 h-3 mr-1" />
        {userPoint.total_points} pts
      </Badge>
    </div>
  );
}

export default function Leaderboard() {
  const { data: topUsers = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const all = await base44.entities.UserPoints.list('-total_points', 50);
      return all.filter(u => u.total_points > 0).slice(0, 20);
    }
  });

  const podium = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Ranking de Indicações</span>
          </div>
          <h1 className="text-4xl font-black mb-2">🏆 Leaderboard</h1>
          <p className="text-violet-100 text-lg">Os campeões de indicações do Clube Max Descontos</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to={createPageUrl('ReferralPage')}>
          <Button variant="ghost" className="mb-6 text-slate-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Indique e Ganhe
          </Button>
        </Link>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : topUsers.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">Nenhuma indicação ainda</p>
              <p className="text-slate-400 text-sm mt-1">Seja o primeiro a indicar amigos e liderar o ranking!</p>
              <Link to={createPageUrl('ReferralPage')}>
                <Button className="mt-4 bg-violet-600 hover:bg-violet-700 text-white">
                  Indicar agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium Top 3 */}
            {podium.length >= 1 && (
              <Card className="mb-8 border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="flex items-center justify-center gap-2 text-violet-700">
                    <Crown className="w-5 h-5" />
                    Top 3
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-center gap-6 md:gap-12 py-4">
                    {/* Order: 2nd, 1st, 3rd */}
                    {podium[1] && <PodiumCard userPoint={podium[1]} rank={2} />}
                    {podium[0] && <PodiumCard userPoint={podium[0]} rank={1} />}
                    {podium[2] && <PodiumCard userPoint={podium[2]} rank={3} />}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full Ranking List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Users className="w-5 h-5" />
                  Ranking Completo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Top 3 in list */}
                {podium.map((u, i) => (
                  <RankRow key={u.id} userPoint={u} rank={i + 1} highlight />
                ))}
                {/* Rest */}
                {rest.map((u, i) => (
                  <RankRow key={u.id} userPoint={u} rank={i + 4} />
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function RankRow({ userPoint, rank, highlight }) {
  const maskedEmail = userPoint.user_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || '---';
  const initial = userPoint.user_email?.charAt(0).toUpperCase() || '?';

  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <div className={`flex items-center gap-4 px-4 py-3 border-b last:border-b-0 ${highlight ? 'bg-violet-50/50' : 'hover:bg-slate-50'} transition-colors`}>
      <div className="w-8 text-center">
        {medalEmoji ? (
          <span className="text-xl">{medalEmoji}</span>
        ) : (
          <span className="text-sm font-bold text-slate-400">{rank}º</span>
        )}
      </div>
      <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">{initial}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-700 text-sm truncate">{maskedEmail}</p>
        <p className="text-xs text-slate-400">{userPoint.successful_referrals || 0} indicações convertidas</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-violet-600">{userPoint.total_points}</p>
        <p className="text-xs text-slate-400">pontos</p>
      </div>
    </div>
  );
}