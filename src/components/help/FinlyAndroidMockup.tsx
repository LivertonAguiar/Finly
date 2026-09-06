import React from 'react';
import {
  Menu,
  Eye,
  Bell,
  Home,
  List,
  Flag,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowLeftRight,
  Wifi,
  Battery,
  Signal,
  CheckCircle2,
  Calendar,
  Sparkles,
  UploadCloud,
  ShieldCheck,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Download,
  Smartphone,
  Plus,
} from 'lucide-react';
import { FinlyLogo } from '../ui/FinlyLogo';
import { GuideStep, HelpGuide } from '../../data/helpCenterData';
import { APP_VERSION } from '../../utils/appUpdateService';

interface FinlyAndroidMockupProps {
  guide: HelpGuide;
  step: GuideStep;
  stepIndex: number;
  onNextStep?: () => void;
}

export const FinlyAndroidMockup: React.FC<FinlyAndroidMockupProps> = ({
  guide,
  step,
  stepIndex,
  onNextStep,
}) => {
  // Determine active tab on bottom nav based on guide and step
  const getActiveTab = () => {
    if (guide.id === 'como-gerenciar-cartoes-e-faturas') {
      if (stepIndex === 0) return 'mais'; // Accessed via Mais or Speed Dial
      return 'cartoes';
    }
    if (guide.category === 'planejamento' || guide.id === 'como-configurar-orcamentos-e-metas') {
      return 'planejamento';
    }
    if (guide.category === 'mobile_web' || guide.category === 'configuracoes') {
      return 'mais';
    }
    if (guide.id === 'como-lancar-despesa') {
      return 'dashboard';
    }
    if (guide.category === 'transacoes') {
      return 'transacoes';
    }
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  // Render the step-specific screen content
  const renderStepScreen = () => {
    // =========================================================================
    // GUIDE 1: COMO LANÇAR DESPESA (como-lancar-despesa)
    // =========================================================================
    if (guide.id === 'como-lancar-despesa') {
      // Passo 1: Abrir o formulário (Speed Dial aberto com 4 botões em arco)
      if (stepIndex === 0) {
        return (
          <div className="relative h-full flex flex-col justify-between animate-in fade-in duration-200">
            {/* Background Dashboard */}
            <div className="p-3 space-y-2.5 opacity-35 filter blur-[0.5px]">
              <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400">Saldo em contas</span>
                <div className="text-lg font-black text-white">R$ 14.850,00</div>
              </div>
            </div>

            {/* SPEED DIAL OVERLAY */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col justify-end items-center pb-8 z-20 animate-in fade-in duration-200">
              <div className="relative w-64 h-40 flex items-center justify-center">
                {/* 1. Receita (Top-Left) */}
                <div className="absolute left-6 top-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#343438] text-emerald-400 border border-slate-700/80 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold text-white mt-1">Receita</span>
                </div>

                {/* 2. Despesa (Top-Right) - HOTSPOT TARGET */}
                <div className="absolute right-6 top-1 flex flex-col items-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white border-2 border-white/60 flex items-center justify-center shadow-xl shadow-rose-600/40 animate-pulse">
                      <TrendingDown className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    {/* Hotspot Pin */}
                    <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-rose-500 text-white font-black text-[10px] items-center justify-center shadow-lg">
                        1
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-rose-300 mt-1">Despesa</span>
                </div>

                {/* 3. Despesa Cartão (Bottom-Left) */}
                <div className="absolute left-1 bottom-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#343438] text-teal-400 border border-slate-700/80 flex items-center justify-center shadow-lg">
                    <CreditCard className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold text-white mt-1">Despesa Cartão</span>
                </div>

                {/* 4. Transferência (Bottom-Right) */}
                <div className="absolute right-1 bottom-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#343438] text-purple-400 border border-slate-700/80 flex items-center justify-center shadow-lg">
                    <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold text-white mt-1">Transferência</span>
                </div>
              </div>

              {/* Quick Pills */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center px-3">
                <span className="px-2 py-0.5 rounded-full bg-[#2C2C30] text-[9px] font-bold text-slate-300">🎯 Metas</span>
                <span className="px-2 py-0.5 rounded-full bg-[#2C2C30] text-[9px] font-bold text-slate-300">📉 Dívidas</span>
                <span className="px-2 py-0.5 rounded-full bg-[#2C2C30] text-[9px] font-bold text-slate-300">💳 Cartões</span>
              </div>
            </div>
          </div>
        );
      }

      // Passo 2: Preencher Valor, Descrição e Categoria
      if (stepIndex === 1) {
        return (
          <div className="p-3 space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" /> Nova Despesa
              </span>
              <span className="text-[10px] text-slate-400">Passo 2/4</span>
            </div>

            {/* Large Amount Display with Hotspot */}
            <div className="relative p-2.5 rounded-2xl bg-[#1C1C22] border-2 border-purple-500/60 text-center space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">Valor do Gasto</span>
              <div className="text-2xl font-black text-white tracking-tight">R$ 150,00</div>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  2
                </span>
              </span>
            </div>

            {/* Description Field */}
            <div className="p-2 rounded-xl bg-[#18181C] border border-slate-800 text-[11px] flex items-center justify-between">
              <span className="text-slate-400">Descrição:</span>
              <span className="text-white font-bold">Supermercado Pão de Açúcar</span>
            </div>

            {/* Category Selector */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Categoria Selecionada:</span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="p-2 rounded-xl bg-purple-600/30 border border-purple-500 text-purple-300 font-black text-center flex flex-col items-center gap-0.5 shadow-sm">
                  <span className="text-sm">🛒</span>
                  <span>Alimentação</span>
                </div>
                <div className="p-2 rounded-xl bg-[#18181C] border border-slate-800 text-slate-400 font-bold text-center flex flex-col items-center gap-0.5">
                  <span className="text-sm">⛽</span>
                  <span>Transporte</span>
                </div>
                <div className="p-2 rounded-xl bg-[#18181C] border border-slate-800 text-slate-400 font-bold text-center flex flex-col items-center gap-0.5">
                  <span className="text-sm">💊</span>
                  <span>Saúde</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Passo 3: Escolher Origem (Conta x Cartão e Parcelas)
      if (stepIndex === 2) {
        return (
          <div className="p-3 space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-black text-rose-400">Origem do Pagamento</span>
              <span className="text-[10px] text-slate-400">Passo 3/4</span>
            </div>

            {/* Tab Switcher: Conta vs Cartão */}
            <div className="relative p-1 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-1 text-center text-xs font-black">
              <div className="py-1.5 rounded-lg text-slate-400">
                Conta Bancária
              </div>
              <div className="py-1.5 rounded-lg bg-purple-600 text-white shadow-md flex items-center justify-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cartão de Crédito</span>
              </div>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  3
                </span>
              </span>
            </div>

            {/* Selected Card Details */}
            <div className="p-2.5 rounded-2xl bg-[#1C1C22] border border-purple-500/40 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-bold">Cartão Selecionado:</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-900/40 text-purple-300 font-mono text-[10px]">
                  Nubank Platinum
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Fatura de Setembro</span>
                <span>Limite Disp: R$ 3.850,00</span>
              </div>
            </div>

            {/* Parcelas Selector */}
            <div className="p-2 rounded-xl bg-[#18181C] border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px] font-bold">Parcelamento:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 font-black text-[11px]">
                1x de R$ 150,00 (à vista)
              </span>
            </div>
          </div>
        );
      }

      // Passo 4: Confirmar e Salvar
      if (stepIndex === 3) {
        return (
          <div className="p-3 space-y-3 animate-in zoom-in-95 duration-200 text-center">
            {/* Summary Review */}
            <div className="p-3 rounded-2xl bg-[#1C1C22] border border-slate-800 space-y-2 text-left text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Resumo da Operação</span>
                <span className="text-rose-400 font-black">- R$ 150,00</span>
              </div>
              <div className="space-y-1 text-slate-300 text-[10px]">
                <div>• <strong>Descrição:</strong> Supermercado Pão de Açúcar</div>
                <div>• <strong>Categoria:</strong> Alimentação 🛒</div>
                <div>• <strong>Forma:</strong> Cartão Nubank (1x)</div>
                <div>• <strong>Data:</strong> Hoje ({new Date().toLocaleDateString('pt-BR')})</div>
              </div>
            </div>

            {/* Large Save Button with Hotspot */}
            <div className="relative pt-1">
              <div className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/40">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SALVAR DESPESA</span>
              </div>
              {/* Hotspot Pin */}
              <span className="absolute -top-1 -right-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 text-white font-black text-[10px] items-center justify-center shadow-lg">
                  4
                </span>
              </span>
            </div>

            {/* Success Toast */}
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transação registrada com sucesso!</span>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 2: COMO GERENCIAR CARTÕES E FATURAS (como-gerenciar-cartoes-e-faturas)
    // =========================================================================
    if (guide.id === 'como-gerenciar-cartoes-e-faturas') {
      // Passo 1: Acessar a seção de cartões (via atalho do FAB (+) ou menu Mais)
      if (stepIndex === 0) {
        return (
          <div className="p-3 space-y-3 animate-in fade-in duration-200">
            {/* Speed Dial Shortcut Demonstration */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-600/20 text-teal-400 flex items-center justify-center mx-auto">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-white">Como Abrir Cartões no Celular</div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Toque no botão circular <strong>(+)</strong> e escolha o atalho rápido <strong>💳 Cartões</strong>, ou acesse pela aba <strong>Mais</strong>.
              </p>
            </div>

            {/* Visual Shortcut Card with Hotspot */}
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-r from-teal-950/50 to-purple-950/40 border-2 border-teal-500/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600/30 text-teal-300 flex items-center justify-center text-sm font-bold">
                  💳
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-white">Atalho Rápido Cartões</div>
                  <div className="text-[9px] text-teal-300/90 font-medium">Toque no (+) ou no menu Mais</div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-teal-400" />

              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-6 w-6 bg-teal-500 text-white font-black text-[10px] items-center justify-center shadow-lg">
                  1
                </span>
              </span>
            </div>
          </div>
        );
      }

      // Passo 2: Entender o Card do Cartão e o Ciclo da Fatura
      if (stepIndex === 1) {
        return (
          <div className="p-3 space-y-2.5 animate-in slide-in-from-right-2 duration-200">
            {/* Virtual Card */}
            <div className="relative rounded-2xl bg-gradient-to-tr from-[#2E0854] via-[#1E1B4B] to-[#0F172A] p-3.5 border border-purple-500/40 shadow-xl text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider uppercase text-purple-300">
                  Nubank Ultravioleta
                </span>
                <div className="w-6 h-4 bg-amber-400/90 rounded-sm flex items-center justify-center text-[7px] font-black text-black">
                  CHIP
                </div>
              </div>
              <div className="text-sm font-mono tracking-widest text-slate-200">•••• •••• •••• 8821</div>
              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <div>
                  <div className="text-[7px]">TITULAR</div>
                  <div className="font-bold text-slate-200">LIVERTON AGUIAR</div>
                </div>
                <div className="text-right">
                  <div className="text-[7px]">MELHOR DIA</div>
                  <div className="font-bold text-emerald-400">DIA 14 (Vence 20)</div>
                </div>
              </div>
            </div>

            {/* Cycle Metrics Card with Hotspot */}
            <div className="relative p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Fatura Aberta:</span>
                <span className="font-black text-rose-400">R$ 1.150,00</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '30%' }} />
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span>Usado: R$ 1.150,00</span>
                <span className="text-emerald-400 font-bold">Disp: R$ 3.850,00</span>
              </div>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  2
                </span>
              </span>
            </div>
          </div>
        );
      }

      // Passo 3: Consultar Lançamentos da Fatura
      if (stepIndex === 2) {
        return (
          <div className="p-3 space-y-2 animate-in slide-in-from-right-2 duration-200">
            <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
              <span className="font-black text-slate-200">Lançamentos da Fatura</span>
              <span className="text-[10px] text-purple-400 font-bold">Total: R$ 1.150,00</span>
            </div>

            {/* Purchases List */}
            <div className="relative space-y-1.5 text-[10px]">
              <div className="p-2 rounded-xl bg-[#1A1A1E] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Supermercado Pão de Açúcar</div>
                  <div className="text-[8px] text-slate-400">12/09 • Parcela 1/1 • Alimentação</div>
                </div>
                <span className="font-black text-rose-400">R$ 342,50</span>
              </div>

              <div className="p-2 rounded-xl bg-[#1A1A1E] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Posto Shell Combustível</div>
                  <div className="text-[8px] text-slate-400">08/09 • Parcela 1/1 • Transporte</div>
                </div>
                <span className="font-black text-rose-400">R$ 180,00</span>
              </div>

              <div className="p-2 rounded-xl bg-[#1A1A1E] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Smart Fit Academia</div>
                  <div className="text-[8px] text-purple-300 font-bold">05/09 • Parcela 2/12 • Saúde</div>
                </div>
                <span className="font-black text-rose-400">R$ 119,90</span>
              </div>

              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  3
                </span>
              </span>
            </div>
          </div>
        );
      }

      // Passo 4: Pagar a Fatura
      if (stepIndex === 3) {
        return (
          <div className="p-3 space-y-2.5 animate-in zoom-in-95 duration-200">
            {/* Pay Invoice Modal Simulator */}
            <div className="p-3 rounded-2xl bg-[#1C1C22] border-2 border-emerald-500/60 space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-black text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagar Fatura
                </span>
                <span className="font-black text-white">R$ 1.150,00</span>
              </div>

              {/* Account to debit */}
              <div className="p-2 rounded-xl bg-[#18181C] border border-slate-800 space-y-1">
                <span className="text-[9px] text-slate-400 block font-bold">Debitar da Conta:</span>
                <div className="flex items-center justify-between font-bold text-white text-xs">
                  <span>🟠 Itaú Unibanco</span>
                  <span className="text-slate-400 text-[10px]">Saldo: R$ 8.450,00</span>
                </div>
              </div>

              {/* Confirm Button with Hotspot */}
              <div className="relative pt-1">
                <div className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/40">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>CONFIRMAR PAGAMENTO</span>
                </div>
                {/* Hotspot Pin */}
                <span className="absolute -top-1 -right-2 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 text-white font-black text-[10px] items-center justify-center shadow-lg">
                    4
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 3: COMO IMPORTAR EXTRATO OFX (como-importar-extrato-ofx-csv)
    // =========================================================================
    if (guide.id === 'como-importar-extrato-ofx-csv') {
      if (stepIndex === 0) {
        return (
          <div className="p-3 space-y-3 animate-in fade-in duration-200 text-center">
            <div className="p-4 rounded-2xl bg-[#1C1C22] border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-white">1. Exportar Arquivo OFX do Banco</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                No app do seu banco (Itaú, Nubank, Inter, Bradesco), exporte o extrato no formato <strong>.OFX</strong> para a pasta de downloads do celular.
              </p>
            </div>
          </div>
        );
      }

      if (stepIndex === 1) {
        return (
          <div className="p-3 space-y-2.5 animate-in slide-in-from-right-2 duration-200">
            <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Contas Bancárias</span>
                <span className="text-[10px] text-purple-400 font-bold">Total: R$ 12.850,00</span>
              </div>
              {/* Button with Hotspot */}
              <div className="relative pt-1">
                <div className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md">
                  <UploadCloud className="w-4 h-4" />
                  <span>Importar Extrato (OFX / CSV)</span>
                </div>
                {/* Hotspot Pin */}
                <span className="absolute -top-1 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-500 text-white font-black text-[9px] items-center justify-center shadow-md">
                    2
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      }

      if (stepIndex === 2) {
        return (
          <div className="p-3 space-y-2.5 animate-in zoom-in-95 duration-200">
            <div className="relative p-3.5 rounded-2xl bg-[#1C1C22] border-2 border-dashed border-purple-500/60 text-center space-y-2">
              <UploadCloud className="w-7 h-7 text-purple-400 mx-auto" />
              <div className="text-xs font-black text-white">Arquivo Carregado ✓</div>
              <div className="px-2 py-1 rounded-lg bg-purple-900/40 text-purple-300 font-mono text-[10px] inline-block">
                extrato_nubank_setembro.ofx
              </div>
              <div className="text-[10px] text-slate-400">Destino: <strong>🟣 Nubank NuConta</strong></div>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  3
                </span>
              </span>
            </div>
          </div>
        );
      }

      if (stepIndex === 3) {
        return (
          <div className="p-3 space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
              <span className="font-black text-white">Revisar e Importar (3 itens)</span>
              <span className="text-[9px] text-emerald-400 font-bold">Sem Duplicidade ✓</span>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="p-1.5 rounded-lg bg-[#1A1A1E] border border-slate-800 flex justify-between">
                <span>Pix Recebido Empresa</span>
                <span className="text-emerald-400 font-bold">+ R$ 3.500,00</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#1A1A1E] border border-slate-800 flex justify-between">
                <span>Padaria Bella Vista</span>
                <span className="text-rose-400 font-bold">- R$ 28,50</span>
              </div>
            </div>
            {/* Confirm Button with Hotspot */}
            <div className="relative pt-1">
              <div className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md">
                <Check className="w-4 h-4" />
                <span>CONFIRMAR E IMPORTAR TODOS</span>
              </div>
              {/* Hotspot Pin */}
              <span className="absolute -top-1 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 text-white font-black text-[9px] items-center justify-center shadow-md">
                  4
                </span>
              </span>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 4: PLANEJAMENTO & ORÇAMENTOS (como-configurar-orcamentos-e-metas)
    // =========================================================================
    if (guide.id === 'como-configurar-orcamentos-e-metas') {
      if (stepIndex === 0) {
        return (
          <div className="p-3 space-y-3 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-[#1C1C22] border border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto">
                <Flag className="w-5 h-5" />
              </div>
              <div className="text-xs font-black text-white">Aba Planejamento na Barra Inferior</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Toque no <strong>4º ícone (Planejamento)</strong> na barra inferior de navegação para gerenciar seus tetos.
              </p>
            </div>
            {/* Pointer to tab 4 */}
            <div className="relative p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-[10px] text-purple-300 font-bold flex items-center justify-between">
              <span>Toque na 4ª aba "Planejamento" abaixo</span>
              <span className="text-purple-400 font-black">↓</span>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  1
                </span>
              </span>
            </div>
          </div>
        );
      }

      if (stepIndex === 1) {
        return (
          <div className="p-3 space-y-2 animate-in slide-in-from-right-2 duration-200">
            <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
              <span className="font-black text-white">Tetos de Gastos por Categoria</span>
              <span className="text-[9px] text-purple-400 font-bold">Setembro 2026</span>
            </div>

            <div className="relative space-y-1.5 text-[10px]">
              <div className="p-2.5 rounded-xl bg-[#1A1A1E] border border-slate-800 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-white">🍔 Alimentação</span>
                  <span className="text-purple-300">Teto: R$ 1.800,00</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '80%' }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Gasto: R$ 1.450,00 (80%)</span>
                  <span className="text-purple-400 font-bold">Editar Teto</span>
                </div>
              </div>

              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  2
                </span>
              </span>
            </div>
          </div>
        );
      }

      if (stepIndex === 2) {
        return (
          <div className="p-3 space-y-2.5 animate-in zoom-in-95 duration-200">
            {/* Alert Box Simulator */}
            <div className="relative p-3 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Alerta Preventivo de Orçamento</span>
              </div>
              <p className="text-[10px] text-slate-200 leading-relaxed">
                Você atingiu <strong>80%</strong> do limite mensal estipulado para <strong>Alimentação</strong>.
              </p>
              <div className="p-2 rounded-xl bg-[#121214] border border-amber-500/30 flex justify-between text-[9px] text-slate-300">
                <span>Resta para o mês:</span>
                <span className="font-black text-amber-400">R$ 350,00</span>
              </div>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 text-white font-black text-[9px] items-center justify-center shadow-md">
                  3
                </span>
              </span>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // GUIDE 5: RECURSOS DO APP ANDROID (diferencas-web-vs-android)
    // =========================================================================
    if (guide.id === 'diferencas-web-vs-android') {
      // Passo 1: Navegação e Barra Inferior Mobile
      if (stepIndex === 0) {
        return (
          <div className="p-3 space-y-2.5 animate-in fade-in duration-200">
            <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-purple-400">
                <Smartphone className="w-4 h-4" />
                <span>Ergonomia Mobile Nativa</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Barra inferior desenhada para alcance com o polegar: <strong>Principal</strong>, <strong>Transações</strong>, <strong>Menu (+)</strong>, <strong>Planejamento</strong> e <strong>Mais</strong>.
              </p>
            </div>

            {/* Pointer card with Hotspot */}
            <div className="relative p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-[10px] text-purple-300 font-bold flex items-center justify-between">
              <span>Barra de Navegação Inferior Ativa</span>
              <span className="text-purple-400 font-black">↓</span>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  1
                </span>
              </span>
            </div>
          </div>
        );
      }

      // Passo 2: Lançamentos Rápidos com Menu em Arco
      if (stepIndex === 1) {
        return (
          <div className="relative h-full flex flex-col justify-between animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col justify-center items-center p-2 z-20">
              <div className="relative w-64 h-36 flex items-center justify-center">
                {/* 4 Arc action buttons */}
                <div className="absolute left-6 top-0 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-[#343438] text-emerald-400 flex items-center justify-center shadow-lg border border-slate-700">
                    <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[8px] font-bold text-white mt-0.5">Receita</span>
                </div>

                <div className="absolute right-6 top-0 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border border-white/50">
                    <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[8px] font-bold text-white mt-0.5">Despesa</span>
                </div>

                <div className="absolute left-2 bottom-1 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-[#343438] text-teal-400 flex items-center justify-center shadow-lg border border-slate-700">
                    <CreditCard className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[8px] font-bold text-white mt-0.5">Cartão</span>
                </div>

                <div className="absolute right-2 bottom-1 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-[#343438] text-purple-400 flex items-center justify-center shadow-lg border border-slate-700">
                    <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[8px] font-bold text-white mt-0.5">Transferir</span>
                </div>

                {/* Hotspot Pin */}
                <span className="absolute -top-2 -right-2 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                    2
                  </span>
                </span>
              </div>

              <div className="mt-2 text-center text-[10px] text-slate-300 font-bold">
                Menu em Leque Aberto com 1 Toque
              </div>
            </div>
          </div>
        );
      }

      // Passo 3: Notificações e Atualizações
      if (stepIndex === 2) {
        return (
          <div className="p-3 space-y-2.5 animate-in zoom-in-95 duration-200">
            <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-purple-400" /> Atualização do Aplicativo
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                O aplicativo verifica periodicamente novas versões na nuvem e notifica diretamente no dispositivo.
              </p>
            </div>

            {/* Update Card with Hotspot */}
            <div className="relative p-2.5 rounded-xl bg-purple-950/40 border-2 border-purple-500/60 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Versão mais recente instalada</span>
              </div>
              <span className="text-purple-300 font-mono text-[9px]">Atualizado ✓</span>
              {/* Hotspot Pin */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-600 text-white font-black text-[9px] items-center justify-center shadow-md">
                  3
                </span>
              </span>
            </div>
          </div>
        );
      }
    }

    // =========================================================================
    // DYNAMIC FALLBACK APP VIEW (Adapts to any step)
    // =========================================================================
    return (
      <div className="p-3 space-y-2.5 animate-in fade-in duration-200">
        {/* Step Highlight Box */}
        <div className="relative p-3 rounded-2xl bg-[#1C1C20] border-2 border-purple-500/50 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-black text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {step.title}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 text-[9px] font-mono font-bold">
              {stepIndex + 1}/{guide.steps.length}
            </span>
          </div>
          <p className="text-[10px] text-slate-200 leading-relaxed font-medium">
            {step.androidInstruction}
          </p>
          {/* Hotspot Pin */}
          <span className="absolute -top-2 -right-2 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-600 text-white font-black text-[10px] items-center justify-center shadow-md">
              {stepIndex + 1}
            </span>
          </span>
        </div>

        {/* Dashboard Balance Overview */}
        <div className="p-3 rounded-2xl bg-[#18181C] border border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-medium">Saldo Total em Contas</span>
          <div className="text-xl font-black text-white">R$ 14.850,00</div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
            <span className="text-emerald-400 font-bold">+ R$ 6.200,00</span>
            <span className="text-rose-400 font-bold">- R$ 2.450,00</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Smartphone Chassis Frame (Sleek Modern Android Flagship) */}
      <div 
        onClick={onNextStep}
        className="relative w-full max-w-[340px] bg-[#0A0A0C] rounded-[46px] p-2.5 shadow-2xl border-[6px] border-[#2A2A2E] ring-1 ring-white/15 text-white overflow-hidden shadow-purple-950/40 cursor-pointer transition-transform active:scale-[0.99]"
        title="Toque no simulador para avançar de passo"
      >
        
        {/* Top Punch-Hole Camera Lens */}
        <div className="w-3 h-3 bg-black rounded-full mx-auto my-1 border border-slate-800 shadow-inner" />

        {/* Android Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 text-[10px] font-semibold text-slate-300">
          <span className="font-mono font-bold tracking-tight">12:45</span>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-2.5 h-2.5" />
            <Wifi className="w-2.5 h-2.5" />
            <div className="flex items-center text-[9px] font-mono">
              <span className="mr-0.5">88%</span>
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Screen Content Window */}
        <div className="relative rounded-[32px] bg-[#121214] border border-slate-800/80 overflow-hidden flex flex-col h-[420px] justify-between shadow-inner">
          
          {/* Real Finly Mobile Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-[#18181B] shrink-0">
            <div className="flex items-center gap-2">
              <Menu className="w-4 h-4 text-slate-300" />
              <div className="flex items-center gap-1.5">
                <FinlyLogo size="sm" showText={false} />
                <span className="font-black tracking-wider text-xs bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                  FINLY
                </span>
              </div>
            </div>

            {/* Centered Month Selector */}
            <div className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] font-bold text-slate-200 flex items-center gap-1">
              <span>‹ Setembro ›</span>
            </div>

            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <div className="relative">
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
              </div>
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black shadow-xs">
                L
              </div>
            </div>
          </div>

          {/* Real-time In-Mockup Step Sync Banner */}
          <div className="px-3 py-1 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between text-[9px] font-bold text-purple-300 shrink-0">
            <span className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Passo {stepIndex + 1}/{guide.steps.length}:</span>
              <span className="text-white truncate max-w-[170px]">{step.title}</span>
            </span>
            <span className="text-[8px] uppercase tracking-wider text-purple-400/80 shrink-0">Toque p/ avançar ›</span>
          </div>

          {/* DYNAMIC SCREEN BODY (Changes with stepIndex!) */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#18181B]/50 to-[#121214]">
            {renderStepScreen()}
          </div>

          {/* Real Finly Mobile Bottom Navigation Bar */}
          <div className="relative border-t border-slate-800/80 bg-[#18181B] px-1 py-1.5 flex items-center justify-around text-[9px] text-slate-400 shrink-0">
            {/* 1. Principal */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${activeTab === 'dashboard' ? 'text-purple-400 font-bold' : ''}`}>
              <Home className="w-4 h-4" />
              <span>Principal</span>
            </div>

            {/* 2. Transações */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${activeTab === 'transacoes' ? 'text-purple-400 font-bold' : ''}`}>
              <List className="w-4 h-4" />
              <span>Transações</span>
            </div>

            {/* 3. Central FAB */}
            <div className="flex-1 flex items-center justify-center -mt-5 z-30">
              <div className="relative">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/50 border-2 border-[#121214] font-black text-lg transition-transform ${
                  (guide.id === 'como-lancar-despesa' && stepIndex === 0) || (guide.id === 'como-gerenciar-cartoes-e-faturas' && stepIndex === 0) ? 'rotate-90' : ''
                }`}>
                  {(guide.id === 'como-lancar-despesa' && stepIndex === 0) || (guide.id === 'como-gerenciar-cartoes-e-faturas' && stepIndex === 0) ? (
                    <X className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
              </div>
            </div>

            {/* 4. Planejamento */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${activeTab === 'planejamento' ? 'text-purple-400 font-bold' : ''}`}>
              <Flag className="w-4 h-4" />
              <span>Planejamento</span>
            </div>

            {/* 5. Mais */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${activeTab === 'mais' ? 'text-purple-400 font-bold' : ''}`}>
              <MoreHorizontal className="w-4 h-4" />
              <span>Mais</span>
            </div>
          </div>

          {/* Android Home Bar Indicator */}
          <div className="bg-[#18181B] pb-1 pt-0.5 flex justify-center shrink-0">
            <div className="w-24 h-1 bg-slate-600/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Under-Mockup Step Counter Indicator with Interactive Arrow */}
      <div 
        onClick={onNextStep}
        className="mt-3 text-center cursor-pointer transition-transform hover:scale-105"
      >
        <span className="px-3.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-[11px] font-black inline-flex items-center gap-1.5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Tela sincronizada com o Passo {stepIndex + 1} de {guide.steps.length}</span>
          {stepIndex < guide.steps.length - 1 ? (
            <ArrowRight className="w-3 h-3 text-purple-400 ml-0.5" />
          ) : (
            <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
          )}
        </span>
      </div>
    </div>
  );
};
