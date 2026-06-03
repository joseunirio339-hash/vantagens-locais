import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Star, Users, Crown, Ticket, Gift, Flame, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Apenas as badges mais importantes para exibir no ranking (máx 3)
const HIGHLIGHT_BADGES = ['fifty_vouchers', 'twenty_five', 'ten_vouchers', 'top_referrer', 'five_referrals', 'first_referral', 'five_vouchers', 'first_voucher'];
const BADGE_ICONS = {
  first_voucher: '🎫', five_vouchers: '⚡', ten_vouchers: '🔥',
  twenty_five: '🏆', fifty_vouchers: '💎', three_partners: '🗺️',
  five_partners: '🌟', ten_partners: '🏙️', first_referral: '🤝',
  five_referrals: '🚀', top_referrer: '👑',
};

const TIER_CONFIG = [
  { min: 1000, label: 'Lenda', color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', icon: '👑' },
  { min: 500,  label: 'Expert', color: 'text-violet-600', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700', icon: '💎' },
  { min: 200,  label: 'Pro',    color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', badge: 'bg-fuchsia-100 text-fuchsia-700', icon: '🔥' },
  { min: 50,   label: 'Ativo',  color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', icon: '⭐' },
  { min: 0,    label: 'Novo',   color: 'text-slate-500',   bg: 'bg-slate-50',   badge: 'bg-slate-100 text-slate-500',   icon: '🌱' },
];

function getTier(points) {
  return TIER_CONFIG.find(t => points >= t.min) || TIER_CONFIG[TIER_CONFIG.length - 1];
}

function UserBadgePips({ badgeIds = [] }) {
  if (!badgeIds.length) return null;
  return (
    <div className="flex gap-0.5 items-center">
      {badgeIds.map(id => (
        <span key={id} className="text-sm" title={id.replace(/_/g, ' ')}>{BADGE_ICONS[id] || '🏅'}</span>
      ))}
    </div>
  );
}

function PodiumCard({ userPoint, rank, badges = [] }) {
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-14' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const podiumColors = {
    1: 'from-yellow-400 to-amber-500',
    2: 'from-slate-300 to-slate-400',
    3: 'from-amber-500 to-orange-500',
  };
  const ringColors = {
    1: 'ring-yellow-400',
    2: 'ring-slate-300',
    3: 'ring-amber-400',
  };

  const initial = userPoint.user_email?.charAt(0).toUpperCase() || '?';
  const maskedEmail = userPoint.user_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || '---';
  const tier = getTier(userPoint.total_points);

  return (
    <div className={`flex flex-col items-center gap-2 ${rank === 1 ? 'z-10' : ''}`}>
      {/* Avatar */}
      <div className="relative">
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${podiumColors[rank]} flex items-center justify-center ring-4 ${ringColors[rank]} ring-offset-2 shadow-xl`}>
          <span className="text-white text-xl font-black">{initial}</span>
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl">{medals[rank]}</span>
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-700 max-w-[80px] truncate">{maskedEmail}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.badge}`}>
          {tier.icon} {tier.label}
        </span>
        {badges.length > 0 && (
          <div className="flex justify-center mt-1">
            <UserBadgePips badgeIds={badges} />
          </div>
        )}
      </div>

      {/* Points */}
      <div className="font-black text-lg text-violet-700">{userPoint.total_points} <span className="text-xs font-medium text-slate-400">pts</span></div>

      {/* Podium block */}
      <div className={`w-20 md:w-24 ${heights[rank]} bg-gradient-to-t ${podiumColors[rank]} rounded-t-xl flex items-start justify-center pt-2`}>
        <span className="text-white font-black text-lg">{rank}º</span>
      </div>
    </div>
  );
}

function RankRow({ userPoint, rank, isCurrentUser, badges = [] }) {
  const maskedEmail = userPoint.user_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || '---';
  const initial = userPoint.user_email?.charAt(0).toUpperCase() || '?';
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  const tier = getTier(userPoint.total_points);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${
      isCurrentUser ? 'bg-violet-50 border-l-4 border-l-violet-500' :
      rank <= 3 ? 'bg-gradient-to-r from-yellow-50/40 to-transparent' :
      'hover:bg-slate-50'
    }`}>
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-slate-400">{rank}º</span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-white text-sm font-bold">{initial}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-700 text-sm truncate">{maskedEmail}</p>
          {isCurrentUser && <Badge className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0 h-4">Você</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-xs px-1.5 py-0 rounded-full ${tier.badge}`}>{tier.icon} {tier.label}</span>
          {badges.length > 0 && <UserBadgePips badgeIds={badges} />}
          {userPoint.voucher_points > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <Ticket className="w-3 h-3" /> {userPoint.voucher_points} por vouchers
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="text-right flex-shrink-0">
        <p className="font-black text-violet-600 text-base">{userPoint.total_points}</p>
        <p className="text-xs text-slate-400">pontos</p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) setCurrentUser(await base44.auth.me());
    });
  }, []);

  const { data: topUsers = [], isLoading } = useQuery({
    queryKey: ['leaderboard-full'],
    queryFn: async () => {
      const all = await base44.entities.UserPoints.list('-total_points', 50);
      return all.filter(u => u.total_points > 0).slice(0, 30);
    }
  });

  // Busca todas as badges dos usuários do ranking
  const { data: allBadges = [] } = useQuery({
    queryKey: ['leaderboard-badges', topUsers.map(u => u.user_email).join(',')],
    queryFn: () => base44.entities.Badge.list('-created_date', 200),
    enabled: topUsers.length > 0,
  });

  // Mapeia email -> badges ganhas (top 3 mais raras)
  const badgesByUser = useMemo(() => {
    const map = {};
    allBadges.forEach(b => {
      if (!map[b.user_email]) map[b.user_email] = [];
      map[b.user_email].push(b.badge_id);
    });
    // Ordena pela raridade (HIGHLIGHT_BADGES está do mais raro ao mais comum)
    Object.keys(map).forEach(email => {
      map[email] = map[email]
        .sort((a, b) => HIGHLIGHT_BADGES.indexOf(a) - HIGHLIGHT_BADGES.indexOf(b))
        .slice(0, 3);
    });
    return map;
  }, [allBadges]);

  // Find current user's position
  const { data: myPoints } = useQuery({
    queryKey: ['myPoints', currentUser?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: currentUser.email }),
    enabled: !!currentUser,
    select: data => data[0]
  });

  const myRank = myPoints ? topUsers.findIndex(u => u.user_email === currentUser?.email) + 1 : null;
  const podium = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);

  const stats = {
    total: topUsers.length,
    topPoints: topUsers[0]?.total_points || 0,
    avgPoints: topUsers.length ? Math.round(topUsers.reduce((s, u) => s + u.total_points, 0) / topUsers.length) : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-slate-50 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 text-white py-14">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: `${40 + i * 30}px`, height: `${40 + i * 30}px`, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.3 }} />
          ))}
        </div>
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4 text-sm font-medium">
            <Flame className="w-4 h-4 text-yellow-300" />
            Competição de Pontos Linka
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 drop-shadow">🏆 Ranking de Pontos</h1>
          <p className="text-white/85 text-base md:text-lg mb-6">
            Use mais vouchers, acumule pontos e suba no ranking!
          </p>

          {/* Stats bar */}
          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { label: 'Participantes', value: stats.total, icon: Users },
              { label: 'Maior pontuação', value: `${stats.topPoints} pts`, icon: Crown },
              { label: 'Média do ranking', value: `${stats.avgPoints} pts`, icon: Target },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 border border-white/20">
                  <Icon className="w-4 h-4 text-yellow-300" />
                  <div className="text-left">
                    <p className="font-black text-white leading-none">{s.value}</p>
                    <p className="text-white/70 text-xs">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* My position card */}
          {myPoints && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/20 border border-white/30 rounded-2xl px-5 py-3">
              <Star className="w-5 h-5 text-yellow-300" />
              <div className="text-left">
                <p className="text-xs text-white/70">Sua posição</p>
                <p className="font-black text-lg leading-none">
                  {myRank > 0 ? `${myRank}º lugar` : 'Fora do top 30'} — {myPoints.total_points} pts
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

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
              <p className="text-slate-500 text-lg font-medium">Nenhum ponto acumulado ainda</p>
              <p className="text-slate-400 text-sm mt-1">Use vouchers de parceiros para acumular pontos e aparecer no ranking!</p>
              <Link to={createPageUrl('Partners')}>
                <button className="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors">
                  Ver parceiros
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tier Legend */}
            <div className="flex flex-wrap gap-2 justify-center">
              {TIER_CONFIG.map(t => (
                <span key={t.label} className={`text-xs px-3 py-1 rounded-full font-medium ${t.badge}`}>
                  {t.icon} {t.label} {t.min > 0 ? `(${t.min}+ pts)` : ''}
                </span>
              ))}
            </div>

            {/* Podium */}
            {podium.length >= 1 && (
              <Card className="border-violet-100 overflow-hidden">
                <CardHeader className="text-center pb-0 bg-gradient-to-b from-violet-50 to-white">
                  <CardTitle className="flex items-center justify-center gap-2 text-violet-700">
                    <Crown className="w-5 h-5" />
                    Pódio
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-6">
                  <div className="flex items-end justify-center gap-3 md:gap-8">
                    {podium[1] && <PodiumCard userPoint={podium[1]} rank={2} badges={badgesByUser[podium[1].user_email] || []} />}
                    {podium[0] && <PodiumCard userPoint={podium[0]} rank={1} badges={badgesByUser[podium[0].user_email] || []} />}
                    {podium[2] && <PodiumCard userPoint={podium[2]} rank={3} badges={badgesByUser[podium[2].user_email] || []} />}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full list */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-700 text-base">
                  <Users className="w-5 h-5" />
                  Ranking Completo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {topUsers.map((u, i) => (
                  <RankRow
                    key={u.id}
                    userPoint={u}
                    rank={i + 1}
                    isCurrentUser={currentUser && u.user_email === currentUser.email}
                    badges={badgesByUser[u.user_email] || []}
                  />
                ))}
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-6 text-white text-center">
              <Gift className="w-10 h-10 mx-auto mb-2 text-yellow-300" />
              <h3 className="font-black text-xl mb-1">Quer subir no ranking?</h3>
              <p className="text-white/80 text-sm mb-4">
                Use vouchers de nossos parceiros e acumule pontos. Quanto mais você usa, mais sobe!
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to={createPageUrl('Partners')}>
                  <button className="bg-white text-violet-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-violet-50 transition-colors">
                    Ver Parceiros
                  </button>
                </Link>
                <Link to={createPageUrl('ReferralPage')}>
                  <button className="border border-white/50 text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-white/15 transition-colors">
                    Indique e Ganhe
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}