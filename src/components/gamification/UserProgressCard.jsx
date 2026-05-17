import React, { useMemo } from 'react';
import { Trophy, Star, Zap, Award, Gift, TrendingUp, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const LEVELS = [
  { level: 1, name: 'Iniciante',     icon: '🌱', minVouchers: 0,  color: 'from-slate-400 to-slate-500',    bgColor: 'bg-slate-50',  borderColor: 'border-slate-200' },
  { level: 2, name: 'Explorador',    icon: '🧭', minVouchers: 3,  color: 'from-emerald-400 to-teal-500',   bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { level: 3, name: 'Econômico',     icon: '💡', minVouchers: 7,  color: 'from-blue-400 to-cyan-500',      bgColor: 'bg-blue-50',   borderColor: 'border-blue-200' },
  { level: 4, name: 'Caçador',       icon: '🎯', minVouchers: 15, color: 'from-violet-400 to-purple-600',  bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { level: 5, name: 'Mestre',        icon: '👑', minVouchers: 30, color: 'from-amber-400 to-orange-500',   bgColor: 'bg-amber-50',  borderColor: 'border-amber-200' },
];

const BADGES = [
  { id: 'first_voucher',  name: 'Primeiro Passo',      icon: '🎫', desc: 'Use seu primeiro voucher',         threshold: 1,  type: 'used' },
  { id: 'five_vouchers',  name: 'Frequente',            icon: '⚡', desc: 'Use 5 vouchers',                   threshold: 5,  type: 'used' },
  { id: 'ten_vouchers',   name: 'Fiel',                 icon: '🔥', desc: 'Use 10 vouchers',                  threshold: 10, type: 'used' },
  { id: 'twenty_five',    name: 'Lenda Local',          icon: '🏆', desc: 'Use 25 vouchers',                  threshold: 25, type: 'used' },
  { id: 'three_partners', name: 'Explorador de Lojas',  icon: '🗺️', desc: 'Compre em 3 parceiros diferentes', threshold: 3,  type: 'partners' },
  { id: 'five_partners',  name: 'Globetrotter',         icon: '🌟', desc: 'Compre em 5 parceiros diferentes', threshold: 5,  type: 'partners' },
];

const REWARDS = [
  { level: 2, desc: '5% extra em produtos selecionados',    icon: '💚' },
  { level: 3, desc: 'Acesso antecipado a novos cupons',    icon: '⚡' },
  { level: 4, desc: '10% extra em parceiros destaque',     icon: '💜' },
  { level: 5, desc: 'Benefícios VIP exclusivos',           icon: '👑' },
];

export default function UserProgressCard({ vouchers = [] }) {
  const usedVouchers = vouchers.filter(v => v.status === 'used');
  const usedCount = usedVouchers.length;
  const uniquePartners = new Set(usedVouchers.map(v => v.partner_id)).size;

  const currentLevel = useMemo(() => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (usedCount >= LEVELS[i].minVouchers) return LEVELS[i];
    }
    return LEVELS[0];
  }, [usedCount]);

  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

  const progressPercent = useMemo(() => {
    if (!nextLevel) return 100;
    const range = nextLevel.minVouchers - currentLevel.minVouchers;
    const done = usedCount - currentLevel.minVouchers;
    return Math.min(100, Math.round((done / range) * 100));
  }, [usedCount, currentLevel, nextLevel]);

  const earnedBadges = BADGES.filter(b => {
    if (b.type === 'used') return usedCount >= b.threshold;
    if (b.type === 'partners') return uniquePartners >= b.threshold;
    return false;
  });

  return (
    <div className="space-y-4">
      {/* Level Card */}
      <div className={`rounded-2xl border-2 ${currentLevel.borderColor} ${currentLevel.bgColor} p-5`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Seu Nível</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl">{currentLevel.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{currentLevel.name}</h3>
                <p className="text-sm text-slate-500">Nível {currentLevel.level}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-800">{usedCount}</p>
            <p className="text-xs text-slate-500">vouchers usados</p>
          </div>
        </div>

        {nextLevel ? (
          <>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progresso para <strong>{nextLevel.icon} {nextLevel.name}</strong></span>
              <span>{usedCount}/{nextLevel.minVouchers}</span>
            </div>
            <div className="relative h-3 bg-white rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-700`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Faltam {nextLevel.minVouchers - usedCount} vouchers para o próximo nível
            </p>
          </>
        ) : (
          <div className="mt-2 text-center py-2 bg-amber-100 rounded-xl">
            <p className="text-sm font-bold text-amber-700">🎉 Nível máximo atingido!</p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-black text-violet-600">{usedCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Vouchers usados</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-black text-emerald-600">{uniquePartners}</div>
          <div className="text-xs text-slate-500 mt-0.5">Parceiros visitados</div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border p-5">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Conquistas
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const earned = earnedBadges.find(b => b.id === badge.id);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${
                  earned
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-100 bg-slate-50 opacity-50 grayscale'
                }`}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <p className={`text-xs font-semibold leading-tight ${earned ? 'text-slate-800' : 'text-slate-400'}`}>
                  {badge.name}
                </p>
                {!earned && (
                  <div className="flex items-center gap-0.5 mt-1">
                    <Lock className="w-2.5 h-2.5 text-slate-300" />
                    <p className="text-[10px] text-slate-300">{badge.desc}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rewards unlocked by level */}
      <div className="bg-white rounded-2xl border p-5">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-violet-500" />
          Recompensas por Nível
        </h4>
        <div className="space-y-2">
          {REWARDS.map(reward => {
            const unlocked = currentLevel.level >= reward.level;
            const levelInfo = LEVELS.find(l => l.level === reward.level);
            return (
              <div
                key={reward.level}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  unlocked ? 'border-violet-200 bg-violet-50' : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <span className="text-xl">{reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                    {reward.desc}
                  </p>
                  <p className="text-xs text-slate-400">Nível {reward.level} — {levelInfo?.name}</p>
                </div>
                {unlocked ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs shrink-0">
                    ✓ Ativo
                  </Badge>
                ) : (
                  <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}