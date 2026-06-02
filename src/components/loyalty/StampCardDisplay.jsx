import React, { useState } from 'react';
import { Stamp, Gift, Lock, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function StampDot({ filled, index }) {
  return (
    <div
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
        filled
          ? 'bg-violet-600 border-violet-700 shadow-md shadow-violet-300'
          : 'bg-white border-slate-200'
      }`}
    >
      {filled ? (
        <Stamp className="w-5 h-5 text-white" />
      ) : (
        <span className="text-xs font-bold text-slate-300">{index + 1}</span>
      )}
    </div>
  );
}

export default function StampCardDisplay({ stampCard, partnerName, config }) {
  const [showPrize, setShowPrize] = useState(false);

  if (!stampCard || !config) return null;

  const goal = stampCard.stamps_goal || config.stamps_goal || 5;
  const count = stampCard.stamps_count || 0;
  const progress = Math.min(count, goal);
  const isUnlocked = stampCard.reward_status === 'unlocked';
  const isUsed = stampCard.reward_status === 'used';
  const progressPct = Math.round((progress / goal) * 100);

  return (
    <div className={`rounded-2xl border-2 p-5 relative overflow-hidden ${
      isUnlocked
        ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-fuchsia-50'
        : isUsed
        ? 'border-slate-200 bg-slate-50 opacity-70'
        : 'border-violet-200 bg-white'
    }`}>
      {/* Completed shimmer */}
      {isUnlocked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-fuchsia-400 to-violet-400 rounded-t-2xl" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-bold text-slate-800 flex items-center gap-2">
            <Stamp className="w-4 h-4 text-violet-600" />
            {partnerName}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Cartão de Selos · {stampCard.total_completed || 0} cartão{(stampCard.total_completed || 0) !== 1 ? 'ões' : ''} completo{(stampCard.total_completed || 0) !== 1 ? 's' : ''}</p>
        </div>
        {isUnlocked && (
          <Badge className="bg-amber-400 text-white border-0 animate-pulse">🎉 Prêmio Desbloqueado!</Badge>
        )}
        {isUsed && (
          <Badge className="bg-slate-300 text-slate-600 border-0">✅ Usado</Badge>
        )}
      </div>

      {/* Stamp dots */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: goal }).map((_, i) => (
          <StampDot key={i} filled={i < progress} index={i} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{count} de {goal} selos</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {isUnlocked ? (
        <Button
          className="w-full bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-amber-500 hover:to-fuchsia-600 text-white font-bold gap-2"
          onClick={() => setShowPrize(true)}
        >
          <Sparkles className="w-4 h-4" />
          Ver Meu Desconto Surpresa!
        </Button>
      ) : isUsed ? (
        <p className="text-center text-sm text-slate-400 flex items-center justify-center gap-1">
          <Check className="w-4 h-4 text-emerald-500" /> Desconto utilizado
        </p>
      ) : count < goal ? (
        <div className="text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Faltam <b className="text-violet-600">{goal - count} selos</b> para desbloquear um desconto surpresa
          </p>
          {config.reward_description && (
            <p className="text-xs text-fuchsia-500 mt-1 italic">🎁 {config.reward_description}</p>
          )}
        </div>
      ) : null}

      {/* Prize dialog */}
      {isUnlocked && (
        <Dialog open={showPrize} onOpenChange={setShowPrize}>
          <DialogContent className="sm:max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-xl">
                <Sparkles className="w-6 h-6 text-amber-500" />
                Seu Desconto Surpresa!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-gradient-to-br from-amber-50 to-fuchsia-50 border-2 border-dashed border-amber-300 rounded-2xl p-6">
                <p className="text-4xl font-black text-fuchsia-600 mb-1">{stampCard.discount_revealed}</p>
                <p className="text-sm text-slate-500">em {partnerName}</p>
              </div>
              <div className="flex justify-center">
                <QRCodeSVG value={stampCard.reward_code || ''} size={140} bgColor="#fdf4ff" fgColor="#6d28d9" level="M" />
              </div>
              <div className="bg-violet-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Código para apresentar</p>
                <p className="font-mono font-black text-violet-700 text-lg tracking-widest">{stampCard.reward_code}</p>
              </div>
              <p className="text-xs text-slate-400">Apresente este QR Code ou código ao parceiro para utilizar seu benefício 🎉</p>
              <Button variant="outline" className="w-full" onClick={() => setShowPrize(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}