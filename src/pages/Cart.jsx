import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart, Tag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import VoucherModal from '@/components/voucher/VoucherModal';
import EntrepreneurVoucherModal from '@/components/voucher/EntrepreneurVoucherModal';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
        const subs = await base44.entities.Subscription.filter({ user_email: u.email, type: 'user' });
        if (subs.length > 0) {
          const sub = subs[0];
          setSubscription({ ...sub, status: new Date(sub.expires_at) < new Date() ? 'expired' : sub.status });
        }
      }
    };
    load();
  }, []);

  const handleBuy = (item) => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (!subscription || subscription.status !== 'active') {
      window.location.href = createPageUrl('Subscription'); return;
    }
    setSelectedProduct(item.product);
    setSelectedPartner(item.partner);
    setVoucherModalOpen(true);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 px-4">
        <ShoppingCart className="w-20 h-20 text-slate-200" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700 mb-2">Seu carrinho está vazio</h2>
          <p className="text-slate-400">Adicione produtos para continuar</p>
        </div>
        <Link to={createPageUrl('Home')}>
          <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Explorar produtos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Meu Carrinho</h1>
            <p className="text-slate-500 text-sm">{totalItems} item{totalItems !== 1 ? 's' : ''} adicionado{totalItems !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {items.map(({ product, partner, quantity }) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex gap-4">
              {/* Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">{partner?.business_name}</p>
                <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-2">{product.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-emerald-600">
                    R$ {(product.discount_price * quantity).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    R$ {product.original_price?.toFixed(2).replace('.', ',')} /un
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-rose-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3 text-slate-600" />
                  </button>
                  <span className="w-5 text-center font-bold text-slate-800 text-sm">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3 text-slate-600" />
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleBuy({ product, partner, quantity })}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 text-xs h-7 px-3"
                >
                  Resgatar
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Resumo</h2>
          <div className="space-y-2 mb-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm text-slate-600">
                <span className="truncate mr-4">{product.name} × {quantity}</span>
                <span className="font-medium text-slate-800">R$ {(product.discount_price * quantity).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between items-center">
            <span className="font-bold text-slate-900">Total estimado</span>
            <span className="text-xl font-extrabold text-emerald-600">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">* Cada item gera um voucher individual para resgatar no parceiro.</p>
        </div>
      </div>

      {selectedPartner?.partner_type === 'empreendedor' ? (
        <EntrepreneurVoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={selectedPartner}
          user={user}
          onSuccess={() => {}}
        />
      ) : (
        <VoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={selectedPartner}
          user={user}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}