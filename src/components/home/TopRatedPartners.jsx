import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, ChevronRight, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
  'from-amber-50 to-yellow-50 border-amber-200',
  'from-slate-50 to-gray-50 border-slate-200',
  'from-orange-50 to-amber-50 border-orange-200',
];

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      ))}
    </div>
  );
}

export default function TopRatedPartners() {
  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['all-reviews-home'],
    queryFn: () => base44.entities.Review.list()
  });

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partners-for-rating'],
    queryFn: () => base44.entities.Partner.filter({ subscription_status: 'active' })
  });

  const isLoading = loadingReviews || loadingPartners;

  const topRated = useMemo(() => {
    if (!reviews.length || !partners.length) return [];
    const grouped = {};
    reviews.forEach(r => {
      if (!grouped[r.partner_id]) grouped[r.partner_id] = [];
      grouped[r.partner_id].push(r.rating);
    });
    return partners
      .map(p => {
        const ratings = grouped[p.id] || [];
        const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        return { ...p, avg_rating: avg, review_count: ratings.length };
      })
      .filter(p => p.review_count >= 1)
      .sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count)
      .slice(0, 5);
  }, [reviews, partners]);

  if (!isLoading && topRated.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Ranking dos Melhores</h2>
            <p className="text-slate-500 text-xs">Parceiros mais bem avaliados pelos clientes</p>
          </div>
        </div>
        <Link to={createPageUrl('Partners')} className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
          Ver todos <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {topRated.map((partner, i) => (
            <Link key={partner.id} to={createPageUrl(`PartnerStore?id=${partner.id}`)}>
              <div className={`flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r ${RANK_COLORS[i] || 'from-white to-slate-50 border-slate-100'} hover:shadow-md transition-all`}>
                {/* Posição */}
                <div className="w-10 text-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-2xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="text-lg font-bold text-slate-400">#{i + 1}</span>
                  )}
                </div>

                {/* Logo */}
                <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-300">{partner.business_name?.charAt(0)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{partner.business_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Stars rating={partner.avg_rating} />
                    <span className="text-xs text-slate-400">{partner.review_count} avaliação{partner.review_count !== 1 ? 'ões' : ''}</span>
                  </div>
                  {partner.city && <p className="text-xs text-slate-400 mt-0.5 truncate">{partner.city}</p>}
                </div>

                {/* Nota */}
                <div className="flex-shrink-0 text-center">
                  <span className={`text-2xl font-black ${i === 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                    {partner.avg_rating.toFixed(1)}
                  </span>
                  <p className="text-xs text-slate-400">/ 5.0</p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}