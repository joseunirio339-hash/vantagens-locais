import React, { useMemo } from 'react';
import { Trophy, Star, Gift, Lock, Zap, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export const LEVELS = [
  { level: 1, name: 'Iniciante',   icon: '🌱', minPoints: 0,   color: 'from-slate-400 to-slate-500',   bgColor: 'bg-slate-50',   borderColor: 'border-slate-200',   textColor: 'text-slate-600'   },
  { level: 2, name: 'Explorador',  icon: '🧭', minPoints: 50,  color: 'from-emerald-400 to-teal-500',  bgColor: 'bg-emerald-50',  borderColor: 'border-emerald-300', textColor: 'text-emerald-700' },
  { level: 3, name: 'Econômico',   icon: '💡', minPoints: 150, color: 'from-blue-400 to-cyan-500',     bgColor: 'bg-blue-50',     borderColor: 'border-blue-300',    textColor: 'text-blue-700'    },
  { level: 4, name: 'Caçador',     icon: '🎯', minPoints: 350, color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-50',   borderColor: 'border-violet-300',  textColor: 'text-violet-700'  },
  { level: 5, name: 'Mestre',      icon: '👑', minPoints: 700, color: 'from-amber-400 to-orange-500',  bgColor: 'bg-amber-50',    borderColor: 'border-amber-300',   textColor: 'text-amber-700'   },
];

const REWARDS = [
  { level: 2, icon: '💚', desc: '5% extra em produtos selecionados',  minPoints: 50  },
  { level: 3, icon: '⚡', desc: 'Acesso antecipado a novos cupons',   minPoints: 150 },
  { level: 4, icon: '💜', desc: '10% extra em parceiros destaque',    minPoints: 350 },
  { level: 5, icon: '👑', desc: 'Benefícios VIP e sorteios mensais',  minPoints: 700 },
];

export function getLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}

export default function UserProgressCard({ vouchers = [], totalPoints = 0 }) {
  const usedVouchers = vouchers.filter(v => v.status === 'used');
  const usedCount = usedVouchers.length;
  const uniquePartners = new Set(usedVouchers.map(v => v.partner_id)).size;

  const currentLevel = useMemo(() => getLevel(totalPoints), [totalPoints]);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

  const progressPercent = useMemo(() => {
    if (!nextLevel) return 100;
    const range = nextLevel.minPoints - currentLevel.minPoints;
    const done = totalPoints - currentLevel.minPoints;
    return Math.min(100, Math.round((done / range) * 100));
  }, [totalPoints, currentLevel, nextLevel]);

  return (
    <div className="space-y-4">
      {/* Main Level Card */}
      <div className={`rounded-2xl border-2 ${currentLevel.borderColor} ${currentLevel.bgColor} p-5 relative overflow-hidden`}>
        <div className="absolute -top-6 -right-6 text-8xl opacity-10 pointer-events-none select-none">
          {currentLevel.icon}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Seu Nível</p>
            <div className="flex items-center gap-2.5">
              <span className="text-4xl">{currentLevel.icon}</span>
              <div>
                <h3 className={`text-2xl font-black ${currentLevel.textColor}`}>{currentLevel.name}</h3>
                <p className="text-xs text-slate-500">Nível {currentLevel.level} de {LEVELS.length}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${currentLevel.textColor}`}>{totalPoints}</div>
            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              pontos totais
            </p>
          </div>
        </div>

        {nextLevel ? (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Próximo: <strong>{nextLevel.icon} {nextLevel.name}</strong></span>
              <span className="font-semibold">{totalPoints}/{nextLevel.minPoints} pts</span>
            </div>
            <div className="relative h-3.5 bg-white/70 rounded-full overflow-hidden border border-white/80">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-700 shadow-sm`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              🎯 Faltam <strong>{nextLevel.minPoints - totalPoints} pontos</strong> para o próximo nível
            </p>
          </div>
        ) : (
          <div className="mt-2 text-center py-2.5 bg-amber-100 rounded-xl border border-amber-200">
            <p className="text-sm font-bold text-amber-700">🎉 Nível máximo atingido! Você é um Mestre!</p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-amber-500">{totalPoints}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-0.5 justify-center">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> pontos
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-violet-600">{usedCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">usados</div>
        </div>
        <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-emerald-600">{uniquePartners}</div>
          <div className="text-xs text-slate-500 mt-0.5">parceiros</div>
        </div>
      </div>

      {/* How to earn points */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-amber-500" />
          Como ganhar pontos
        </h4>
        <div className="space-y-2">
          {[
            { icon: '🎫', label: 'Usar qualquer voucher', pts: '+10 pts' },
            { icon: '💰', label: 'Desconto acima de R$20', pts: '+15 pts' },
            { icon: '🏆', label: 'Desconto acima de R$50', pts: '+25 pts' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-slate-700">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards by level */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
          <Gift className="w-4 h-4 text-violet-500" />
          Recompensas por Nível
        </h4>
        <div className="space-y-2">
          {REWARDS.map(reward => {
            const unlocked = totalPoints >= reward.minPoints;
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
                  <p className="text-xs text-slate-400">{levelInfo?.icon} {levelInfo?.name} — {reward.minPoints} pts</p>
                </div>
                {unlocked ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs shrink-0">
                    ✓ Ativo
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-xs">{reward.minPoints - totalPoints} pts</span>
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