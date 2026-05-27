import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const RATING_LABELS = { 1: 'Péssimo', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Excelente' };

export default function PartnerReviewForm({ partnerId, user }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Verifica se o usuário já avaliou este parceiro
  const { data: existingReview } = useQuery({
    queryKey: ['myReview', partnerId, user?.email],
    queryFn: () => base44.entities.Review.filter({ partner_id: partnerId, user_email: user.email }),
    enabled: !!user?.email && !!partnerId,
    select: (data) => data[0] || null
  });

  // Verifica se o usuário tem ao menos um voucher usado neste parceiro
  const { data: usedVouchers = [] } = useQuery({
    queryKey: ['usedVouchers', partnerId, user?.email],
    queryFn: () => base44.entities.Voucher.filter({ partner_id: partnerId, user_email: user.email, status: 'used' }),
    enabled: !!user?.email && !!partnerId
  });

  if (!user) {
    return (
      <Card className="border-dashed border-2 border-slate-200">
        <CardContent className="py-8 text-center">
          <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Faça login para deixar sua avaliação</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
          >
            Entrar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (usedVouchers.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200">
        <CardContent className="py-8 text-center">
          <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">Avalie este parceiro</p>
          <p className="text-slate-400 text-xs mt-1">Disponível após usar um voucher neste estabelecimento</p>
        </CardContent>
      </Card>
    );
  }

  if (existingReview || submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-emerald-700 font-semibold text-sm">Avaliação enviada!</p>
          <p className="text-emerald-600 text-xs mt-1">Obrigado pelo seu feedback</p>
          {existingReview && (
            <div className="mt-4 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i <= existingReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await base44.entities.Review.create({
      partner_id: partnerId,
      user_email: user.email,
      user_name: user.full_name,
      rating,
      comment: comment.trim() || undefined,
    });
    queryClient.invalidateQueries({ queryKey: ['partnerReviews', partnerId] });
    queryClient.invalidateQueries({ queryKey: ['myReview', partnerId, user.email] });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <p className="font-semibold text-slate-700 text-sm">Deixe sua avaliação</p>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(i)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  i <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                }`}
              />
            </button>
          ))}
          {(hovered || rating) > 0 && (
            <span className="ml-2 text-sm font-medium text-amber-600">
              {RATING_LABELS[hovered || rating]}
            </span>
          )}
        </div>

        {/* Comment */}
        <Textarea
          placeholder="Conte sua experiência (opcional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Enviando...' : 'Enviar Avaliação'}
        </Button>
      </CardContent>
    </Card>
  );
}