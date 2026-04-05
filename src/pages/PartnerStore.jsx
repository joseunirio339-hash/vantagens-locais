import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { MapPin, Phone, Tag, ArrowLeft } from 'lucide-react';
import PartnerLocationMap from '@/components/partners/PartnerLocationMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/products/ProductCard';
import VoucherModal from '@/components/voucher/VoucherModal';
import EntrepreneurVoucherModal from '@/components/voucher/EntrepreneurVoucherModal';

const categoryLabels = {
  restaurante: 'Restaurante',
  moda: 'Moda',
  eletronicos: 'Eletrônicos',
  beleza: 'Beleza',
  saude: 'Saúde',
  mercado: 'Mercado',
  servicos: 'Serviços',
  doceria: '🍰 Doceria',
  hamburgueria: '🍔 Hamburgueria',
  trailer_food: '🚚 Trailer / Food Truck',
  artesanato: '🎨 Artesanato',
  confeitaria: '🎂 Confeitaria',
  salgados: '🥟 Salgados',
  costura: '🧵 Costura',
  outros: 'Outros'
};

export default function PartnerStore() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('id');

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

  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.filter({ id: partnerId });
      return partners[0];
    },
    enabled: !!partnerId
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['partnerProducts', partnerId],
    queryFn: () => base44.entities.Product.filter({ partner_id: partnerId, is_active: true }),
    enabled: !!partnerId
  });

  const handleProductClick = async (product) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!subscription || subscription.status !== 'active') {
      window.location.href = createPageUrl('Subscription');
      return;
    }

    setSelectedProduct(product);
    setVoucherModalOpen(true);

    await base44.entities.ProductView.create({
      product_id: product.id,
      partner_id: partnerId,
      user_email: user.email
    });

    await base44.entities.Product.update(product.id, {
      views_count: (product.views_count || 0) + 1
    });
  };

  if (loadingPartner) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <Skeleton className="h-48 rounded-2xl mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Parceiro não encontrado</p>
          <Link to={createPageUrl('Partners')}>
            <Button className="mt-4">Voltar para Parceiros</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link to={createPageUrl('Partners')}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {partner.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.business_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-slate-400">
                  {partner.business_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">
                  {partner.business_name}
                </h1>
                {partner.category && (
                  <Badge variant="secondary">
                    {categoryLabels[partner.category]}
                  </Badge>
                )}
              </div>

              {partner.description && (
                <p className="text-slate-500 mt-2">{partner.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                {partner.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {partner.address}
                  </span>
                )}
                {partner.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {partner.phone}
                  </span>
                )}
              </div>

              <PartnerLocationMap partner={partner} />
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Produtos com Desconto ({products.length})
        </h2>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum produto disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}
      </div>

      {partner?.partner_type === 'empreendedor' ? (
        <EntrepreneurVoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={partner}
          user={user}
          onSuccess={() => {}}
        />
      ) : (
        <VoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={partner}
          user={user}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}