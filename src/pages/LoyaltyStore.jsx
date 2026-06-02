import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Gift, Star, Trophy, Store, Check, Loader2, Lock, ChevronRight, Info, Stamp } from 'lucide-react';
import StampCardDisplay from '@/components/loyalty/StampCardDisplay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

const REWARD_TYPE_LABELS = {
  desconto_percentual: { label: '% Desconto', emoji: '🏷️', color: 'bg-blue-100 text-blue-700' },
  desconto_fixo:       { label: 'Desconto R$', emoji: '💰', color: 'bg-emerald-100 text-emerald-700' },
  item_gratis:         { label: 'Item Grátis', emoji: '🎁', color: 'bg-amber-100 text-amber-700' },
  servico_gratis:      { label: 'Serviço Grátis', emoji: '✨', color: 'bg-violet-100 text-violet-700' },
  brinde:              { label: 'Brinde', emoji: '🎀', color: 'bg-fuchsia-100 text-fuchsia-700' },
};

function generateRedemptionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'LYL-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function RedeemDialog({ reward, partner, userPoints, user, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const canAfford = userPoints >= (reward?.points_required || 0);

  const handleRedeem = async () => {
    if (!canAfford) return;
    setLoading(true);
    const code = generateRedemptionCode();
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    // Create redemption record
    const redemption = await base44.entities.LoyaltyRedemption.create({
      user_email: user.email,
      reward_id: reward.id,
      partner_id: partner.id,
      points_spent: reward.points_required,
      redemption_code: code,
      status: 'pending',
      reward_title: reward.title,
      partner_name: partner.business_name,
      expires_at: expires.toISOString().split('T')[0]
    });

    // Deduct points from user
    const pointsList = await base44.entities.UserPoints.filter({ user_email: user.email });
    if (pointsList.length > 0) {
      const up = pointsList[0];
      await base44.entities.UserPoints.update(up.id, {
        total_points: Math.max(0, (up.total_points || 0) - reward.points_required)
      });
    }

    // Update reward redeemed count
    await base44.entities.LoyaltyReward.update(reward.id, {
      total_redeemed: (reward.total_redeemed || 0) + 1
    });

    // Notify partner
    await base44.entities.Notification.create({
      partner_id: partner.id,
      type: 'new_voucher',
      title: 'Novo Resgate de Fidelidade!',
      message: `${user.full_name || user.email} resgatou: "${reward.title}" — Código: ${code}`,
      is_read: false,
      reference_id: redemption.id
    });

    setLoading(false);
    setDone({ code, expires });
    onSuccess?.();
  };

  if (!reward) return null;
  const typeCfg = REWARD_TYPE_LABELS[reward.reward_type] || REWARD_TYPE_LABELS.brinde;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-600" />
            {done ? 'Resgate Realizado!' : 'Confirmar Resgate'}
          </DialogTitle>
          {!done && (
            <DialogDescription>Você usará {reward.points_required} pontos para resgatar esta recompensa.</DialogDescription>
          )}
        </DialogHeader>

        {!done ? (
          <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{typeCfg.emoji}</span>
                <div>
                  <p className="font-bold text-slate-800">{reward.title}</p>
                  <p className="text-sm text-slate-500">{partner.business_name}</p>
                </div>
              </div>
              {reward.description && <p className="text-sm text-slate-600">{reward.description}</p>}
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">Saldo Atual</p>
                <p className="text-xl font-black text-violet-700">🪙 {userPoints}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
              <div className="text-center">
                <p className="text-xs text-slate-400">Custo</p>
                <p className="text-xl font-black text-red-500">- {reward.points_required}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
              <div className="text-center">
                <p className="text-xs text-slate-400">Saldo Final</p>
                <p className="text-xl font-black text-emerald-600">🪙 {userPoints - reward.points_required}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-500 bg-amber-50 rounded-xl p-3">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>Você receberá um código único. Apresente-o ao parceiro para utilizar o benefício. Válido por 30 dias.</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleRedeem}
                disabled={loading || !canAfford}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
                Confirmar Resgate
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 text-center">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 mb-3">Seu código de resgate:</p>
              <div className="flex justify-center mb-3">
                <QRCodeSVG value={done.code} size={140} bgColor="#f0fdf4" fgColor="#065f46" level="M" />
              </div>
              <p className="text-2xl font-black text-emerald-700 tracking-widest font-mono">{done.code}</p>
              <p className="text-xs text-slate-500 mt-2">Válido até {new Date(done.expires).toLocaleDateString('pt-BR')}</p>
            </div>
            <p className="text-xs text-center text-slate-500">Apresente este código ao parceiro para utilizar seu benefício 🎉</p>
            <Button className="w-full" variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RewardCard({ reward, partner, userPoints, onRedeem, hasExpired, isLimitReached }) {
  const typeCfg = REWARD_TYPE_LABELS[reward.reward_type] || REWARD_TYPE_LABELS.brinde;
  const canAfford = userPoints >= reward.points_required;
  const isUnavailable = hasExpired || isLimitReached || !reward.is_active;

  const valueLabel = () => {
    if (reward.reward_type === 'desconto_percentual' && reward.reward_value) return `${reward.reward_value}% OFF`;
    if (reward.reward_type === 'desconto_fixo' && reward.reward_value) return `R$ ${reward.reward_value} OFF`;
    return null;
  };

  return (
    <Card className={`border-2 transition-all overflow-hidden ${isUnavailable ? 'border-slate-200 opacity-60' : canAfford ? 'border-violet-300 shadow-md shadow-violet-100' : 'border-slate-200'}`}>
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 text-center border-b relative">
          <span className="text-4xl">{typeCfg.emoji}</span>
          {valueLabel() && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-emerald-500 text-white text-xs border-0">{valueLabel()}</Badge>
            </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-slate-800 text-sm leading-tight">{reward.title}</p>
              <Badge className={`${typeCfg.color} text-xs border-0 shrink-0`}>{typeCfg.label}</Badge>
            </div>
            {partner && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Store className="w-3 h-3" />{partner.business_name}</p>}
            {reward.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{reward.description}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${canAfford && !isUnavailable ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
              🪙 {reward.points_required} pts
            </div>
            {reward.expires_at && (
              <p className="text-xs text-slate-400">até {new Date(reward.expires_at).toLocaleDateString('pt-BR')}</p>
            )}
          </div>

          {isUnavailable ? (
            <Button variant="outline" className="w-full text-slate-400" disabled size="sm">
              {isLimitReached ? 'Esgotado' : hasExpired ? 'Expirado' : 'Indisponível'}
            </Button>
          ) : !canAfford ? (
            <Button variant="outline" className="w-full text-slate-400" disabled size="sm">
              <Lock className="w-3 h-3 mr-2" />
              Faltam {reward.points_required - userPoints} pts
            </Button>
          ) : (
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" size="sm" onClick={onRedeem}>
              <Gift className="w-4 h-4 mr-2" />
              Resgatar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoyaltyStore() {
  const [user, setUser] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (!auth) { base44.auth.redirectToLogin(createPageUrl('LoyaltyStore')); return; }
      const me = await base44.auth.me();
      setUser(me);
    });
  }, []);

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['allLoyaltyRewards'],
    queryFn: () => base44.entities.LoyaltyReward.filter({ is_active: true })
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list()
  });

  const { data: userPointsList = [], refetch: refetchPoints } = useQuery({
    queryKey: ['userPoints', user?.email],
    queryFn: () => base44.entities.UserPoints.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: myRedemptions = [], refetch: refetchRedemptions } = useQuery({
    queryKey: ['myRedemptions', user?.email],
    queryFn: () => base44.entities.LoyaltyRedemption.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: myStampCards = [] } = useQuery({
    queryKey: ['myStampCards', user?.email],
    queryFn: () => base44.entities.StampCard.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: allStampConfigs = [] } = useQuery({
    queryKey: ['allStampConfigs'],
    queryFn: () => base44.entities.StampCardConfig.filter({ is_active: true })
  });

  const userPoints = userPointsList[0]?.total_points || 0;

  const partnerMap = useMemo(() => {
    const m = {};
    partners.forEach(p => { m[p.id] = p; });
    return m;
  }, [partners]);

  // Filter out expired and limit-reached
  const activeRewards = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return rewards.filter(r => {
      if (r.expires_at && r.expires_at < today) return false;
      if (r.max_redemptions > 0 && (r.total_redeemed || 0) >= r.max_redemptions) return false;
      return true;
    });
  }, [rewards]);

  const pendingRedemptions = myRedemptions.filter(r => r.status === 'pending');

  const handleSuccess = () => {
    refetchPoints();
    refetchRedemptions();
    qc.invalidateQueries({ queryKey: ['allLoyaltyRewards'] });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-1">Loja de Fidelidade 🪙</h1>
              <p className="text-violet-200">Troque seus pontos por benefícios exclusivos nos parceiros</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-4 text-center">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide mb-1">Seus Pontos</p>
              <p className="text-4xl font-black">🪙 {userPoints}</p>
            </div>
          </div>

          {/* How to earn */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              { emoji: '🎫', label: 'Resgate vouchers', pts: '+10 pts + 1 selo' },
              { emoji: '⭐', label: 'Avalie parceiros', pts: '+5 pts cada' },
              { emoji: '👥', label: 'Indique amigos', pts: '+50 pts cada' },
              { emoji: '🏅', label: 'Complete selos', pts: 'Desconto surpresa' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-xs text-white/90 font-medium mt-1">{item.label}</p>
                <p className="text-xs text-violet-200">{item.pts}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Pending redemptions */}
        {pendingRedemptions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Seus Resgates Ativos ({pendingRedemptions.length})
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {pendingRedemptions.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-amber-200 p-3">
                  <p className="font-semibold text-sm text-slate-800">{r.reward_title}</p>
                  <p className="text-xs text-slate-500">{r.partner_name}</p>
                  <div className="mt-2 bg-amber-50 rounded-lg p-2 text-center">
                    <p className="font-mono font-black text-amber-700 tracking-widest">{r.redemption_code}</p>
                    <p className="text-xs text-slate-500 mt-0.5">válido até {r.expires_at ? new Date(r.expires_at).toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stamp Cards Section */}
        {myStampCards.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Stamp className="w-5 h-5 text-violet-600" />
              Meus Cartões de Selos
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {myStampCards.map(card => {
                const config = allStampConfigs.find(c => c.partner_id === card.partner_id);
                return (
                  <StampCardDisplay
                    key={card.id}
                    stampCard={card}
                    partnerName={card.partner_name}
                    config={config || { stamps_goal: card.stamps_goal || 5 }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Rewards grid */}
        {rewardsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : activeRewards.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">Nenhuma recompensa disponível</p>
            <p className="text-slate-400 text-sm mt-1">Os parceiros ainda não cadastraram recompensas. Volte em breve!</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-violet-600" />
                Recompensas Disponíveis
                <Badge className="bg-violet-100 text-violet-700 border-0">{activeRewards.length}</Badge>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeRewards.map(reward => {
                  const partner = partnerMap[reward.partner_id];
                  const today = new Date().toISOString().split('T')[0];
                  const hasExpired = reward.expires_at && reward.expires_at < today;
                  const isLimitReached = reward.max_redemptions > 0 && (reward.total_redeemed || 0) >= reward.max_redemptions;
                  return (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      partner={partner}
                      userPoints={userPoints}
                      hasExpired={hasExpired}
                      isLimitReached={isLimitReached}
                      onRedeem={() => { setSelectedReward(reward); setSelectedPartner(partner); }}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedReward && (
        <RedeemDialog
          reward={selectedReward}
          partner={selectedPartner}
          userPoints={userPoints}
          user={user}
          onSuccess={handleSuccess}
          onClose={() => { setSelectedReward(null); setSelectedPartner(null); }}
        />
      )}
    </div>
  );
}