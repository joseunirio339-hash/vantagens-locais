import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BadgeCard({ badge, locked = false }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex flex-col items-center gap-1 cursor-default ${locked ? 'opacity-30 grayscale' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 transition-all
              ${locked ? 'bg-slate-100 border-slate-200' : 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200 hover:scale-110'}`}>
              {badge.badge_icon || '🏅'}
            </div>
            <p className={`text-xs font-medium text-center leading-tight max-w-[64px] truncate ${locked ? 'text-slate-400' : 'text-slate-700'}`}>
              {badge.badge_name}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs max-w-[180px] text-center">
            <p className="font-semibold">{badge.badge_icon} {badge.badge_name}</p>
            {badge.description && <p className="text-slate-400 mt-0.5">{badge.description}</p>}
            {!locked && badge.created_date && (
              <p className="text-slate-400 mt-0.5">
                Conquistado em {format(new Date(badge.created_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
            {locked && <p className="text-slate-400 mt-0.5">Ainda não conquistado</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}