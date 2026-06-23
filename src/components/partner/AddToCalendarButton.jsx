import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';

function formatGoogleDate(date) {
  // Google Calendar format: YYYYMMDDTHHMMSSZ
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export default function AddToCalendarButton({ subscription, businessName }) {
  if (!subscription?.expires_at) return null;

  const expiresAt = new Date(subscription.expires_at);
  // Early renewal reminder: ~7 days before expiry
  const reminderDate = new Date(expiresAt);
  reminderDate.setDate(reminderDate.getDate() - 7);
  
  // If already past, use today + 1 as fallback
  const startDate = reminderDate > new Date() ? reminderDate : new Date(Date.now() + 86400000);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  const title = encodeURIComponent(`Renovar assinatura — ${businessName || 'Clube Max Descontos'}`);
  const details = encodeURIComponent(
    `Plano: ${subscription.type?.toUpperCase() || 'Lojista'}\n` +
    `Vencimento: ${expiresAt.toLocaleDateString('pt-BR')}\n` +
    `Valor: R$ ${(subscription.price || 0).toFixed(2).replace('.', ',')}\n\n` +
    `Acesse o Clube Max Descontos para renovar.`
  );
  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;

  return (
    <a href={googleUrl} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50">
        <CalendarPlus className="w-4 h-4" />
        Adicionar renovação ao Google Calendar
      </Button>
    </a>
  );
}