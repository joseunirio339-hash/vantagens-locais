import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Ticket, Trophy, RotateCcw } from 'lucide-react';
import SpinWheel from './SpinWheel';
import confetti from 'canvas-confetti';

export default function RaffleSpinModal({ open, onClose, raffle, partner, user, availableVouchers }) {
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [usedVoucher, setUsedVoucher] = useState(null);

  const needed = raffle?.vouchers_per_spin || 1;
  const eligibleVouchers = availableVouchers.filter(v =>
    v.partner_id === partner?.id && v.status === 'used'
  );

  // Vouchers already used for spins (to avoid reuse)
  const [spentVoucherIds, setSpentVoucherIds] = useState([]);
  const spendableVouchers = eligibleVouchers.filter(v => !spentVoucherIds.includes(v.id));
  const canSpin = spendableVouchers.length >= needed && !spinning;

  const handleSpin = () => {
    if (!canSpin) return;
    const voucher = spendableVouchers[0];
    setUsedVoucher(voucher);
    setPrize(null);
    setSpinning(true);
  };

  const handleSpinEnd = async (prizeIdx) => {
    setSpinning(false);
    const wonPrize = raffle.prizes[prizeIdx];
    setPrize(wonPrize);
    setSpentVoucherIds(prev => [...prev, usedVoucher.id]);

    // Save spin record
    await base44.entities.RaffleSpin.create({
      raffle_id: raffle.id,
      partner_id: partner.id,
      user_email: user.email,
      voucher_id: usedVoucher.id,
      prize_won: wonPrize.label
    });

    // Confetti!
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  };

  const handleClose = () => {
    setPrize(null);
    setSpinning(false);
    setUsedVoucher(null);
    onClose();
  };

  if (!raffle) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-violet-700">
            <Gift className="w-5 h-5" />
            {raffle.title}
          </DialogTitle>
        </DialogHeader>

        {raffle.description && (
          <p className="text-sm text-slate-500 -mt-2">{raffle.description}</p>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
          <Ticket className="w-4 h-4 text-violet-500" />
          <span>Você tem <strong>{spendableVouchers.length}</strong> voucher(s) disponíveis</span>
          <span className="text-slate-400">· precisa de {needed} p/ girar</span>
        </div>

        <div className="flex justify-center py-2">
          <SpinWheel
            prizes={raffle.prizes || []}
            spinning={spinning}
            onSpinEnd={handleSpinEnd}
          />
        </div>

        {prize && (
          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-2xl p-4 text-center">
            <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Você ganhou:</p>
            <p className="text-2xl font-bold text-violet-700 mt-1">{prize.label}</p>
            <p className="text-xs text-slate-400 mt-2">Apresente ao parceiro para resgatar seu prêmio</p>
          </div>
        )}

        <div className="flex gap-2">
          {!prize && (
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleSpin}
              disabled={!canSpin}
            >
              {spinning ? (
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              {spinning ? 'Girando…' : `Girar (${needed} voucher${needed > 1 ? 's' : ''})`}
            </Button>
          )}
          {prize && spendableVouchers.length >= needed && (
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleSpin}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Girar Novamente
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>Fechar</Button>
        </div>

        {!canSpin && !spinning && !prize && (
          <p className="text-xs text-center text-slate-400">
            Use mais vouchers neste parceiro para participar do sorteio
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}