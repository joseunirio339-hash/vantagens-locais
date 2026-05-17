import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Store, Image, Loader2, Save, Calendar, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const categories = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'moda', label: 'Moda' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'beleza', label: 'Beleza' },
  { value: 'saude', label: 'Saúde' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' }
];

export default function PartnerSettings({ partner, subscription, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: partner?.business_name || '',
    description: partner?.description || '',
    logo_url: partner?.logo_url || '',
    category: partner?.category || '',
    address: partner?.address || '',
    cep: partner?.cep || '',
    city: partner?.city || '',
    neighborhood: partner?.neighborhood || '',
    state: partner?.state || '',
    phone: partner?.phone || '',
    whatsapp_business_enabled: partner?.whatsapp_business_enabled || false,
    whatsapp_business_number: partner?.whatsapp_business_number || '',
    lat: partner?.lat || '',
    lng: partner?.lng || ''
  });

  const handleAutoLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData(prev => ({
        ...prev,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }));
      toast.success('Localização obtida com sucesso!');
    }, () => toast.error('Não foi possível obter a localização.'));
  };

  const handleCepBlur = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setCepLoading(true);
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
    if (!data.erro) {
      setFormData(prev => ({
        ...prev,
        address: `${data.logradouro}${data.complemento ? ', ' + data.complemento : ''}`,
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }));
      toast.success('Endereço preenchido automaticamente!');
    } else {
      toast.error('CEP não encontrado.');
    }
    setCepLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, logo_url: file_url }));
    setLoading(false);
    toast.success('Logo enviado!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updated = await base44.entities.Partner.update(partner.id, formData);
    
    setLoading(false);
    toast.success('Configurações salvas!');
    onUpdate(updated);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-violet-600" />
            Informações da Loja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Logo da Loja</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG até 5MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Nome do Comércio</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Nome da sua loja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva sua loja..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep" className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-violet-500" />
                CEP
                {cepLoading && <Loader2 className="w-3 h-3 animate-spin ml-1 text-violet-500" />}
              </Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                onBlur={(e) => handleCepBlur(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
              <p className="text-xs text-slate-400">Digite o CEP para preencher o endereço automaticamente</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço completo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Geolocation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-violet-500" />
                Localização no Mapa (opcional)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  placeholder="Latitude"
                  type="number"
                  step="any"
                />
                <Input
                  value={formData.lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                  placeholder="Longitude"
                  type="number"
                  step="any"
                />
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2 w-full" onClick={handleAutoLocate}>
                <Navigation className="w-3 h-3" />
                Usar minha localização atual
              </Button>
              <p className="text-xs text-slate-400">Preencha para aparecer no mapa interativo de parceiros</p>
            </div>

            {/* WhatsApp Business */}
            <div className={`border-2 rounded-xl p-4 space-y-3 transition-all ${formData.whatsapp_business_enabled ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.whatsapp_business_enabled ? 'bg-green-500' : 'bg-slate-200'}`}>
                    <MessageCircle className={`w-4 h-4 ${formData.whatsapp_business_enabled ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">WhatsApp Business</p>
                    <p className="text-xs text-slate-500">Redirecionar clientes após gerar voucher</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, whatsapp_business_enabled: !prev.whatsapp_business_enabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${formData.whatsapp_business_enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.whatsapp_business_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {formData.whatsapp_business_enabled && (
                <div className="space-y-1">
                  <Label htmlFor="whatsapp_number" className="text-xs text-green-700">Número do WhatsApp Business</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_business_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_business_number: e.target.value.replace(/\D/g, '') }))}
                    placeholder="5511999999999 (com DDI e DDD)"
                    className="border-green-300 focus:ring-green-400"
                  />
                  <p className="text-xs text-green-600">Ex: 5511999999999 — DDI (55) + DDD + número</p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <Badge className={
                subscription?.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-red-100 text-red-700'
              }>
                {subscription?.status === 'active' ? 'Ativo' : 'Expirado'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Plano</span>
              <span className="font-medium">Lojista Parceiro</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Valor</span>
              <span className="font-medium">R$ 149,99 / mês</span>
            </div>

            {subscription?.expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {subscription.status === 'active' ? 'Expira em' : 'Expirou em'}
                </span>
                <span className="font-medium">
                  {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {subscription?.status !== 'active' && (
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              Renovar Assinatura
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}