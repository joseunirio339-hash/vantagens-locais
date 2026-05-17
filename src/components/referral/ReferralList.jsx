import React from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  pending:   { label: 'Aguardando assinatura', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Assinatura ativa',      color: 'bg-blue-100 text-blue-700'   },
  rewarded:  { label: 'Recompensado ✓',        color: 'bg-green-100 text-green-700' },
};

export default function ReferralList({ referrals }) {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-violet-500" />
        Seus indicados ({referrals.length})
      </h2>

      {referrals.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Nenhum indicado ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Compartilhe seu link e comece a ganhar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => {
            const cfg = statusConfig[r.status] || statusConfig.pending;
            return (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{r.referred_email}</p>
                  <p className="text-xs text-slate-400">
                    {r.created_date
                      ? format(new Date(r.created_date), "d 'de' MMM yyyy", { locale: ptBR })
                      : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {r.points_earned > 0 && (
                    <p className="text-xs text-amber-600 font-semibold mt-1">+{r.points_earned} pts</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}