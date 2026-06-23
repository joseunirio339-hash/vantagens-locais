import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag, Sparkles, Shield, Zap, BadgeCheck, TrendingUp,
  Store, Tag, ArrowRight, Star, ChevronRight, Gift, CreditCard,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';

export default function RepresentativeLanding() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const [rep, setRep] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadRep = async () => {
      const reps = await base44.entities.Representative.filter({ code: code?.toUpperCase(), is_active: true });
      if (reps.length > 0) {
        setRep(reps[0]);
        // Track visit
        base44.analytics.track({ eventName: 'rep_landing_visit', properties: { rep_code: code, rep_name: reps[0].name } });
      } else {
        setNotFound(true);
      }
    };
    if (code) loadRep();
  }, [code]);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['rep-products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['rep-partners'],
    queryFn: () => base44.entities.Partner.filter({ subscription_status: 'active' }),
  });

  const featuredProducts = products.slice(0, 6);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Link não encontrado</h1>
          <p className="text-slate-500 mb-6">Este link de representante é inválido ou foi desativado. Entre em contato com quem te enviou.</p>
          <Link to="/">
            <Button>Ir para o Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const repCheckoutUrl = (type) => {
    // Passa o código do representante como param na URL de assinatura
    return `${createPageUrl('Subscription')}?rep=${rep.code}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-white text-sm font-medium">👋 Apresentado por {rep.name}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
            Economize em todas as suas compras com o Clube Max 🎯
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            Descontos de até <strong className="text-white">70% OFF</strong> em restaurantes, lojas, serviços e muito mais.
            Ative agora e comece a economizar!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to={repCheckoutUrl('user')}>
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-lg text-base px-8 w-full sm:w-auto">
                Quero Economizar Agora <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-white/60 text-sm">1º mês grátis · Cancele quando quiser</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Store, title: '100+ Lojas', desc: 'Comércios locais' },
            { icon: Zap, title: 'Ativação Rápida', desc: 'Pelo CPF em segundos' },
            { icon: BadgeCheck, title: 'Ofertas Verificadas', desc: 'Descontos reais' },
            { icon: Gift, title: '1º Mês Grátis', desc: 'Sem compromisso' },
          ].map((item, i) => (
            <Card key={i} className="text-center border-slate-200">
              <CardContent className="p-4">
                <item.icon className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">{item.title}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Products Showcase */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              🛍️ Exemplos de Ofertas Disponíveis
            </h2>
            <p className="text-slate-500">Veja alguns dos descontos que você encontra no Clube Max</p>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featuredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  partner={partners.find(p => p.id === product.partner_id)}
                  onClick={() => {}}
                  isFavorite={false}
                  onToggleFavorite={null}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-slate-400 text-sm mb-3">
              Estas são apenas amostras. Assine e tenha acesso a <strong className="text-slate-600">todas as ofertas</strong>!
            </p>
            <Link to={repCheckoutUrl('user')}>
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
                Ativar Minha Assinatura <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Partners */}
        <section className="mb-12">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4 text-center">🏪 Lojas Parceiras</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {partners.slice(0, 8).map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 text-center">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.business_name} className="w-12 h-12 rounded-full object-cover mx-auto mb-2" />
                  ) : (
                    <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Store className="w-6 h-6 text-violet-500" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-slate-700 truncate">{p.business_name}</p>
                  <p className="text-xs text-slate-400 truncate">{p.city || p.neighborhood || ''}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section>
          <div className="relative overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}>
            <div className="px-8 py-10 text-center relative">
              <h3 className="text-2xl font-black text-white mb-3">
                Pronto para economizar? 🚀
              </h3>
              <p className="text-white/80 mb-6 max-w-md mx-auto">
                Ative sua assinatura agora e comece a usar descontos exclusivos em centenas de lojas parceiras.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to={repCheckoutUrl('user')}>
                  <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-lg px-8">
                    Começar Agora
                  </Button>
                </Link>
              </div>
              <p className="text-white/50 text-xs mt-4">
                💬 Dúvidas? Fale com {rep.name}{rep.phone ? `: ${rep.phone}` : ''}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-center py-6">
        <p className="text-slate-500 text-xs">
          Clube Max Descontos · Vantagens Locais · © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}