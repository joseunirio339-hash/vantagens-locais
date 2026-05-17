import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`w-10 h-10 transition-colors ${
              i <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 fill-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente!'
};

export default function ReviewModal({ open, onClose, voucher, partnerName, user, onReviewed }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecione uma nota de 1 a 5');
      return;
    }

    setLoading(true);

    // Check if already reviewed this voucher
    const existing = await base44.entities.Review.filter({
      voucher_id: voucher.id,
      user_email: user.email
    });

    if (existing.length > 0) {
      toast.error('Você já avaliou este voucher');
      setLoading(false);
      onClose();
      return;
    }

    await base44.entities.Review.create({
      partner_id: voucher.partner_id,
      user_email: user.email,
      user_name: user.full_name || user.email,
      rating,
      comment: comment.trim() || undefined,
      voucher_id: voucher.id
    });

    toast.success('Avaliação enviada! Obrigado pelo feedback 🌟');
    setLoading(false);
    setRating(0);
    setComment('');
    onReviewed(voucher.id);
    onClose();
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            Avaliar Experiência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="text-center">
            <p className="text-slate-600 text-sm mb-1">Como foi sua experiência em</p>
            <p className="font-bold text-slate-800 text-lg">{partnerName}</p>
            <p className="text-xs text-slate-400 mt-1">Voucher: {voucher?.product_name}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-center block">Sua nota *</Label>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-center text-sm font-semibold text-amber-500">
                {RATING_LABELS[rating]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Comentário (opcional)</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência no estabelecimento..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-slate-400 text-right">{comment.length}/500</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Agora não
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Avaliação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}