import React from 'react';
import { Users, Trophy, Star } from 'lucide-react';

export default function ReferralStats({ totalPoints, totalReferrals, successfulReferrals }) {
  const stats = [
    {
      icon: Users,
      label: 'Amigos Convidados',
      value: totalReferrals,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      icon: Star,
      label: 'Assinaram o Plano',
      value: successfulReferrals,
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50',
    },
    {
      icon: Trophy,
      label: 'Pontos Ganhos',
      value: totalPoints,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white rounded-2xl border p-4 text-center">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}