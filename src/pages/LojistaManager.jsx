import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import {
  Plus, Pencil, Trash2, Image, Package, Loader2,
  Tag, Calendar, ToggleLeft, ToggleRight, Store, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'alimentacao', label: '🍽️ Alimentação' },
  { value: 'moda', label: '👗 Moda' },
  { value: 'eletronicos', label: '📱 Eletrônicos' },
  { value: 'beleza', label: '💅 Beleza' },
  { value: 'saude', label: '🏥 Saúde' },
  { value: 'mercado', label: '🛒 Mercado' },
  { value: 'servicos', label: '🔧 Serviços' },
  { value: 'lazer', label: '🎭 Lazer' },
  { value: 'outros', label: '📦 Outros' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  image_url: '',
  category: '',
  original_price: '',
  discount_price: '',
  coupon_expires_at: '',
  is_active: true,
};

function ProductFormDialog({ open, onClose, editingProduct, partner, onSaved }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        image_url: editingProduct.image_url || '',
        category: editingProduct.category || '',
        original_price: editingProduct.original_price?.toString() || '',
        discount_price: editingProduct.discount_price?.toString() || '',
        coupon_expires_at: editingProduct.coupon_expires_at || '',
        is_active: editingProduct.is_active !== false,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [editingProduct, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image_url: file_url }));
    setUploadingImage(false);
    toast.success('Imagem enviada!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.original_price || !formData.discount_price) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const original = parseFloat(formData.original_price);
    const discount = parseFloat(formData.discount_price);
    if (discount >= original) {
      toast.error('O preço com desconto deve ser menor que o original');
      return;
    }

    setLoading(true);
    const productData = {
      partner_id: partner.id,
      name: formData.name,
      description: formData.description,
      image_url: formData.image_url,
      category: formData.category || undefined,
      original_price: original,
      discount_price: discount,
      discount_percentage: Math.round(((original - discount) / original) * 100),
      coupon_expires_at: formData.coupon_expires_at || undefined,
      is_active: formData.is_active,
    };

    if (editingProduct) {
      await base44.entities.Product.update(editingProduct.id, productData);
      toast.success('Produto atualizado!');
    } else {
      await base44.entities.Product.create(productData);
      toast.success('Produto cadastrado!');
    }

    setLoading(false);
    onSaved();
    onClose();
  };

  const discountPct =
    formData.original_price && formData.discount_price
      ? Math.round(
          ((parseFloat(formData.original_price) - parseFloat(formData.discount_price)) /
            parseFloat(formData.original_price)) *
            100
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Editar Desconto' : 'Novo Desconto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Foto do Produto</Label>
            <div
              className="relative w-full aspect-video rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 hover:border-violet-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('lojista-image-input').click()}
            >
              {formData.image_url ? (
                <>
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium text-sm flex items-center gap-2">
                      <Image className="w-4 h-4" /> Trocar foto
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  {uploadingImage ? (
                    <Loader2 className="w-10 h-10 text-slate-400 mx-auto animate-spin" />
                  ) : (
                    <>
                      <Image className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">Clique para adicionar foto</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG até 5MB</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              id="lojista-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="lm-name">Nome do Produto / Oferta *</Label>
            <Input
              id="lm-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Combo Hambúrguer + Refri"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="lm-description">Descrição da Oferta</Label>
            <Textarea
              id="lm-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os detalhes do desconto, condições, restrições..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lm-original">Preço Original (R$) *</Label>
              <Input
                id="lm-original"
                type="number"
                step="0.01"
                min="0"
                value={formData.original_price}
                onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lm-discount">Preço com Desconto (R$) *</Label>
              <Input
                id="lm-discount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount_price}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_price: e.target.value }))}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          {discountPct !== null && !isNaN(discountPct) && discountPct > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <span className="text-emerald-700 font-bold text-lg">{discountPct}% de desconto</span>
            </div>
          )}

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="lm-expires" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Validade do Cupom
            </Label>
            <Input
              id="lm-expires"
              type="date"
              value={formData.coupon_expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, coupon_expires_at: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-slate-400">Deixe em branco para sem validade definida</p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <Label htmlFor="lm-active">Oferta Ativa</Label>
              <p className="text-xs text-slate-400">Visível para os clientes no app</p>
            </div>
            <Switch
              id="lm-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProduct ? 'Salvar Alterações' : 'Cadastrar Desconto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductRow({ product, onEdit, onDelete, onToggle }) {
  const isExpired = product.coupon_expires_at && new Date(product.coupon_expires_at) < new Date();
  const catLabel = CATEGORIES.find(c => c.value === product.category)?.label;

  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-2xl hover:shadow-sm transition-all">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package className="w-7 h-7 text-slate-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
          {!product.is_active && (
            <Badge variant="secondary" className="text-xs">Inativo</Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-xs">Expirado</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-sm text-slate-400 line-through">R$ {product.original_price?.toFixed(2)}</span>
          <span className="text-sm font-bold text-emerald-600">R$ {product.discount_price?.toFixed(2)}</span>
          <Badge className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
            -{product.discount_percentage}%
          </Badge>
          {catLabel && (
            <span className="text-xs text-slate-400">{catLabel}</span>
          )}
          {product.coupon_expires_at && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              até {new Date(product.coupon_expires_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onToggle(product)}
          title={product.is_active ? 'Desativar' : 'Ativar'}
          className="text-slate-500 hover:text-violet-600"
        >
          {product.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onEdit(product)} title="Editar">
          <Pencil className="w-4 h-4 text-slate-500" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(product.id)} title="Excluir" className="text-red-400 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function LojistaManager() {
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('LojistaManager'));
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check partner plan subscription
      const subs = await base44.entities.Subscription.filter({
        user_email: currentUser.email,
        type: 'partner',
        status: 'active'
      });

      if (subs.length === 0) {
        setLoading(false);
        return;
      }

      setSubscription(subs[0]);

      const partners = await base44.entities.Partner.filter({ owner_email: currentUser.email });
      if (partners.length > 0) setPartner(partners[0]);

      setLoading(false);
    };
    init();
  }, []);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['lojistaProducts', partner?.id],
    queryFn: () => base44.entities.Product.filter({ partner_id: partner.id }),
    enabled: !!partner?.id,
  });

  const handleDelete = async (productId) => {
    if (!confirm('Deseja excluir este desconto?')) return;
    await base44.entities.Product.delete(productId);
    toast.success('Desconto removido');
    queryClient.invalidateQueries(['lojistaProducts']);
  };

  const handleToggle = async (product) => {
    await base44.entities.Product.update(product.id, { is_active: !product.is_active });
    toast.success(product.is_active ? 'Oferta desativada' : 'Oferta ativada');
    queryClient.invalidateQueries(['lojistaProducts']);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // No active lojista subscription
  if (!subscription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8">
          <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Plano Lojista Necessário</h2>
          <p className="text-slate-500 mb-6">
            Para cadastrar descontos você precisa ter uma assinatura ativa do Plano Lojista.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Subscription')}
            className="bg-violet-600 hover:bg-violet-700 w-full"
          >
            Ver Planos
          </Button>
        </Card>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.is_active);
  const expiredProducts = products.filter(p => p.coupon_expires_at && new Date(p.coupon_expires_at) < new Date());

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Gestão de Descontos</h1>
                <p className="text-slate-500 text-sm">
                  {partner?.business_name || 'Meu Negócio'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleNewProduct}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Desconto
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{products.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total de Ofertas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{activeProducts.length}</p>
              <p className="text-xs text-slate-500 mt-1">Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{expiredProducts.length}</p>
              <p className="text-xs text-slate-500 mt-1">Expiradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription status badge */}
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            Plano Lojista ativo — válido até{' '}
            <strong>{new Date(subscription.expires_at).toLocaleDateString('pt-BR')}</strong>
          </span>
        </div>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-violet-600" />
              Seus Descontos ({products.length}/20)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-14">
                <Package className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhum desconto cadastrado ainda</p>
                <p className="text-sm text-slate-400 mb-6">Adicione sua primeira oferta para atrair clientes</p>
                <Button onClick={handleNewProduct} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" /> Cadastrar Primeiro Desconto
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map(product => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProductFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        editingProduct={editingProduct}
        partner={partner}
        onSaved={() => queryClient.invalidateQueries(['lojistaProducts'])}
      />
    </div>
  );
}