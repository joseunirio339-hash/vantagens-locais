import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ALL_BADGES_COUNT = 9;

export default function HomeBadgesWidget({ userEmail }) {
  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['userBadges', userEmail],
    queryFn: () => base44.entities.Badge.filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  if (!userEmail) return null;

  return (
    <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-violet-700">
            <Award className="w-5 h-5" /> Suas Conquistas
          </CardTitle>
          <Link to={createPageUrl('MyVouchers')} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {earnedBadges.length === 0 ? (
          <p className="text-sm text-violet-500">Nenhuma conquista ainda. Use vouchers para ganhar badges! 🏅</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {earnedBadges.slice(0, 8).map(b => (
              <div key={b.badge_id} className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 border border-violet-200 text-sm shadow-sm">
                <span>{b.badge_icon}</span>
                <span className="text-violet-700 font-medium text-xs">{b.badge_name}</span>
              </div>
            ))}
            {earnedBadges.length > 8 && (
              <div className="flex items-center gap-1.5 bg-violet-100 rounded-full px-2.5 py-1 text-xs text-violet-600 font-medium">
                +{earnedBadges.length - 8} mais
              </div>
            )}
          </div>
        )}
        <div className="mt-2 text-xs text-violet-400">
          {earnedBadges.length}/{ALL_BADGES_COUNT} conquistas desbloqueadas
        </div>
      </CardContent>
    </Card>
  );
}