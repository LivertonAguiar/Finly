import React, { useState } from 'react';
import {
  Target,
  CreditCard,
  TrendingUp,
  FolderTree,
  Upload,
  Download,
  Bot,
  Users,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

interface MorePageProps {
  setActiveTab: (tab: string) => void;
  onOpenPwaModal?: () => void;
}

export const MorePage: React.FC<MorePageProps> = ({ setActiveTab, onOpenPwaModal }) => {
  const { exportBackupJSON, user } = useFinancial();
  const [segmentedTab, setSegmentedTab] = useState<'GERAL' | 'GERENCIAR' | 'SOBRE'>('GERAL');

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Mais opções</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ferramentas adicionais, gestão de categorias, automações e suporte
        </p>
      </div>

      {/* Segmented Switcher */}
      <div className="p-1 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-xs">
        {(['GERAL', 'GERENCIAR', 'SOBRE'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setSegmentedTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              segmentedTab === tab
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List Container */}
      <div className="rounded-3xl bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        {/* ABA GERAL */}
        {segmentedTab === 'GERAL' && (
          <>
            {onOpenPwaModal && (
              <button
                onClick={onOpenPwaModal}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">Instalar Aplicativo (PWA)</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Instalar no Celular (Android/iOS) ou no PC/Mac</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            <button
              onClick={() => setActiveTab('metas')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Objetivos & Metas</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Sonhos, reservas de emergência e prazos</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('dividas')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Dívidas & Empréstimos</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Controle de parcelamentos, juros e amortizações</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('investimentos')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Investimentos & Patrimônio</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ações, FIIs, Renda Fixa e rendimentos</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Assistente WhatsApp (IA)</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Lançamentos via áudio, comprovantes e fotos</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Skills Financeiras de IA</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Automações, milhas e otimização tributária</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </>
        )}

        {/* ABA GERENCIAR */}
        {segmentedTab === 'GERENCIAR' && (
          <>
            <button
              onClick={() => setActiveTab('cadastro')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Categorias & Tags</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Personalizar categorias pai e subcategorias</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('familia')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Finanças da Família</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Compartilhar controle com múltiplos membros</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={exportBackupJSON}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Exportar Backup Completo</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Salvar cópia de segurança em arquivo JSON</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </>
        )}

        {/* ABA SOBRE */}
        {segmentedTab === 'SOBRE' && (
          <div className="p-6 space-y-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                P
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">PlannerFin Web</h4>
                <p>Versão 2.174.0 (Mobills Edition)</p>
              </div>
            </div>

            <p>
              Plataforma financeira desenvolvida para controle de orçamento, fluxo de caixa, cartões e patrimônio.
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Central de Ajuda:</span>
                <span className="text-purple-600 dark:text-purple-400">help.plannerfin.com</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Criptografia:</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AES-256 / SSL Seguro
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
