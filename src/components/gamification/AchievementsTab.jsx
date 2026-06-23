import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award, Lock, Star, Zap, ShoppingBag, Map, Users, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import UserProgressCard, { getLevel, LEVELS } from './UserProgressCard';

const ALL_BADGES = [
  // Compras
  { badge_id: 'first_voucher',    badge_name: 'Primeiro Passo',       badge_icon: '🎫', badge_category: 'compras',    description: 'Use seu 1º voucher',             threshold: 1,    type: 'used'     },
  { badge_id: 'five_vouchers',    badge_name: 'Frequente',             badge_icon: '⚡', badge_category: 'compras',    description: 'Use 5 vouchers',                  threshold: 5,    type: 'used'     },
  { badge_id: 'ten_vouchers',     badge_name: 'Fiel',                  badge_icon: '🔥', badge_category: 'fidelidade', description: 'Use 10 vouchers',                 threshold: 10,   type: 'used'     },
  { badge_id: 'twenty_five',      badge_name: 'Lenda Local',           badge_icon: '🏆', badge_category: 'fidelidade', description: 'Use 25 vouchers',                 threshold: 25,   type: 'used'     },
  { badge_id: 'fifty_vouchers',   badge_name: 'Elite',                 badge_icon: '💎', badge_category: 'fidelidade', description: 'Use 50 vouchers',                 threshold: 50,   type: 'used'     },
  { badge_id: 'hundred_vouchers', badge_name: 'Lendário',              badge_icon: '🌟', badge_category: 'fidelidade', description: 'Use 100 vouchers',                threshold: 100,  type: 'used'     },
  // Economia
  { badge_id: 'saved_100',        badge_name: 'Economizador',          badge_icon: '💰', badge_category: 'compras',    description: 'Economize R$100',                 threshold: 100,  type: 'saved'    },
  { badge_id: 'saved_500',        badge_name: 'Caça-Pechinchas',       badge_icon: '💸', badge_category: 'compras',    description: 'Economize R$500',                 threshold: 500,  type: 'saved'    },
  { badge_id: 'saved_1000',       badge_name: 'Mestre da Economia',    badge_icon: '💎', badge_category: 'compras',    description: 'Economize R$1.000',               threshold: 1000, type: 'saved'    },
  // Exploração
  { badge_id: 'three_partners',   badge_name: 'Explorador de Lojas',   badge_icon: '🗺️', badge_category: 'exploracao', description: 'Visite 3 parceiros',              threshold: 3,    type: 'partners' },
  { badge_id: 'five_partners',    badge_name: 'Globetrotter',          badge_icon: '🌟', badge_category: 'exploracao', description: 'Visite 5 parceiros',              threshold: 5,    type: 'partners' },
  { badge_id: 'ten_partners',     badge_name: 'Conhecedor',            badge_icon: '🏙️', badge_category: 'exploracao', description: 'Visite 10 parceiros',             threshold: 10,   type: 'partners' },
  { badge_id: 'fifteen_partners', badge_name: 'Viajante Master',       badge_icon: '🌍', badge_category: 'exploracao', description: 'Visite 15 parceiros',             threshold: 15,   type: 'partners' },
  // Indicações
  { badge_id: 'first_referral',   badge_name: 'Primeiro Convite',      badge_icon: '🤝', badge_category: 'indicacoes', description: 'Indique 1 amigo com sucesso',     threshold: 1,    type: 'referral' },
  { badge_id: 'five_referrals',   badge_name: 'Super Indicador',       badge_icon: '🚀', badge_category: 'indicacoes', description: 'Indique 5 amigos com sucesso',    threshold: 5,    type: 'referral' },
  { badge_id: 'ten_referrals',    badge_name: 'Embaixador',            badge_icon: '👑', badge_category: 'indicacoes', description: 'Indique 10 amigos com sucesso',   threshold: 10,   type: 'referral' },
];

const CATEGORY_CONFIG = {
  compras:    { label: 'Compras',    icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  fidelidade: { label: 'Fidelidade', icon: Star,        color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
  exploracao: { label: 'Exploração', icon: Map,         color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200'    },
  indicacoes: { label: 'Indicações', icon: Users,       color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200'  },
};

function BadgeTile({ badge, earned, progress, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;

  return (
    <div className={`relative flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${
      earned
        ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-md shadow-amber-100'
        : 'border-slate-200 bg-slate-50'
    }`}>
      {earned && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
          <span className="text-white text-[9px] font-black">✓</span>
        </div>
      )}

      <span className={`text-3xl mb-2 ${earned ? '' : 'grayscale opacity-40'}`}>
        {badge.badge_icon}
      </span>

      <p className={`text-xs font-bold leading-tight mb-1 ${earned ? 'text-slate-800' : 'text-slate-400'}`}>
        {badge.badge_name}
      </p>

      <p className={`text-[10px] leading-snug mb-2 ${earned ? 'text-slate-500' : 'text-slate-300'}`}>
        {badge.description}
      </p>

      {!earned && total > 0 && (
        <div className="w-full mt-auto">
          <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
            <span>{progress}</span>
            <span>{total}</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {!earned && total === 0 && (
        <Lock className="w-3 h-3 text-slate-300 mt-auto" />
      )}
    </div>
  );
}

export default function AchievementsTab({ vouchers = [], userEmail }) {
  const usedVouchers = vouchers.filter(v => v.status === 'used');
  const usedCount = usedVouchers.length;
  const uniquePartnersCount = new Set(usedVouchers.map(v => v.partner_id)).size;

  const { data: earnedBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['userBadges', userEmail],
    queryFn: () => base44.entities.Badge.filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  const { data: userPointsData, isLoading: loadingPoints } = useQuery({
    queryKey: ['userPoints', userEmail],
    queryFn: () => base44.functions.invoke('getUserPoints', {}),
    enabled: !!userEmail
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', userEmail],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: userEmail }),
    enabled: !!userEmail
  });

  const totalPoints = userPointsData?.data?.userPoints?.total_points ?? 0;
  const successfulReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;

  const earnedIds = new Set(earnedBadges.map(b => b.badge_id));

  const totalSaved = usedVouchers.reduce((sum, v) => sum + ((v.original_price || 0) - (v.discount_price || 0)), 0);

  const getProgress = (badge) => {
    if (badge.type === 'used') return { progress: usedCount, total: badge.threshold };
    if (badge.type === 'partners') return { progress: uniquePartnersCount, total: badge.threshold };
    if (badge.type === 'referral') return { progress: successfulReferrals, total: badge.threshold };
    if (badge.type === 'saved') return { progress: Math.floor(totalSaved), total: badge.threshold };
    return { progress: 0, total: 0 };
  };

  const totalEarned = earnedBadges.length;
  const totalBadges = ALL_BADGES.length;

  const groupedBadges = useMemo(() => {
    const groups = {};
    ALL_BADGES.forEach(b => {
      if (!groups[b.badge_category]) groups[b.badge_category] = [];
      groups[b.badge_category].push(b);
    });
    return groups;
  }, []);

  if (loadingBadges || loadingPoints) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress & Level */}
      <UserProgressCard vouchers={vouchers} totalPoints={totalPoints} />

      {/* Achievements Summary */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Medalhas
          </h4>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                style={{ width: `${Math.round((totalEarned / totalBadges) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500">{totalEarned}/{totalBadges}</span>
          </div>
        </div>

        {Object.entries(groupedBadges).map(([category, badges]) => {
          const cfg = CATEGORY_CONFIG[category];
          const Icon = cfg.icon;
          const earnedInGroup = badges.filter(b => earnedIds.has(b.badge_id)).length;

          return (
            <div key={category} className="mb-5 last:mb-0">
              <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl ${cfg.bg} border ${cfg.border} w-fit`}>
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-slate-400">{earnedInGroup}/{badges.length}</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {badges.map(badge => {
                  const { progress, total } = getProgress(badge);
                  return (
                    <BadgeTile
                      key={badge.badge_id}
                      badge={badge}
                      earned={earnedIds.has(badge.badge_id)}
                      progress={progress}
                      total={total}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Level Roadmap */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          Jornada de Níveis
        </h4>
        <div className="space-y-3">
          {LEVELS.map((lvl, idx) => {
            const isCurrentLevel = getLevel(totalPoints).level === lvl.level;
            const isUnlocked = totalPoints >= lvl.minPoints;
            const nextLvl = LEVELS[idx + 1];
            const pct = nextLvl
              ? Math.min(100, Math.round(((totalPoints - lvl.minPoints) / (nextLvl.minPoints - lvl.minPoints)) * 100))
              : 100;

            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  isCurrentLevel
                    ? `${lvl.borderColor} ${lvl.bgColor} shadow-sm`
                    : isUnlocked
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <span className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>{lvl.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-800">{lvl.name}</p>
                    {isCurrentLevel && (
                      <Badge className="bg-violet-100 text-violet-700 text-[10px] border-0 py-0 px-1.5">Atual</Badge>
                    )}
                  </div>
                  {isCurrentLevel && nextLvl && (
                    <div className="h-1.5 bg-white/80 rounded-full overflow-hidden border border-white/60">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${lvl.color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">{lvl.minPoints} pontos{nextLvl ? ` — ${nextLvl.minPoints - 1} pts` : '+'}</p>
                </div>
                {isUnlocked ? (
                  <span className="text-emerald-500 text-lg">✓</span>
                ) : (
                  <div className="text-right">
                    <Lock className="w-4 h-4 text-slate-300 mx-auto mb-0.5" />
                    <p className="text-[10px] text-slate-300">{lvl.minPoints - totalPoints} pts</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}