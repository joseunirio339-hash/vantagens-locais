import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, Store } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const RATING_LABELS = { 1: 'Péssimo', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Excelente' };
const RATING_COLORS = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-orange-100 text-orange-700 border-orange-200',
  3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  4: 'bg-blue-100 text-blue-700 border-blue-200',
  5: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function MyReviewsList({ userEmail }) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['myReviews', userEmail],
    queryFn: () => base44.entities.Review.filter({ user_email: userEmail }, '-created_date', 50),
    enabled: !!userEmail
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list()
  });

  const getPartner = (partnerId) => partners.find(p => p.id === partnerId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-24 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center">
        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Você ainda não fez avaliações</p>
        <p className="text-sm text-slate-400 mt-1">
          Após usar um voucher, avalie a experiência no estabelecimento
        </p>
      </div>
    );
  }

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
        <div className="text-center">
          <p className="text-3xl font-black text-slate-800">{avgRating}</p>
          <StarDisplay rating={Math.round(parseFloat(avgRating))} />
        </div>
        <div>
          <p className="font-semibold text-slate-700">Sua média geral</p>
          <p className="text-sm text-slate-500">{reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''} enviada{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* List */}
      {reviews.map(review => {
        const partner = getPartner(review.partner_id);
        return (
          <div key={review.id} className="border border-slate-100 rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {partner?.logo_url ? (
                    <img src={partner.logo_url} alt={partner.business_name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{partner?.business_name || 'Estabelecimento'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarDisplay rating={review.rating} />
                    <Badge variant="outline" className={`text-xs py-0 px-1.5 h-4 border ${RATING_COLORS[review.rating]}`}>
                      {RATING_LABELS[review.rating]}
                    </Badge>
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatDistanceToNow(new Date(review.created_date), { addSuffix: true, locale: ptBR })}
              </span>
            </div>

            {review.comment && (
              <div className="mt-3 pl-13">
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                  "{review.comment}"
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}