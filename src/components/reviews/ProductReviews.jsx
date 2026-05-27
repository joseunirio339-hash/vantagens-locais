import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare, User, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RATING_LABELS = { 1: 'Péssimo', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Excelente' };

function StarDisplay({ rating, size = 'sm' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} ${
            i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

function RatingSummary({ reviews }) {
  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100
      : 0
  }));

  return (
    <div className="flex gap-6 items-center p-5 bg-amber-50 border border-amber-100 rounded-2xl mb-6">
      <div className="text-center flex-shrink-0">
        <p className="text-5xl font-black text-slate-800">{avg.toFixed(1)}</p>
        <StarDisplay rating={Math.round(avg)} size="lg" />
        <p className="text-xs text-slate-500 mt-1">{reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {distribution.map(({ star, count, pct }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 w-3">{star}</span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
            <div className="flex-1 bg-amber-100 rounded-full h-2">
              <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-500 w-4">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.comment && review.comment.length > 160;

  return (
    <div className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-violet-600">
              {(review.user_name || review.user_email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{review.user_name || 'Usuário'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarDisplay rating={review.rating} />
              <Badge variant="outline" className="text-xs py-0 px-1.5 h-4 text-amber-600 border-amber-200">
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
        <div className="mt-3 ml-13">
          <p className="text-slate-600 text-sm leading-relaxed ml-13">
            {isLong && !expanded ? `${review.comment.slice(0, 160)}...` : review.comment}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-violet-600 hover:text-violet-700 mt-1 flex items-center gap-1"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Ver menos</> : <><ChevronDown className="w-3 h-3" /> Ver mais</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const FILTER_OPTIONS = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Melhor avaliação', value: 'best' },
  { label: 'Pior avaliação', value: 'worst' },
  { label: 'Com comentário', value: 'with_comment' },
];

export default function ProductReviews({ partnerId, partnerName }) {
  const [filter, setFilter] = useState('recent');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['partnerReviews', partnerId],
    queryFn: () => base44.entities.Review.filter({ partner_id: partnerId }, '-created_date', 100),
    enabled: !!partnerId
  });

  let filtered = [...reviews];
  if (ratingFilter > 0) filtered = filtered.filter(r => r.rating === ratingFilter);
  if (filter === 'best') filtered.sort((a, b) => b.rating - a.rating);
  else if (filter === 'worst') filtered.sort((a, b) => a.rating - b.rating);
  else if (filter === 'with_comment') filtered = filtered.filter(r => r.comment);

  const displayed = showAll ? filtered : filtered.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-20 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {reviews.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma avaliação ainda</p>
          <p className="text-sm text-slate-400 mt-1">As avaliações aparecem após clientes usarem seus vouchers</p>
        </div>
      ) : (
        <>
          <RatingSummary reviews={reviews} />

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="flex gap-1 flex-wrap">
              {[0, 5, 4, 3, 2, 1].map(star => (
                <button
                  key={star}
                  onClick={() => setRatingFilter(star)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    ratingFilter === star
                      ? 'bg-amber-400 text-white border-amber-400'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {star === 0 ? 'Todas' : (
                    <><Star className="w-3 h-3 fill-current" /> {star}</>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap ml-auto">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filter === opt.value
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews list */}
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Nenhuma avaliação para este filtro
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {filtered.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Ver menos' : `Ver todas as ${filtered.length} avaliações`}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}