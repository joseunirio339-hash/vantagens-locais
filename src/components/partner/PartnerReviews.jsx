import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, TrendingUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StarDisplay({ rating, size = 'sm' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function PartnerReviews({ partnerId }) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['partnerReviews', partnerId],
    queryFn: () => base44.entities.Review.filter({ partner_id: partnerId }, '-created_date', 50),
    enabled: !!partnerId
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {avgRating ? (
              <>
                <span className="text-6xl font-bold text-slate-800">{avgRating}</span>
                <StarDisplay rating={Math.round(parseFloat(avgRating))} size="lg" />
                <p className="text-slate-500 mt-2 text-sm">{reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}</p>
              </>
            ) : (
              <>
                <Star className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Sem avaliações ainda</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição de Notas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-4">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-4">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reviews list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            Comentários dos Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma avaliação ainda</p>
              <p className="text-sm mt-1">As avaliações aparecerão aqui após os clientes usarem seus vouchers</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{review.user_name || review.user_email}</p>
                        <StarDisplay rating={review.rating} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(review.created_date), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-slate-600 text-sm mt-3 ml-12">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}