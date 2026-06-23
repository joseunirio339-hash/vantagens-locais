import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Store, CheckCircle, Loader2, ArrowRight, Phone, Mail,
  MapPin, TrendingUp, Users, Tag, Star, MessageCircle, Instagram, Megaphone
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const beneficios = [
  { icon: TrendingUp, title: 'Mais Clientes', desc: 'Seu negócio aparece para centenas de consumidores locais que buscam descontos na plataforma.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Tag, title: 'Divulgação Grátis', desc: 'Crie cupons e ofertas sem custo de anúncio — você só paga a assinatura mensal acessível.', color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: Users, title: 'Fidelização', desc: 'Clientes que usam seus vouchers tendem a voltar mais. Construa relacionamento com sua clientela local.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Star, title: 'Avaliações Reais', desc: 'Receba avaliações autênticas dos seus clientes e destaque seu negócio na plataforma.', color: 'text-amber-600', bg: 'bg-amber-50' },
];

const planos = [
  { nome: 'Empreendedor', preco: 'R$ 29,90/mês', desc: 'Autônomos e microempresas', tag: 'Mais acessível', cor: 'border-amber-300 bg-amber-50', tagCor: 'bg-amber-500' },
  { nome: 'Lojista Parceiro', preco: 'R$ 49,90/mês', desc: 'Estabelecimentos com CNPJ', tag: 'Mais completo', cor: 'border-violet-300 bg-violet-50', tagCor: 'bg-violet-600' },
];

export default function ParceiroContato() {
  const [form, setForm] = useState({ nome: '', negocio: '', telefone: '', cidade: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.telefone || !form.negocio) {
      toast.error('Preencha nome, negócio e telefone.');
      return;
    }
    setEnviando(true);

    await base44.integrations.Core.SendEmail({
      to: 'joseunirio339@gmail.com',
      subject: `[Clube Max] Novo interesse de parceiro: ${form.negocio}`,
      body: `
Novo interesse de lojista parceiro:

Nome: ${form.nome}
Negócio: ${form.negocio}
Telefone: ${form.telefone}
Cidade: ${form.cidade}
Mensagem: ${form.mensagem || '(sem mensagem)'}
      `.trim()
    });

    setEnviado(true);
    setEnviando(false);
    toast.success('Mensagem enviada! Entraremos em contato em breve.');
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-10 shadow-xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Mensagem Recebida! 🎉</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Obrigado pelo interesse! Nossa equipe entrará em contato pelo WhatsApp ou telefone em até <strong>24 horas</strong>.
          </p>
          <div className="space-y-3">
            <Link to={createPageUrl('PartnerSignup')}>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                Já quero me cadastrar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" className="w-full">Voltar ao início</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/30">
            <Megaphone className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-semibold text-white">Oportunidade para seu negócio</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
            Traga seus clientes<br />
            <span className="text-yellow-300">de volta toda semana</span>
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mx-auto mb-8">
            Junte-se ao <strong>Clube Max Descontos</strong> e coloque seu negócio na vitrine digital da sua cidade. 
            Planos a partir de <strong>R$ 29,90/mês</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#contato">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-xl px-8">
                <MessageCircle className="w-5 h-5 mr-2" />
                Fale Conosco Agora
              </Button>
            </a>
            <Link to={createPageUrl('PartnerSignup')}>
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-xl px-8">
                Cadastrar Meu Negócio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Benefícios */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Por que ser parceiro?</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Sua loja conectada a centenas de clientes que querem economizar na sua cidade</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {beneficios.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 ${b.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-7 h-7 ${b.color}`} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Planos */}
      <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Planos Para Parceiros</h2>
            <p className="text-slate-500">Escolha o plano ideal para o seu tipo de negócio</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {planos.map((p, i) => (
              <div key={i} className={`relative bg-white rounded-2xl border-2 p-6 shadow-sm ${p.cor}`}>
                <span className={`absolute -top-3 left-6 ${p.tagCor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {p.tag}
                </span>
                <h3 className="text-xl font-bold text-slate-800 mt-2">{p.nome}</h3>
                <p className="text-slate-500 text-sm mb-4">{p.desc}</p>
                <p className="text-3xl font-black text-slate-800">{p.preco}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-6">Cancele a qualquer momento · Sem taxa de adesão</p>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Como funciona?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: '1', title: 'Cadastre seu negócio', desc: 'Preencha o formulário com os dados do seu estabelecimento. Leva menos de 5 minutos.', icon: Store },
            { num: '2', title: 'Crie seus cupons', desc: 'Adicione produtos com desconto no seu painel. Você controla preços e validades.', icon: Tag },
            { num: '3', title: 'Receba clientes', desc: 'Consumidores assinantes encontram seu negócio e resgatam vouchers diretamente no app.', icon: Users },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-black text-lg">{step.num}</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulário de Contato */}
      <div id="contato" className="bg-white border-t py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Entre em Contato</h2>
            <p className="text-slate-500">Preencha abaixo e nossa equipe entrará em contato em até 24 horas</p>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 font-medium">Seu nome *</Label>
                    <Input
                      placeholder="João Silva"
                      value={form.nome}
                      onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 font-medium">Nome do negócio *</Label>
                    <Input
                      placeholder="Padaria do João"
                      value={form.negocio}
                      onChange={e => setForm(f => ({ ...f, negocio: e.target.value }))}
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 font-medium">WhatsApp / Telefone *</Label>
                    <Input
                      placeholder="(00) 99999-9999"
                      value={form.telefone}
                      onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 font-medium">Cidade</Label>
                    <Input
                      placeholder="Ex: Campos Gerais"
                      value={form.cidade}
                      onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                      className="mt-1.5 h-11"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Mensagem (opcional)</Label>
                  <Textarea
                    placeholder="Conte um pouco sobre seu negócio ou tire suas dúvidas..."
                    value={form.mensagem}
                    onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                    rows={4}
                    className="mt-1.5"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={enviando}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg"
                >
                  {enviando ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="w-5 h-5 mr-2" />
                  )}
                  {enviando ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Canais diretos */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
            <a
              href="https://wa.me/5535988397979"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              <MessageCircle className="w-7 h-7 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">WhatsApp</span>
              <span className="text-xs text-emerald-600">(35) 98839-7979</span>
            </a>
            <a
              href="mailto:clubemaxdescontos@gmail.com"
              className="flex flex-col items-center gap-2 p-4 bg-violet-50 rounded-2xl hover:bg-violet-100 transition-colors border border-violet-200"
            >
              <Mail className="w-7 h-7 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">E-mail</span>
              <span className="text-xs text-violet-600 break-all">clubemax@gmail.com</span>
            </a>
            <a
              href="https://instagram.com/clubemaxdescontos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-pink-50 rounded-2xl hover:bg-pink-100 transition-colors border border-pink-200"
            >
              <Instagram className="w-7 h-7 text-pink-600" />
              <span className="text-sm font-semibold text-pink-700">Instagram</span>
              <span className="text-xs text-pink-600">@clubemaxdescontos</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}