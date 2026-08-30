import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useFinancial } from '../../context/FinancialContext';
import { CreditCard } from '../../types';
import { CARD_BRANDS, CardBrandLogo, ALL_BANKS, BankLogo } from '../../utils/bankLogos';
import { CreditCard as CardIcon, Check, Sparkles } from 'lucide-react';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: CreditCard | null;
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, editingCard }) => {
  const { addCard, updateCard, accounts, user } = useFinancial();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState(CARD_BRANDS[0].name);
  const [limit, setLimit] = useState('5000');
  const [closingDay, setClosingDay] = useState('20');
  const [dueDay, setDueDay] = useState('27');
  const [color, setColor] = useState('#820ad1');
  const [defaultAccountId, setDefaultAccountId] = useState(accounts[0]?.id || '');


  const prevIsOpenRef = React.useRef(false);
  const prevEditingIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isSwitching = editingCard?.id !== prevEditingIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevEditingIdRef.current = editingCard?.id || null;

    if (!isOpen) return;

    if (isOpening || isSwitching) {
      if (editingCard) {
        setName(editingCard.name);
        setBrand(editingCard.brand);
        setLimit(editingCard.limit.toString());
        setClosingDay(editingCard.closingDay.toString());
        setDueDay(editingCard.dueDay.toString());
        setColor(editingCard.color);
        setDefaultAccountId(editingCard.defaultAccountId || accounts[0]?.id || '');
      } else {
        setName('');
        setBrand('Mastercard');
        setLimit('5000');
        setClosingDay('20');
        setDueDay('27');
        setColor('#820ad1');
        setDefaultAccountId(accounts[0]?.id || '');
      }
    }
  }, [isOpen, editingCard?.id]);


  const handleSelectBrand = (b: typeof CARD_BRANDS[0]) => {
    setBrand(b.name);
    setColor(b.color);
  };

  const handleSelectBankPreset = (bank: typeof ALL_BANKS[0]) => {
    setName(`${bank.name} Crédito`);
    setColor(bank.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit) || 0;
    const cDay = parseInt(closingDay) || 20;
    const dDay = parseInt(dueDay) || 27;

    if (editingCard) {
      updateCard(editingCard.id, {
        name,
        brand,
        limit: numLimit,
        closingDay: cDay,
        dueDay: dDay,
        color,
        defaultAccountId,
      });
    } else {
      addCard({
        name,
        brand,
        limit: numLimit,
        closingDay: cDay,
        dueDay: dDay,
        color,
        defaultAccountId,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Realistic Interactive Card Mockup Preview */}
        <div
          className="relative w-full h-44 rounded-2xl p-5 text-white shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, #111827 100%)`,
          }}
        >
          {/* Top of Card */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-sm">
                P
              </div>
              <span className="text-xs font-black tracking-wider uppercase opacity-90">
                {name || 'Nome do Cartão'}
              </span>
            </div>
            <div className="p-1 rounded-lg bg-black/20 backdrop-blur-sm">
              <CardBrandLogo brand={brand} size={28} className="w-10 h-6" />
            </div>
          </div>

          {/* Chip & Contactless */}
          <div className="flex items-center gap-3 z-10">
            <div className="w-9 h-7 rounded bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-500/50 shadow-inner flex items-center justify-center">
              <div className="w-full h-[1px] bg-amber-600/40" />
            </div>
            <span className="text-lg opacity-60">📶</span>
          </div>

          {/* Bottom Cardholder and Limit */}
          <div className="flex items-end justify-between z-10">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-300 font-semibold">Titular</p>
              <p className="text-xs font-mono font-bold tracking-wider">{user.name.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-slate-300 font-semibold">Limite</p>
              <p className="text-xs font-bold">R$ {parseFloat(limit || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Card background glowing circle decorations */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* Visual Card Brand Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Selecione a Bandeira do Cartão
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {CARD_BRANDS.map((b) => {
              const isSelected = brand.toLowerCase() === b.name.toLowerCase();
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBrand(b)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 shadow-sm scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="relative mb-1.5 flex items-center justify-center">
                    <CardBrandLogo brand={b.name} size={26} className="w-12 h-7" />
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center leading-tight">
                    {b.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bank Presets (Quick Fill) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Preenchimento Rápido por Emissor
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {ALL_BANKS.slice(0, 8).map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => handleSelectBankPreset(bank)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shrink-0 transition-all"
              >
                <BankLogo nameOrId={bank.id} size={16} className="w-4 h-4 rounded" />
                <span>{bank.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Cartão *</label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank Ultravioleta, Inter Black..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Limite Total (R$) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={limit}
              onChange={e => setLimit(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dia Fechamento</label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={closingDay}
              onChange={e => setClosingDay(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dia Vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cor do Cartão</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-9 h-9 rounded-xl border-none cursor-pointer bg-transparent"
              />
              <span className="text-[11px] font-mono text-slate-500 uppercase">{color}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta para Débito da Fatura</label>
          <select
            value={defaultAccountId}
            onChange={e => setDefaultAccountId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value="">Nenhuma conta padrão selecionada</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.institution})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all"
          >
            {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
