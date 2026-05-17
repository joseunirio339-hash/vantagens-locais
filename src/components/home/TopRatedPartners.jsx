import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
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

  const topRated = React.useMemo(() => {
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">⭐ Melhores Avaliados</h2>
          <p className="text-slate-500 text-sm">Parceiros mais bem avaliados pelos clientes</p>
        </div>
        <Link to={createPageUrl('Partners')}>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-48 h-28 rounded-2xl flex-shrink-0" />)}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {topRated.map((partner, i) => (
            <Link key={partner.id} to={createPageUrl(`PartnerStore?id=${partner.id}`)} className="snap-start flex-shrink-0">
              <Card className="w-52 hover:shadow-md transition-shadow border-amber-100 hover:border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-slate-400">{partner.business_name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{partner.business_name}</p>
                      <p className="text-xs text-slate-400 truncate">{partner.city || partner.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <StarRating rating={partner.avg_rating} />
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{partner.avg_rating.toFixed(1)}</p>
                      <p className="text-xs text-slate-400">{partner.review_count} av.</p>
                    </div>
                  </div>
                  {i === 0 && (
                    <div className="mt-2 text-xs bg-amber-50 text-amber-700 rounded-lg px-2 py-1 text-center font-medium">
                      🥇 Melhor avaliado
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}