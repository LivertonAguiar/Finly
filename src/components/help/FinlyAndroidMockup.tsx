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
  Layers,
  UploadCloud,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FinlyLogo } from '../ui/FinlyLogo';
import { GuideStep, HelpGuide } from '../../data/helpCenterData';
import { APP_VERSION } from '../../utils/appUpdateService';

interface FinlyAndroidMockupProps {
  guide: HelpGuide;
  step: GuideStep;
  stepIndex: number;
}

export const FinlyAndroidMockup: React.FC<FinlyAndroidMockupProps> = ({
  guide,
  step,
  stepIndex,
}) => {
  const isSpeedDialStep =
    guide.category === 'primeiros_passos' ||
    (guide.category === 'transacoes' && (stepIndex === 0 || step.androidInstruction.toLowerCase().includes('arco') || step.androidInstruction.toLowerCase().includes('+')));

  const isFormStep =
    guide.category === 'transacoes' && stepIndex >= 1;

  const isCardStep = guide.category === 'cartoes';
  const isAccountStep = guide.category === 'contas';
  const isGoalStep = guide.category === 'planejamento';
  const isOfxStep = guide.category === 'ofx';
  const isAboutStep = guide.category === 'mobile_web' || guide.category === 'configuracoes';

  return (
    <div className="flex flex-col items-center select-none">
      {/* Smartphone Chassis Frame */}
      <div className="relative w-full max-w-[340px] bg-[#0E0E11] rounded-[44px] p-3 shadow-2xl border-4 border-[#27272A] ring-1 ring-white/10 text-white overflow-hidden shadow-purple-950/40">
        
        {/* Hardware Notch / Dynamic Island */}
        <div className="flex items-center justify-between px-3 pt-1 pb-2 text-[10px] font-semibold text-slate-300">
          <span className="font-mono font-bold tracking-tight">12:45</span>
          
          <div className="w-22 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 border border-white/5 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-[#18181B] border border-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/90 animate-pulse" />
          </div>

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
        <div className="relative rounded-[32px] bg-[#121214] border border-slate-800/80 overflow-hidden flex flex-col min-h-[460px] justify-between shadow-inner">
          
          {/* Real Finly Mobile Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-[#18181B]">
            <div className="flex items-center gap-2">
              <Menu className="w-4 h-4 text-slate-300" />
              <div className="flex items-center gap-1.5">
                <FinlyLogo size="sm" showText={false} />
                <span className="font-black tracking-wider text-xs bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                  FINLY
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <div className="relative">
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                L
              </div>
            </div>
          </div>

          {/* Active Screen Body (Dependent on Guide Topic) */}
          <div className="flex-1 p-3 space-y-3 relative overflow-hidden bg-gradient-to-b from-[#18181B]/40 to-[#121214]">
            
            {/* 1. Transações / Primeiros Passos View */}
            {(guide.category === 'primeiros_passos' || guide.category === 'transacoes') && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                {/* Saldo Total Card */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/60 via-[#1C1C20] to-[#18181B] border border-purple-500/30 shadow-md space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold">Saldo Geral</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-black">
                      Setembro 2026
                    </span>
                  </div>
                  <div className="text-xl font-black tracking-tight text-white">
                    R$ 14.850,00
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>+ R$ 6.200,00</span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-400 font-bold justify-end">
                      <TrendingDown className="w-3 h-3" />
                      <span>- R$ 2.450,00</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                    <span>Lançamentos Recentes</span>
                    <span className="text-purple-400">Ver todos</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-[#1A1A1E] border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs">
                          🛒
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">Supermercado Pão de Açúcar</div>
                          <div className="text-[9px] text-slate-400">Cartão Nubank • Alimentação</div>
                        </div>
                      </div>
                      <span className="font-black text-rose-400">- R$ 342,50</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#1A1A1E] border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                          💼
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">Salário Mensal</div>
                          <div className="text-[9px] text-slate-400">Conta Itaú • Salário</div>
                        </div>
                      </div>
                      <span className="font-black text-emerald-400">+ R$ 6.200,00</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#1A1A1E] border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                          ⛽
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">Posto Shell Combustível</div>
                          <div className="text-[9px] text-slate-400">Débito • Transporte</div>
                        </div>
                      </div>
                      <span className="font-black text-rose-400">- R$ 180,00</span>
                    </div>
                  </div>
                </div>

                {/* Form Bottom Sheet Simulation if in Form Step */}
                {isFormStep && !isSpeedDialStep && (
                  <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-[#1C1C21] border border-purple-500/40 p-3 shadow-2xl space-y-2 animate-in slide-in-from-bottom-3 duration-200 z-30">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[11px] font-black text-purple-300">Nova Despesa</span>
                      <span className="text-[10px] text-slate-400">Passo {stepIndex + 1}</span>
                    </div>
                    <div className="text-center py-1">
                      <span className="text-xs text-slate-400">Valor da Despesa</span>
                      <div className="text-lg font-black text-white">R$ 150,00</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-center">
                        🍔 Alimentação
                      </div>
                      <div className="p-1.5 rounded-lg bg-purple-900/40 border border-purple-500/30 text-purple-300 font-bold text-center">
                        💳 Nubank
                      </div>
                    </div>
                    <div className="w-full py-1.5 rounded-xl bg-purple-600 text-center text-[10px] font-black shadow-md">
                      Salvar Despesa
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Cartões & Faturas View */}
            {isCardStep && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Realistic Finly Virtual Card */}
                <div className="relative rounded-2xl bg-gradient-to-tr from-[#2E0854] via-[#1E1B4B] to-[#0F172A] p-3.5 border border-purple-500/40 shadow-xl text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider uppercase text-purple-300">
                      Finly Platinum
                    </span>
                    <div className="w-7 h-4 bg-amber-400/90 rounded-sm flex items-center justify-center text-[8px] font-black text-black">
                      CHIP
                    </div>
                  </div>
                  <div className="text-sm font-mono tracking-widest text-slate-200">
                    •••• •••• •••• 8821
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <div>
                      <div>TITULAR</div>
                      <div className="font-bold text-slate-200">LIVERTON AGUIAR</div>
                    </div>
                    <div className="text-right">
                      <div>VALIDADE</div>
                      <div className="font-bold text-slate-200">08/29</div>
                    </div>
                  </div>
                </div>

                {/* Fatura e Limite Card */}
                <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Fatura Atual (Setembro)</span>
                    <span className="font-black text-rose-400">R$ 1.150,00</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '35%' }} />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Limite Usado: R$ 1.150,00</span>
                    <span className="text-emerald-400 font-bold">Disponível: R$ 3.850,00</span>
                  </div>

                  {/* Pagar Fatura Button */}
                  <div className="pt-1">
                    <div className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar Fatura</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Contas & Saldos View */}
            {isAccountStep && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">Saldo Consolidado</span>
                    <div className="text-lg font-black text-white">R$ 12.850,00</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-black text-[10px]">
                    3 Contas Ativas
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-[#1A1A1E] border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                        IT
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">Itaú Unibanco</div>
                        <div className="text-[9px] text-slate-400">Conta Corrente Principal</div>
                      </div>
                    </div>
                    <span className="font-black text-white">R$ 8.450,00</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1A1E] border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                        NU
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">Nubank NuConta</div>
                        <div className="text-[9px] text-slate-400">Reserva com Rendimento</div>
                      </div>
                    </div>
                    <span className="font-black text-white">R$ 4.200,00</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1A1E] border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        💵
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">Carteira Física</div>
                        <div className="text-[9px] text-slate-400">Dinheiro em Espécie</div>
                      </div>
                    </div>
                    <span className="font-black text-white">R$ 200,00</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Metas & Orçamento View */}
            {isGoalStep && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300">🎯 Reserva de Emergência</span>
                    <span className="font-black text-purple-400">68%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full" style={{ width: '68%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Guardado: R$ 6.800,00</span>
                    <span className="text-slate-300 font-bold">Alvo: R$ 10.000,00</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#1C1C20] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300">✈️ Viagem de Férias</span>
                    <span className="font-black text-emerald-400">48%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '48%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Guardado: R$ 2.400,00</span>
                    <span className="text-slate-300 font-bold">Alvo: R$ 5.000,00</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. OFX / Extratos View */}
            {isOfxStep && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-[#1C1C20] border border-purple-500/40 text-center space-y-2">
                  <UploadCloud className="w-8 h-8 text-purple-400 mx-auto" />
                  <div className="text-xs font-black text-white">Importar Extrato Bancário</div>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Selecione o arquivo .OFX ou .CSV baixado do seu banco para classificação automática
                  </p>
                  <div className="pt-1">
                    <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-[10px] shadow-sm inline-block">
                      Selecionar Arquivo OFX
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#18181B] border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Deduplicação Inteligente</span>
                  <span className="text-emerald-400 font-bold">Ativa ✓</span>
                </div>
              </div>
            )}

            {/* 6. Mobile Web / Configurações / Sobre View */}
            {isAboutStep && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-[#1C1C20] border border-slate-800 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto mb-1">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-black text-white">Finly App Android</div>
                  <div className="text-[10px] text-purple-300 font-mono font-bold">Versão v{APP_VERSION}</div>
                  <p className="text-[10px] text-slate-400">Seu aplicativo está na versão estável mais recente</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Notificações e Sincronização em Tempo Real</span>
                </div>
              </div>
            )}

            {/* REAL SPEED DIAL RADIAL OVERLAY (When speed dial is active in step) */}
            {isSpeedDialStep && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col justify-end items-center pb-12 z-20 animate-in fade-in duration-200">
                {/* Arc Action Buttons */}
                <div className="relative w-64 h-36 flex items-center justify-center">
                  {/* Receita (Top-Left) */}
                  <div className="absolute left-6 top-0 flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#343438] text-emerald-400 border border-slate-700/80 flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[9px] font-bold text-white mt-1">Receita</span>
                  </div>

                  {/* Despesa (Top-Right) */}
                  <div className="absolute right-6 top-0 flex flex-col items-center">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-[#343438] text-rose-400 border border-slate-700/80 flex items-center justify-center shadow-lg">
                        <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      {/* Hotspot Pin on Despesa */}
                      <span className="absolute -top-2 -right-2 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 text-white font-black text-[9px] items-center justify-center shadow-md">
                          {stepIndex + 1}
                        </span>
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-white mt-1">Despesa</span>
                  </div>

                  {/* Despesa Cartão (Bottom-Left) */}
                  <div className="absolute left-0 bottom-2 flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#343438] text-teal-400 border border-slate-700/80 flex items-center justify-center shadow-lg">
                      <CreditCard className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[9px] font-bold text-white mt-1">Despesa Cartão</span>
                  </div>

                  {/* Transferência (Bottom-Right) */}
                  <div className="absolute right-0 bottom-2 flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#343438] text-purple-400 border border-slate-700/80 flex items-center justify-center shadow-lg">
                      <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[9px] font-bold text-white mt-1">Transferência</span>
                  </div>
                </div>

                {/* Quick Entity Pills */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap justify-center px-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#2C2C30] text-[9px] font-bold text-slate-200">
                    🎯 Metas
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2C2C30] text-[9px] font-bold text-slate-200">
                    📉 Dívidas
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2C2C30] text-[9px] font-bold text-slate-200">
                    📈 Investimentos
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2C2C30] text-[9px] font-bold text-slate-200">
                    💳 Cartões
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Real Finly Mobile Bottom Navigation Bar */}
          <div className="relative border-t border-slate-800/80 bg-[#18181B] px-1 py-1.5 flex items-center justify-around text-[9px] text-slate-400">
            {/* 1. Principal */}
            <div className="flex-1 flex flex-col items-center justify-center gap-0.5 text-purple-400 font-bold">
              <Home className="w-4 h-4" />
              <span>Principal</span>
            </div>

            {/* 2. Transações */}
            <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
              <List className="w-4 h-4" />
              <span>Transações</span>
            </div>

            {/* 3. Central FAB */}
            <div className="flex-1 flex items-center justify-center -mt-5 z-30">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/50 border-2 border-[#121214] font-black text-lg">
                  {isSpeedDialStep ? '×' : '+'}
                </div>
                {/* Hotspot Pin on FAB when not open */}
                {!isSpeedDialStep && (guide.category === 'primeiros_passos' || guide.category === 'transacoes') && stepIndex === 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 text-white font-black text-[8px] items-center justify-center shadow-md">
                      1
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* 4. Planejamento */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${isGoalStep ? 'text-purple-400 font-bold' : ''}`}>
              <Flag className="w-4 h-4" />
              <span>Planejamento</span>
            </div>

            {/* 5. Mais */}
            <div className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${isAboutStep ? 'text-purple-400 font-bold' : ''}`}>
              <MoreHorizontal className="w-4 h-4" />
              <span>Mais</span>
            </div>
          </div>

          {/* Android Home Bar Indicator */}
          <div className="bg-[#18181B] pb-1 pt-0.5 flex justify-center">
            <div className="w-24 h-1 bg-slate-600/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Under-Mockup Live Indicator Banner */}
      <div className="mt-3 text-center max-w-xs">
        <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-[11px] font-black inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Simulador Fiel do App Finly Android</span>
        </span>
      </div>
    </div>
  );
};
