import React from 'react';
import { Share2, UserPlus, CreditCard, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Share2,
    color: 'bg-violet-100 text-violet-600',
    title: 'Compartilhe seu link',
    desc: 'Envie seu link único para amigos pelo WhatsApp, redes sociais ou e-mail.',
  },
  {
    icon: UserPlus,
    color: 'bg-fuchsia-100 text-fuchsia-600',
    title: 'Amigo se cadastra',
    desc: 'Seu amigo cria uma conta no Clube Max Descontos usando seu link.',
  },
  {
    icon: CreditCard,
    color: 'bg-pink-100 text-pink-600',
    title: 'Assina um plano',
    desc: 'Quando seu amigo ativar qualquer assinatura paga, a recompensa é liberada.',
  },
  {
    icon: Trophy,
    color: 'bg-amber-100 text-amber-600',
    title: 'Você ganha 100 pontos',
    desc: 'Pontos acumulados que poderão ser trocados por benefícios exclusivos.',
  },
];

export default function HowItWorks() {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <h2 className="font-semibold text-slate-800 mb-4">Como funciona?</h2>
      <div className="space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${step.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">{step.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}