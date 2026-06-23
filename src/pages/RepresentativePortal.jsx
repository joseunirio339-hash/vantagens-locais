import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Store, Tag, Copy, Check, ExternalLink, TrendingUp,
  DollarSign, ShoppingBag, Users, Sparkles, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';

export default function RepresentativePortal() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const [email, setEmail] = useState(emailParam || '');
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const reps = await base44.entities.Representative.filter({ email: email.trim().toLowerCase(), is_active: true });
      if (reps.length > 0) {
        setRep(reps[0]);
      } else {
        setError('Representante não encontrado ou conta inativa. Verifique o email.');
      }
    } catch (e) {
      setError('Erro ao buscar dados. Tente novamente.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (emailParam) handleLogin();
  }, []);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['rep-portal-products', rep?.id],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
    enabled: !!rep,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['rep-portal-partners', rep?.id],
    queryFn: () => base44.entities.Partner.list(),
    enabled: !!rep,
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['rep-commissions', rep?.id],
    queryFn: () => base44.entities.RepresentativeCommission.filter({ representative_id: rep?.id }, '-created_date', 50),
    enabled: !!rep,
  });

  const copyLink = (code) => {
    const link = `https://app.clubemaxdescontos.com.br/rep/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Login screen
  if (!rep) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-violet-600" />
            </div>
            <CardTitle className="text-xl">Portal do Representante</CardTitle>
            <p className="text-sm text-slate-500">Acesse seu painel de vendas e produtos de demonstração</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email cadastrado</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleLogin}
              disabled={!email || loading}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const totalEarned = paidCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalPending = pendingCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/188f1bafc_clubemax.png"
                alt="Clube Max" className="w-8 h-8 rounded-lg" />
            </Link>
            <div>
              <p className="font-bold text-slate-800 text-sm">Portal do Representante</p>
              <p className="text-xs text-slate-500">{rep.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => copyLink(rep.code)}>
              {copiedCode ? <Check className="w-4 h-4 text-emerald-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copiedCode ? 'Copiado!' : 'Copiar Link'}
            </Button>
            <a href={`/rep/${rep.code}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" /> Ver Página
              </Button>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Comissões Recebidas</p>
                <p className="text-lg font-bold text-emerald-600">R$ {totalEarned.toFixed(2).replace('.', ',')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">A Receber</p>
                <p className="text-lg font-bold text-amber-600">R$ {totalPending.toFixed(2).replace('.', ',')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total de Vendas</p>
                <p className="text-lg font-bold text-slate-800">{rep.total_sales || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Seu Link</p>
                <code className="text-sm font-mono text-violet-600">/rep/{rep.code}</code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link e Compartilhamento */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <h3 className="font-semibold text-slate-800 mb-2">🔗 Seu link de vendas</h3>
            <p className="text-sm text-slate-500 mb-3">
              Compartilhe este link com seus clientes. Quando alguém assinar através dele, você recebe <strong>50%</strong> da 1ª mensalidade.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`https://app.clubemaxdescontos.com.br/rep/${rep.code}`}
                className="font-mono text-sm"
              />
              <Button onClick={() => copyLink(rep.code)} variant="outline">
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Produtos de Demonstração */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-violet-600" />
                Produtos para Demonstração
              </h2>
              <p className="text-sm text-slate-500">Mostre estas ofertas para seus clientes</p>
            </div>
            <Badge variant="outline" className="border-violet-300 text-violet-600">
              {products.length} ofertas disponíveis
            </Badge>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(0, 12).map(product => (
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
        </section>

        {/* Histórico de Comissões */}
        {commissions.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">💰 Histórico de Comissões</h2>
            <div className="space-y-2">
              {commissions.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{c.customer_email}</p>
                      <p className="text-xs text-slate-400">Plano: {c.subscription_type} · R$ {c.subscription_price?.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">R$ {c.commission_amount.toFixed(2).replace('.', ',')}</p>
                      <Badge variant={c.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {c.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}