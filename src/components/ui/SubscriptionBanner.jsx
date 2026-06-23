import React from 'react';
import { AlertTriangle, CreditCard, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function formatGoogleDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export default function SubscriptionBanner({ type, status, expiresAt, businessName }) {
  if (status === 'active') return null;

  const isExpired = status === 'expired';
  const price = type === 'partner' ? 'R$ 149,99' : 'R$ 4,99';
  const period = 'mês';

  // Google Calendar link for renewal reminder
  const getCalendarUrl = () => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const reminderDate = new Date(expiry);
    reminderDate.setDate(reminderDate.getDate() - 7);
    const startDate = reminderDate > new Date() ? reminderDate : new Date(Date.now() + 86400000);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
    const title = encodeURIComponent(`Renovar assinatura — ${businessName || 'Clube Max Descontos'}`);
    const details = encodeURIComponent(`Plano: ${type?.toUpperCase() || 'Parceiro'}\nVencimento: ${expiry.toLocaleDateString('pt-BR')}\n\nAcesse o Clube Max Descontos para renovar.`);
    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl mb-6 shadow-lg">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="p-2 bg-white/20 rounded-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="font-semibold">
            {isExpired ? 'Assinatura Expirada' : 'Ative sua Assinatura'}
          </h3>
          <p className="text-sm text-white/90">
            {isExpired 
              ? 'Renove para continuar utilizando todos os benefícios' 
              : 'Assine para ter acesso completo aos descontos'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {expiresAt && (
            <a href={getCalendarUrl()} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/20 bg-transparent font-medium">
                <CalendarPlus className="w-4 h-4 mr-2" />
                Adicionar ao Calendário
              </Button>
            </a>
          )}
          <Link to={createPageUrl('Subscription')}>
            <Button className="bg-white text-orange-600 hover:bg-white/90 font-semibold">
              <CreditCard className="w-4 h-4 mr-2" />
              {price}/{period}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}