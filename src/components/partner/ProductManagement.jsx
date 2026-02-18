import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Image, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ProductCard from '@/components/products/ProductCard';

export default function ProductManagement({ partner, products, isBlocked, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    original_price: '',
    discount_price: '',
    is_active: true
  });

  const MAX_PRODUCTS = 20;
  const canAddMore = products.length < MAX_PRODUCTS;

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      original_price: '',
      discount_price: '',
      is_active: true
    });
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      image_url: product.image_url || '',
      original_price: product.original_price?.toString() || '',
      discount_price: product.discount_price?.toString() || '',
      is_active: product.is_active !== false
    });
    setShowForm(true);
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
      toast.error('O preço com desconto deve ser menor que o preço original');
      return;
    }

    setLoading(true);

    const productData = {
      partner_id: partner.id,
      name: formData.name,
      description: formData.description,
      image_url: formData.image_url,
      original_price: original,
      discount_price: discount,
      discount_percentage: Math.round(((original - discount) / original) * 100),
      is_active: formData.is_active
    };

    if (editingProduct) {
      await base44.entities.Product.update(editingProduct.id, productData);
      toast.success('Produto atualizado com sucesso!');
    } else {
      await base44.entities.Product.create(productData);
      toast.success('Produto cadastrado com sucesso!');
    }

    setLoading(false);
    setShowForm(false);
    resetForm();
    onUpdate();
  };

  const handleDelete = async (productId) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    await base44.entities.Product.delete(productId);
    toast.success('Produto excluído');
    onUpdate();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image_url: file_url }));
    setLoading(false);
    toast.success('Imagem enviada!');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Produtos ({products.length}/{MAX_PRODUCTS})</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie seus produtos com desconto
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={isBlocked || !canAddMore}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </CardHeader>

      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum produto cadastrado</p>
            <p className="text-sm text-slate-400">Adicione seu primeiro produto com desconto</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} showViews />
                <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8"
                    onClick={() => handleEdit(product)}
                    disabled={isBlocked}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="w-8 h-8"
                    onClick={() => handleDelete(product.id)}
                    disabled={isBlocked}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Foto do Produto</Label>
              <div className="relative w-full aspect-video rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 hover:border-emerald-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('product-image-input').click()}
              >
                {formData.image_url ? (
                  <>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Image className="w-4 h-4" /> Trocar foto
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    {loading ? (
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
                id="product-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Pizza Margherita"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o produto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="original_price">Preço Original (R$) *</Label>
                <Input
                  id="original_price"
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
                <Label htmlFor="discount_price">Preço com Desconto (R$) *</Label>
                <Input
                  id="discount_price"
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

            {formData.original_price && formData.discount_price && (
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <span className="text-emerald-700 font-semibold">
                  Desconto de {Math.round(((parseFloat(formData.original_price) - parseFloat(formData.discount_price)) / parseFloat(formData.original_price)) * 100)}%
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Produto Ativo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingProduct ? (
                  'Salvar Alterações'
                ) : (
                  'Cadastrar Produto'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}