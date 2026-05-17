import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// This page is the landing for referral links: /ReferralLanding?ref=CODE
// It stores the ref code in localStorage, then redirects to login/home.
export default function ReferralLanding() {
  const [refCode, setRefCode] = useState('');
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');
    if (code) {
      setRefCode(code);
      // Persist code so we can use it after the user registers
      localStorage.setItem('referral_code', code);
    }

    // If already authenticated, register the referral immediately
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed && code) {
        const me = await base44.auth.me();
        const storedCode = localStorage.getItem('referral_code');
        if (storedCode) {
          await base44.functions.invoke('referralRegister', {
            referral_code: storedCode,
            referred_email: me.email,
          });
          localStorage.removeItem('referral_code');
          setRegistered(true);
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {registered ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Indicação registrada!</h1>
            <p className="text-slate-500 mb-6">
              Bem-vindo ao Clube Max Descontos! Ative uma assinatura e seu amigo ganha pontos.
            </p>
            <Link to={createPageUrl('Subscription')}>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                Ver planos e assinar
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Você foi convidado!</h1>
            <p className="text-slate-500 mb-2">
              Um amigo está te convidando para o <strong>Clube Max Descontos</strong> — descontos reais em parceiros locais.
            </p>
            {refCode && (
              <div className="bg-violet-50 rounded-xl px-4 py-2 mb-5 inline-block">
                <span className="text-xs text-slate-500">Código de indicação: </span>
                <span className="font-mono font-semibold text-violet-700">{refCode}</span>
              </div>
            )}
            <p className="text-sm text-slate-400 mb-6">
              Crie sua conta gratuita e comece a aproveitar descontos exclusivos!
            </p>
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              onClick={() => base44.auth.redirectToLogin(`${window.location.origin}/ReferralLanding?ref=${refCode}`)}
            >
              Criar conta gratuitamente
            </Button>
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" className="w-full mt-2 text-slate-500">
                Conhecer o clube primeiro
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}