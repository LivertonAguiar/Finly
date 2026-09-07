import React from 'react';
import {
  Monitor,
  CheckCircle2,
  TrendingDown,
  CreditCard,
  Building2,
  Flag,
  BarChart3,
  Calendar,
  Sparkles,
  UploadCloud,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { FinlyLogo } from '../ui/FinlyLogo';
import { GuideStep, HelpGuide } from '../../data/helpCenterData';

interface FinlyWebMockupProps {
  guide: HelpGuide;
  step: GuideStep;
  stepIndex: number;
  onNextStep?: () => void;
}

export const FinlyWebMockup: React.FC<FinlyWebMockupProps> = ({
  guide,
  step,
  stepIndex,
  onNextStep,
}) => {
  const getActiveSidebarItem = () => {
    if (guide.category === 'cartoes' || guide.id === 'como-gerenciar-cartoes-e-faturas') return 'cartoes';
    if (guide.category === 'contas' || guide.id === 'como-importar-extrato-ofx-csv') return 'contas';
    if (guide.category === 'planejamento' || guide.id === 'como-configurar-orcamentos-e-metas') return 'planejamento';
    if (guide.id === 'como-lancar-despesa') return 'dashboard';
    if (guide.category === 'transacoes') return 'transacoes';
    return 'dashboard';
  };

  const activeNav = getActiveSidebarItem();

  const renderDesktopContent = () => {
    // =========================================================================
    // GUIDE 1: COMO LANÇAR DESPESA
    // =========================================================================
    if (guide.id === 'como-lancar-despesa') {
      if (stepIndex === 0) {
        return (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1C1C22] border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Dashboard Principal</span>
                <span className="text-[10px] text-slate-400">• Setembro 2026</span>
              </div>

              <div className="relative">
                <div className="px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-600/40 border-2 border-white/60 animate-pulse">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Nova Transação</span>
                </div>

                <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-600 text-white font-black text-[10px] items-center justify-center shadow-lg">
                    1
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#18181C] border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Saldo Geral</span>
                <div className="text-base font-black text-white mt-0.5">R$ 26.437,90</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#18181C] border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Receitas</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">R$ 12.097,40</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#18181C] border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Despesas</span>
                <div className="text-base font-black text-rose-400 mt-0.5">R$ 7.794,50</div>
              </div>
            </div>
          </div>
        );
      }

      if (stepIndex === 1) {
        return (
          <div className="relative animate-in zoom-in-95 duration-200">
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#1C1C22] border-2 border-purple-500/60 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-white">Nova Transação • Despesa</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 font-bold">Passo 2/4</span>
              </div>

              <div className="relative p-2.5 rounded-xl bg-[#121214] border-2 border-purple-500 text-center">
                <span className="text-[9px] text-slate-400 font-bold block">VALOR</span>
                <div className="text-2xl font-black text-white tracking-tight">R$ 150,00</div>
                <span className="absolute -top-2 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">
                    2
                  </span>
                </span>
              </div>

              <div className="p-2 rounded-xl bg-[#141416] border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Descrição:</span>
                <span className="font-bold text-white text-[11px]">Supermercado Pão de Açúcar</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">Categoria:</span>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="p-1.5 rounded-xl bg-purple-600/30 border border-purple-500 text-purple-300 font-bold text-center flex items-center justify-center gap-1">
                    <span>🛒</span>
                    <span>Alimentação</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-[#141416] border border-slate-800 text-slate-400 text-center flex items-center justify-center gap-1">
                    <span>⛽</span>
                    <span>Transporte</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-[#141416] border border-slate-800 text-slate-400 text-center flex items-center justify-center gap-1">
                    <span>💊</span>
                    <span>Saúde</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (stepIndex === 2) {
        return (
          <div className="relative animate-in slide-in-from-right-2 duration-200">
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#1C1C22] border-2 border-purple-500/60 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black text-white">Forma de Pagamento</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 font-bold">Passo 3/4</span>
              </div>

              <div className="relative p-1 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-1 text-center text-xs font-bold">
                <div className="py-1.5 rounded-lg text-slate-400">
                  Conta Bancária
                </div>
                <div className="py-1.5 rounded-lg bg-purple-600 text-white shadow-md flex items-center justify-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão de Crédito</span>
                </div>

                <span className="absolute -top-2 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">
                    3
                  </span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#121214] border border-purple-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-900/40 text-purple-400 flex items-center justify-center font-black text-[10px]">
                    NU
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px]">Nubank Ultravioleta</div>
                    <div className="text-[9px] text-slate-400">Vencimento: Dia 20 • Fatura Aberta</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">Disp: R$ 3.850,00</span>
              </div>

              <div className="p-2 rounded-xl bg-[#141416] border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Parcelamento:</span>
                <span className="font-bold text-purple-300 text-[11px] px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/40">
                  1x de R$ 150,00 (à vista)
                </span>
              </div>
            </div>
          </div>
        );
      }

      if (stepIndex === 3) {
        return (
          <div className="relative animate-in zoom-in-95 duration-200">
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#1C1C22] border-2 border-emerald-500/60 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black text-white">Revisar e Finalizar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-900/40 text-emerald-300 font-bold">Passo 4/4</span>
              </div>

              <div className="p-3 rounded-xl bg-[#121214] border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center pb-1 border-b border-slate-800/80">
                  <span className="text-[10px] text-slate-400">Valor Final</span>
                  <span className="font-black text-rose-400 text-sm">- R$ 150,00</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 pt-0.5">
                  <div>• Supermercado Pão de Açúcar</div>
                  <div>• Categoria: Alimentação 🛒</div>
                  <div>• Forma: Nubank (1x)</div>
                  <div>• Data: Hoje</div>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/40 border-2 border-white/50">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>SALVAR DESPESA</span>
                </div>

                <span className="absolute -top-1 -right-2 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 text-white font-black text-[10px] items-center justify-center shadow-lg">
                    4
                  </span>
                </span>
              </div>

              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Despesa registrada com sucesso no sistema!</span>
              </div>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 2: COMO GERENCIAR CARTÕES E FATURAS
    // =========================================================================
    if (guide.id === 'como-gerenciar-cartoes-e-faturas') {
      if (stepIndex === 0) {
        return (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">Menu Lateral Desktop: Cartões de Crédito</div>
                <div className="text-[10px] text-slate-400">Clique no item "Cartões de crédito" no menu à esquerda</div>
              </div>
              <div className="relative px-3 py-1.5 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Acessar Cartões</span>
                <span className="absolute -top-2 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">1</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#18181C] border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Faturas Abertas</span>
                <div className="text-base font-black text-white mt-1">R$ 3.935,00</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#18181C] border border-slate-800">
                <span className="text-[10px] text-slate-400">Limite Total Disponível</span>
                <div className="text-base font-black text-emerald-400 mt-1">R$ 35.149,20</div>
              </div>
            </div>
          </div>
        );
      }

      if (stepIndex === 1) {
        return (
          <div className="space-y-3 animate-in slide-in-from-right-2 duration-200">
            <div className="relative p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border-2 border-purple-500/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">Nubank Ultravioleta</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 font-mono text-[9px]">•••• 8821</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">Fatura Aberta</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-[10px]">
                <div>
                  <span className="text-slate-400 block">Fatura Atual:</span>
                  <span className="text-sm font-black text-white">R$ 1.150,00</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Melhor Dia de Compra:</span>
                  <span className="font-bold text-emerald-400">Dia 14 (Fechamento)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Vencimento:</span>
                  <span className="font-bold text-slate-200">Dia 20</span>
                </div>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '30%' }} />
              </div>

              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">2</span>
              </span>
            </div>
          </div>
        );
      }

      if (stepIndex === 2) {
        return (
          <div className="relative space-y-2 animate-in slide-in-from-right-2 duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-white pb-1 border-b border-slate-800">
              <span>Lançamentos da Fatura • Nubank Ultravioleta</span>
              <span className="text-purple-400 font-mono">Total: R$ 1.150,00</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-xl bg-[#1C1C22] border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-[11px]">Supermercado Pão de Açúcar</div>
                  <div className="text-[9px] text-slate-400">12/09 • Alimentação • 1x</div>
                </div>
                <span className="font-black text-rose-400 text-xs">R$ 342,50</span>
              </div>

              <div className="p-2 rounded-xl bg-[#1C1C22] border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-[11px]">Posto Shell Combustível</div>
                  <div className="text-[9px] text-slate-400">08/09 • Transporte • 1x</div>
                </div>
                <span className="font-black text-rose-400 text-xs">R$ 180,00</span>
              </div>
            </div>

            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">3</span>
            </span>
          </div>
        );
      }

      if (stepIndex === 3) {
        return (
          <div className="relative animate-in zoom-in-95 duration-200">
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#1C1C22] border-2 border-emerald-500/60 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagar Fatura de Cartão
                </span>
                <span className="font-black text-white text-xs">R$ 1.150,00</span>
              </div>

              <div className="p-2 rounded-xl bg-[#121214] border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 block font-bold">Debitar da Conta:</span>
                <div className="flex justify-between font-bold text-white text-xs">
                  <span>🟠 Itaú Personnalité</span>
                  <span className="text-slate-400 text-[10px]">Saldo: R$ 11.540,00</span>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/40">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>CONFIRMAR PAGAMENTO DA FATURA</span>
                </div>

                <span className="absolute -top-1 -right-2 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 text-white font-black text-[10px] items-center justify-center shadow-lg">4</span>
                </span>
              </div>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 3: COMO IMPORTAR EXTRATO OFX
    // =========================================================================
    if (guide.id === 'como-importar-extrato-ofx-csv') {
      if (stepIndex === 0) {
        return (
          <div className="p-4 rounded-2xl bg-[#1C1C22] border border-slate-800 space-y-2 text-center animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-xs font-black text-white">1. Exportar Arquivo OFX no seu Internet Banking</div>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
              Acesse o site do seu banco no computador, vá em Extrato Bancário e exporte o arquivo no formato <strong>.OFX</strong> (Money/Quicken).
            </p>
          </div>
        );
      }

      if (stepIndex === 1) {
        return (
          <div className="relative p-3.5 rounded-2xl bg-[#1C1C22] border border-slate-800 flex items-center justify-between animate-in slide-in-from-right-2 duration-200">
            <div>
              <div className="text-xs font-black text-white">Botão de Importação no Topo de Contas</div>
              <div className="text-[10px] text-slate-400">Localizado na barra de ferramentas superior</div>
            </div>

            <div className="relative">
              <div className="px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md border border-purple-400">
                <UploadCloud className="w-4 h-4" />
                <span>Importar Extrato (OFX / CSV)</span>
              </div>
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">2</span>
              </span>
            </div>
          </div>
        );
      }

      if (stepIndex === 2) {
        return (
          <div className="relative p-4 rounded-2xl bg-[#1C1C22] border-2 border-dashed border-purple-500/60 text-center space-y-2 animate-in zoom-in-95 duration-200">
            <UploadCloud className="w-8 h-8 text-purple-400 mx-auto" />
            <div className="text-xs font-black text-white">Arquivo .OFX Carregado com Sucesso ✓</div>
            <div className="px-3 py-1 rounded-lg bg-purple-900/40 text-purple-300 font-mono text-[10px] inline-block">
              extrato_nubank_setembro.ofx
            </div>
            <div className="text-[10px] text-slate-400">Destino: <strong>🟣 Nubank NuConta</strong></div>
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">3</span>
            </span>
          </div>
        );
      }

      if (stepIndex === 3) {
        return (
          <div className="relative max-w-md mx-auto p-4 rounded-2xl bg-[#1C1C22] border-2 border-emerald-500/60 space-y-2.5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-xs font-black text-white pb-1.5 border-b border-slate-800">
              <span>Prévia de Importação (3 transações)</span>
              <span className="text-emerald-400 text-[10px]">Deduplicação Ativa ✓</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="p-2 rounded-lg bg-[#121214] border border-slate-800 flex justify-between">
                <span>Pix Recebido Empresa</span>
                <span className="text-emerald-400 font-bold">+ R$ 3.500,00</span>
              </div>
              <div className="p-2 rounded-lg bg-[#121214] border border-slate-800 flex justify-between">
                <span>Padaria Bella Vista</span>
                <span className="text-rose-400 font-bold">- R$ 28,50</span>
              </div>
            </div>

            <div className="relative pt-1">
              <div className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md">
                <Check className="w-4 h-4" />
                <span>CONFIRMAR E IMPORTAR TODOS</span>
              </div>
              <span className="absolute -top-1 -right-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 text-white font-black text-[10px] items-center justify-center shadow-lg">4</span>
              </span>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 4: PLANEJAMENTO E ORÇAMENTOS
    // =========================================================================
    if (guide.id === 'como-configurar-orcamentos-e-metas') {
      if (stepIndex === 0) {
        return (
          <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-slate-800 flex items-center justify-between animate-in fade-in duration-200">
            <div>
              <div className="text-xs font-black text-white">Menu Lateral: Aba Planejamento</div>
              <div className="text-[10px] text-slate-400">Clique no item "Planejamento" na barra lateral esquerda</div>
            </div>
            <div className="relative px-3 py-1.5 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md">
              <Flag className="w-3.5 h-3.5" />
              <span>Planejamento</span>
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">1</span>
              </span>
            </div>
          </div>
        );
      }

      if (stepIndex === 1) {
        return (
          <div className="relative p-3.5 rounded-2xl bg-[#1C1C22] border-2 border-purple-500/60 space-y-2 animate-in slide-in-from-right-2 duration-200">
            <div className="flex justify-between text-xs font-black text-white">
              <span>🍔 Alimentação</span>
              <span className="text-purple-300">Teto: R$ 1.800,00</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '80%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Gasto: R$ 1.450,00 (80%)</span>
              <span className="text-purple-400 font-bold cursor-pointer">Editar Teto</span>
            </div>
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">2</span>
            </span>
          </div>
        );
      }

      if (stepIndex === 2) {
        return (
          <div className="relative p-3.5 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Alerta Preventivo de Orçamento</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Você atingiu <strong>80%</strong> do limite mensal estipulado para <strong>Alimentação</strong>.
            </p>
            <div className="p-2 rounded-xl bg-[#121214] border border-amber-500/30 flex justify-between text-xs text-slate-300">
              <span>Resta para o mês:</span>
              <span className="font-black text-amber-400">R$ 350,00</span>
            </div>
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 text-white font-black text-[9px] items-center justify-center shadow-lg">3</span>
            </span>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 5: DIFERENÇAS WEB VS ANDROID
    // =========================================================================
    if (guide.id === 'diferencas-web-vs-android') {
      if (stepIndex === 0) {
        return (
          <div className="relative p-3.5 rounded-2xl bg-[#1C1C22] border-2 border-purple-500/60 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-black text-purple-400">
              <Monitor className="w-4 h-4" />
              <span>Visão Ampla Multicoluna para Computadores</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              No desktop, você conta com barra lateral retrátil, tabela de transações expandida com até 10 colunas e gráficos em tela cheia.
            </p>
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">1</span>
            </span>
          </div>
        );
      }

      if (stepIndex === 1) {
        return (
          <div className="relative p-3.5 rounded-2xl bg-[#1C1C22] border-2 border-purple-500/60 space-y-2 animate-in slide-in-from-right-2 duration-200">
            <div className="flex items-center justify-between text-xs font-black text-white">
              <span>Atalhos de Teclado no Desktop</span>
              <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono text-[10px]">Tecla "N"</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Pressione a tecla <strong>N</strong> em qualquer tela para abrir instantaneamente o modal de nova transação.
            </p>
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">2</span>
            </span>
          </div>
        );
      }

      if (stepIndex === 2) {
        return (
          <div className="relative p-3.5 rounded-2xl bg-[#1C1C22] border-2 border-emerald-500/60 space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sincronização em Nuvem em Tempo Real</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Todas as ações realizadas no desktop ou no celular são sincronizadas instantaneamente via banco de dados Supabase PostgreSQL.
            </p>
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 text-white font-black text-[9px] items-center justify-center shadow-lg">3</span>
            </span>
          </div>
        );
      }
    }

    // Dynamic Fallback
    return (
      <div className="relative p-4 rounded-2xl bg-[#1C1C22] border-2 border-purple-500/50 space-y-2 text-xs animate-in fade-in duration-200">
        <div className="flex items-center justify-between text-purple-300 font-black">
          <span>{step.title}</span>
          <span className="font-mono text-[10px]">{stepIndex + 1}/{guide.steps.length}</span>
        </div>
        <p className="text-slate-300 leading-relaxed">{step.webInstruction}</p>
        <span className="absolute -top-2 -right-2 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-lg">
            {stepIndex + 1}
          </span>
        </span>
      </div>
    );
  };

  return (
    <div 
      onClick={onNextStep}
      className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 overflow-hidden text-white shadow-2xl select-none cursor-pointer transition-transform active:scale-[0.99]"
      title="Clique no simulador para avançar de passo"
    >
      {/* Browser Chrome Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
          </div>
          <div className="px-3 py-1 rounded-md bg-slate-900 text-slate-400 font-mono text-[10px] flex items-center gap-1.5 ml-2 border border-slate-800">
            <span className="text-emerald-400">🔒</span>
            <span>https://finly.lpaguiar.com.br</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-black">
            💻 Interface Web / Desktop
          </span>
        </div>
      </div>

      {/* Browser Body with Sidebar + Main Content */}
      <div className="flex min-h-[360px] bg-[#0E0E11]">
        {/* Simulated Left Sidebar */}
        <div className="w-36 bg-[#141418] border-r border-slate-800/80 p-2.5 flex flex-col justify-between shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-1 py-1">
              <FinlyLogo size="sm" showText={false} />
              <span className="font-black text-xs tracking-wider bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                FINLY
              </span>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold ${activeNav === 'dashboard' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
                <Monitor className="w-3 h-3" />
                <span>Dashboard</span>
              </div>
              <div className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold ${activeNav === 'transacoes' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
                <TrendingDown className="w-3 h-3" />
                <span>Transações</span>
              </div>
              <div className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold ${activeNav === 'contas' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
                <Building2 className="w-3 h-3" />
                <span>Contas</span>
              </div>
              <div className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold ${activeNav === 'cartoes' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
                <CreditCard className="w-3 h-3" />
                <span>Cartões</span>
              </div>
              <div className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold ${activeNav === 'planejamento' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
                <Flag className="w-3 h-3" />
                <span>Planejamento</span>
              </div>
            </div>
          </div>

          <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-slate-400 text-center">
            v1.1.30 Cloud
          </div>
        </div>

        {/* Simulated Right Area */}
        <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-br from-[#121216] to-[#0A0A0C]">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-[10px] font-bold text-purple-300 mb-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Passo {stepIndex + 1}/{guide.steps.length}:</span>
              <span className="text-white">{step.title}</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider text-purple-400/80">Clique para avançar ›</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {renderDesktopContent()}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 font-black text-[9px]">
                Ponto {stepIndex + 1}
              </span>
              <span className="truncate max-w-[280px] text-slate-300">
                {step.webInstruction}
              </span>
            </div>
            <span className="text-purple-400 font-bold flex items-center gap-1">
              <span>Avançar</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
