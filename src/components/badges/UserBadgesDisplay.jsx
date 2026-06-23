import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BadgeCard from './BadgeCard';

// All possible badges in the system
const ALL_BADGES = [
  { badge_id: 'first_voucher',    badge_name: 'Primeiro Passo',      badge_icon: '🎫', badge_category: 'compras',     description: 'Use seu 1º voucher' },
  { badge_id: 'five_vouchers',    badge_name: 'Frequente',            badge_icon: '⚡', badge_category: 'compras',     description: 'Use 5 vouchers' },
  { badge_id: 'ten_vouchers',     badge_name: 'Fiel',                 badge_icon: '🔥', badge_category: 'fidelidade',  description: 'Use 10 vouchers' },
  { badge_id: 'twenty_five',      badge_name: 'Lenda Local',          badge_icon: '🏆', badge_category: 'fidelidade',  description: 'Use 25 vouchers' },
  { badge_id: 'fifty_vouchers',   badge_name: 'Elite',                badge_icon: '💎', badge_category: 'fidelidade',  description: 'Use 50 vouchers' },
  { badge_id: 'hundred_vouchers', badge_name: 'Lendário',             badge_icon: '🌟', badge_category: 'fidelidade',  description: 'Use 100 vouchers' },
  { badge_id: 'saved_100',        badge_name: 'Economizador',         badge_icon: '💰', badge_category: 'compras',     description: 'Economize R$100' },
  { badge_id: 'saved_500',        badge_name: 'Caça-Pechinchas',      badge_icon: '💸', badge_category: 'compras',     description: 'Economize R$500' },
  { badge_id: 'saved_1000',       badge_name: 'Mestre da Economia',   badge_icon: '💎', badge_category: 'compras',     description: 'Economize R$1.000' },
  { badge_id: 'three_partners',   badge_name: 'Explorador de Lojas',  badge_icon: '🗺️', badge_category: 'exploracao',  description: 'Visite 3 parceiros' },
  { badge_id: 'five_partners',    badge_name: 'Globetrotter',         badge_icon: '🌟', badge_category: 'exploracao',  description: 'Visite 5 parceiros' },
  { badge_id: 'ten_partners',     badge_name: 'Conhecedor',           badge_icon: '🏙️', badge_category: 'exploracao',  description: 'Visite 10 parceiros' },
  { badge_id: 'fifteen_partners', badge_name: 'Viajante Master',      badge_icon: '🌍', badge_category: 'exploracao',  description: 'Visite 15 parceiros' },
  { badge_id: 'first_referral',   badge_name: 'Primeiro Convite',     badge_icon: '🤝', badge_category: 'indicacoes',  description: 'Indique 1 amigo' },
  { badge_id: 'five_referrals',   badge_name: 'Super Indicador',      badge_icon: '🚀', badge_category: 'indicacoes',  description: 'Indique 5 amigos' },
  { badge_id: 'ten_referrals',    badge_name: 'Embaixador',           badge_icon: '👑', badge_category: 'indicacoes',  description: 'Indique 10 amigos' },
];

export default function UserBadgesDisplay({ userEmail }) {
  const { data: earnedBadges = [], isLoading } = useQuery({
    queryKey: ['userBadges', userEmail],
    queryFn: () => base44.entities.Badge.filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  const earnedIds = new Set(earnedBadges.map(b => b.badge_id));

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-600" /> Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="w-14 h-14 rounded-2xl" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-600" /> Conquistas
          </CardTitle>
          <span className="text-xs text-slate-500 bg-violet-50 px-2 py-0.5 rounded-full">
            {earnedBadges.length}/{ALL_BADGES.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {earnedBadges.length === 0 && (
          <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Use vouchers e indique amigos para desbloquear conquistas!
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          {ALL_BADGES.map(b => {
            const earned = earnedBadges.find(e => e.badge_id === b.badge_id);
            return (
              <BadgeCard
                key={b.badge_id}
                badge={earned || b}
                locked={!earnedIds.has(b.badge_id)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}