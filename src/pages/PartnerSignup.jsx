import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Store, CheckCircle, Loader2, ArrowRight, User, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORIES = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'moda', label: 'Moda' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'beleza', label: 'Beleza' },
  { value: 'saude', label: 'Saúde' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'doceria', label: 'Doceria' },
  { value: 'hamburgueria', label: 'Hamburgueria' },
  { value: 'trailer_food', label: 'Trailer Food' },
  { value: 'artesanato', label: 'Artesanato' },
  { value: 'confeitaria', label: 'Confeitaria' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'costura', label: 'Costura' },
  { value: 'outros', label: 'Outros' },
];

export default function PartnerSignup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyPartner, setAlreadyPartner] = useState(false);

  const [form, setForm] = useState({
    partner_type: 'lojista',
    business_name: '',
    category: '',
    description: '',
    phone: '',
    whatsapp_business_number: '',
    address: '',
    cep: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      const me = await base44.auth.me();
      setUser(me);

      // Verifica se já é parceiro
      const existing = await base44.entities.Partner.filter({ owner_email: me.email });
      if (existing.length > 0) setAlreadyPartner(true);

      setLoading(false);
    };
    init();
  }, []);

  const handleCep = async (cep) => {
    const clean = cep.replace(/\D/g, '');
    setForm(f => ({ ...f, cep: clean }));
    if (clean.length === 8) {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          address: data.logradouro || f.address,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_name || !form.category) {
      toast.error('Preencha o nome do negócio e a categoria.');
      return;
    }
    setSubmitting(true);

    await base44.entities.Partner.create({
      ...form,
      owner_email: user.email,
      subscription_status: 'pending',
    });

    toast.success('Cadastro enviado com sucesso!');
    setDone(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (alreadyPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Você já é parceiro!</h2>
          <p className="text-slate-500 mb-6">Seu estabelecimento já está cadastrado na plataforma.</p>
          <Link to={createPageUrl('PartnerDashboard')}>
            <Button className="w-full bg-violet-600 hover:bg-violet-700">
              Ir para o Painel do Parceiro
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Negócio cadastrado!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Seu estabelecimento foi registrado com sucesso. <br />
            <strong className="text-slate-700">Agora escolha seu plano</strong> para ativar sua vitrine e começar a atrair clientes.
          </p>
          <div className="space-y-3">
            <Link to={createPageUrl('Subscription')}>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base h-12">
                Escolher Plano <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('PartnerDashboard')}>
              <Button variant="outline" className="w-full">
                Ir para o Painel
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Seja um Parceiro</h1>
          <p className="text-slate-500 mt-2">Cadastre seu negócio e comece a oferecer descontos exclusivos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Parceiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-violet-600" />
                Tipo de Negócio
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { value: 'lojista', label: 'Lojista', desc: 'Com CNPJ' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, partner_type: opt.value }))}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    form.partner_type === opt.value
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-violet-300'
                  }`}
                >
                  <p className="font-semibold text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Informações do Negócio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="w-4 h-4 text-violet-600" />
                Informações do Negócio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome do Negócio *</Label>
                <Input
                  placeholder="Ex: Pizzaria Boa Vida"
                  value={form.business_name}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Conte um pouco sobre seu negócio..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="w-4 h-4 text-violet-600" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>WhatsApp Business</Label>
                <Input
                  placeholder="5511999999999 (com DDI e DDD)"
                  value={form.whatsapp_business_number}
                  onChange={e => setForm(f => ({ ...f, whatsapp_business_number: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-violet-600" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={e => handleCep(e.target.value)}
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    placeholder="UF"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <Label>Endereço</Label>
                <Input
                  placeholder="Rua, número"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    placeholder="Bairro"
                    value={form.neighborhood}
                    onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Cidade"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 text-base bg-violet-600 hover:bg-violet-700"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            Cadastrar Meu Negócio
          </Button>
        </form>
      </div>
    </div>
  );
}