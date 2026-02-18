import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Store, Tag, ChevronRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import PartnerCard from '@/components/partners/PartnerCard';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import VoucherModal from '@/components/voucher/VoucherModal';

export default function Home() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const subs = await base44.entities.Subscription.filter({
          user_email: currentUser.email,
          type: 'user'
        });
        if (subs.length > 0) {
          const sub = subs[0];
          const isExpired = new Date(sub.expires_at) < new Date();
          setSubscription({
            ...sub,
            status: isExpired ? 'expired' : sub.status
          });
        }
      }
    };
    loadUser();
  }, []);

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.filter({ subscription_status: 'active' })
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true })
  });

  const activePartnerIds = partners.map(p => p.id);
  const activeProducts = products.filter(p => activePartnerIds.includes(p.partner_id));

  const filteredProducts = activeProducts.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredProducts = [...activeProducts]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 6);

  const handleProductClick = async (product) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!subscription || subscription.status !== 'active') {
      window.location.href = createPageUrl('Subscription');
      return;
    }

    const partner = partners.find(p => p.id === product.partner_id);
    setSelectedProduct(product);
    setSelectedPartner(partner);
    setVoucherModalOpen(true);

    // Register view
    await base44.entities.ProductView.create({
      product_id: product.id,
      partner_id: product.partner_id,
      user_email: user.email
    });

    await base44.entities.Product.update(product.id, {
      views_count: (product.views_count || 0) + 1
    });
  };

  const getProductCount = (partnerId) => {
    return products.filter(p => p.partner_id === partnerId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Descontos exclusivos</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Economize no comércio local
            </h1>
            <p className="text-lg text-emerald-100 max-w-xl mx-auto">
              Descubra ofertas incríveis dos melhores estabelecimentos da sua região
            </p>
          </div>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar produtos ou lojas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-0 shadow-lg text-slate-800"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {user && (
          <SubscriptionBanner
            type="user"
            status={subscription?.status}
            expiresAt={subscription?.expires_at}
          />
        )}

        {/* Featured Products */}
        {!searchTerm && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Em Alta</h2>
                <p className="text-slate-500">Produtos mais acessados</p>
              </div>
              <Link to={createPageUrl('Products')}>
                <Button variant="ghost" className="text-emerald-600">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    partner={partners.find(p => p.id === product.partner_id)}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Search Results */}
        {searchTerm && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Resultados para "{searchTerm}"
            </h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    partner={partners.find(p => p.id === product.partner_id)}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Partners */}
        {!searchTerm && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Parceiros</h2>
                <p className="text-slate-500">Lojas com descontos exclusivos</p>
              </div>
              <Link to={createPageUrl('Partners')}>
                <Button variant="ghost" className="text-emerald-600">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {loadingPartners ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {partners.slice(0, 4).map(partner => (
                  <Link key={partner.id} to={createPageUrl(`PartnerStore?id=${partner.id}`)}>
                    <PartnerCard
                      partner={partner}
                      productCount={getProductCount(partner.id)}
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <VoucherModal
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        product={selectedProduct}
        partner={selectedPartner}
        user={user}
        onSuccess={() => {}}
      />
    </div>
  );
}