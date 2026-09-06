import React from 'react';
import { Sparkles, CheckCircle2, Zap, ArrowRight, Layers } from 'lucide-react';
import { ReleaseHighlight, groupReleaseHighlights } from '../../data/releases';

interface ReleaseLogViewProps {
  highlights: ReleaseHighlight[];
  compact?: boolean;
}

export const ReleaseLogView: React.FC<ReleaseLogViewProps> = ({ highlights, compact = false }) => {
  const grouped = groupReleaseHighlights(highlights);

  const sections = [
    {
      id: 'features',
      label: 'Novas Funcionalidades',
      items: grouped.features,
      icon: Sparkles,
      colorBadge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      dotColor: 'bg-purple-500',
      iconColor: 'text-purple-500',
    },
    {
      id: 'fixes',
      label: 'Correções & Fixes',
      items: grouped.fixes,
      icon: CheckCircle2,
      colorBadge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dotColor: 'bg-rose-500',
      iconColor: 'text-rose-500',
    },
    {
      id: 'improvements',
      label: 'Melhorias & Otimizações',
      items: grouped.improvements,
      icon: Zap,
      colorBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dotColor: 'bg-emerald-500',
      iconColor: 'text-emerald-500',
    },
  ].filter(sec => sec.items.length > 0);

  if (sections.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">
        Nenhum item discriminado para esta versão.
      </p>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {sections.map(sec => {
          const Icon = sec.icon;
          return (
            <div key={sec.id} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                <Icon className={`w-3.5 h-3.5 ${sec.iconColor}`} />
                <span className="text-slate-800 dark:text-slate-200">{sec.label}</span>
              </div>
              <ul className="space-y-1 pl-1 text-[11px] text-slate-600 dark:text-slate-300">
                {sec.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${sec.dotColor} mt-1.5 shrink-0`} />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">{item.title}:</strong>{' '}
                      <span className="text-slate-500 dark:text-slate-400">{item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map(sec => {
        const Icon = sec.icon;
        return (
          <div
            key={sec.id}
            className="rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${sec.colorBadge} flex items-center justify-center border`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h6 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {sec.label}
                </h6>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {sec.items.length} {sec.items.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Items Grid / List */}
            <div className="space-y-2.5">
              {sec.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-slate-800/60 text-xs flex items-start gap-3 shadow-xs"
                >
                  <div className={`w-2 h-2 rounded-full ${sec.dotColor} mt-1.5 shrink-0`} />
                  <div className="space-y-0.5 min-w-0">
                    <h6 className="font-black text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </h6>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
