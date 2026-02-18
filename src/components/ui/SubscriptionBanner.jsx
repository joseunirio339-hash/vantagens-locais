import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionBanner({ type, status, expiresAt }) {
  if (status === 'active') return null;

  const isExpired = status === 'expired';
  const price = type === 'partner' ? 'R$ 149,99' : 'R$ 4,99';
  const period = 'mês';

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl mb-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">
            {isExpired ? 'Assinatura Expirada' : 'Ative sua Assinatura'}
          </h3>
          <p className="text-sm text-white/90">
            {isExpired 
              ? 'Renove para continuar utilizando todos os benefícios' 
              : 'Assine para ter acesso completo aos descontos'}
          </p>
        </div>
        <Link to={createPageUrl('Subscription')}>
          <Button className="bg-white text-orange-600 hover:bg-white/90 font-semibold">
            <CreditCard className="w-4 h-4 mr-2" />
            {price}/{period}
          </Button>
        </Link>
      </div>
    </div>
  );
}