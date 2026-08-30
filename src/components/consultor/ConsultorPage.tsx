import React from 'react';
import { Award, ShieldCheck, TrendingUp } from 'lucide-react';

export const ConsultorPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Consultoria Financeira</h2>
        <p className="text-xs text-slate-400">Acompanhamento e suporte com seu planejador financeiro</p>
      </div>

      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Consultoria PlannerFin Ativa</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Seu painel financeiro está sincronizado e integrado ao seu assistente de inteligência artificial no WhatsApp.
        </p>
      </div>
    </div>
  );
};
