import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Copy, Share2, Users, Trophy, Gift, Check, Star, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReferralStats from '@/components/referral/ReferralStats';
import ReferralList from '@/components/referral/ReferralList';
import HowItWorks from '@/components/referral/HowItWorks';

export default function ReferralPage() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      setIsAuthenticated(authed);
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
    });
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['userPoints', user?.email],
    queryFn: () => base44.functions.invoke('getUserPoints', {}),
    enabled: !!user,
  });

  const userPoints = data?.data?.userPoints;
  const referrals = data?.data?.referrals || [];

  const referralLink = userPoints
    ? `${window.location.origin}/ReferralLanding?ref=${userPoints.referral_code}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Clube Max Descontos — Indique e Ganhe!',
        text: 'Use meu link e ganhe acesso a descontos incríveis em parceiros locais!',
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  if (isAuthenticated === null || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <Gift className="w-16 h-16 text-violet-400" />
        <h2 className="text-2xl font-bold text-slate-800">Indique e Ganhe</h2>
        <p className="text-slate-500 text-center max-w-sm">
          Faça login para acessar seu link de indicação e começar a acumular pontos!
        </p>
        <Button
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
          onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
        >
          Entrar para participar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
            <Gift className="w-4 h-4" />
            <span>Programa de Indicações</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Indique e Ganhe!</h1>
          <p className="text-lg text-white/90 mb-6">
            Convide amigos para o Clube Max Descontos e ganhe <strong>100 pontos</strong> a cada assinatura realizada.
          </p>
          {userPoints && (
            <div className="inline-flex items-center gap-3 bg-white/20 rounded-2xl px-6 py-3">
              <Trophy className="w-6 h-6 text-yellow-300" />
              <span className="text-2xl font-bold">{userPoints.total_points || 0}</span>
              <span className="text-white/80">pontos acumulados</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-6">
        {/* Referral Link Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Seu link único de indicação</h2>
          <p className="text-sm text-slate-500 mb-4">Compartilhe com amigos — cada cadastro é rastreado automaticamente.</p>
          {userPoints ? (
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-600 truncate font-mono">
                {referralLink}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          ) : (
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          )}
          {copied && (
            <p className="text-xs text-green-600 mt-2">✓ Link copiado para a área de transferência!</p>
          )}

          {/* Referral code badge */}
          {userPoints && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-400">Seu código:</span>
              <Badge variant="secondary" className="font-mono text-sm px-3">
                {userPoints.referral_code}
              </Badge>
            </div>
          )}
        </div>

        {/* Stats */}
        {userPoints && (
          <ReferralStats
            totalPoints={userPoints.total_points || 0}
            totalReferrals={userPoints.total_referrals || 0}
            successfulReferrals={userPoints.successful_referrals || 0}
          />
        )}

        {/* How it works */}
        <HowItWorks />

        {/* Referral List */}
        <ReferralList referrals={referrals} />
      </div>
    </div>
  );
}