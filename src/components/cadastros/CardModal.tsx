import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useFinancial } from '../../context/FinancialContext';
import { CreditCard } from '../../types';
import { CARD_BRANDS, CardBrandLogo, ALL_BANKS, BankLogo } from '../../utils/bankLogos';
import { CreditCard as CardIcon, Check, Building2 } from 'lucide-react';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: CreditCard | null;
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, editingCard }) => {
  const { addCard, updateCard, accounts, user } = useFinancial();

  const [selectedBankId, setSelectedBankId] = useState('nubank');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Mastercard');
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
        setLimit(editingCard.limit !== undefined ? Number(editingCard.limit).toFixed(2) : '0');
        setClosingDay(editingCard.closingDay.toString());
        setDueDay(editingCard.dueDay.toString());
        setColor(editingCard.color);
        setDefaultAccountId(editingCard.defaultAccountId || accounts[0]?.id || '');

        // Match bank from name if possible
        const foundBank = ALL_BANKS.find(b => editingCard.name.toLowerCase().includes(b.name.toLowerCase()) || editingCard.name.toLowerCase().includes(b.id));
        if (foundBank) setSelectedBankId(foundBank.id);
      } else {
        const defaultBank = ALL_BANKS[0]; // Nubank
        setSelectedBankId(defaultBank.id);
        setName(`${defaultBank.name} Crédito`);
        setBrand('Mastercard');
        setLimit('5000.00');
        setClosingDay('20');
        setDueDay('27');
        setColor(defaultBank.color);
        setDefaultAccountId(accounts[0]?.id || '');
      }
    }
  }, [isOpen, editingCard?.id, accounts]);

  const handleSelectBank = (bank: typeof ALL_BANKS[0]) => {
    setSelectedBankId(bank.id);
    setName(`${bank.name} Crédito`);
    setColor(bank.color);
  };

  const handleSelectBrand = (b: typeof CARD_BRANDS[0]) => {
    setBrand(b.name);
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
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 scrollbar-thin">
        {/* ========================================================================= */}
        {/* 1. REALISTIC CARD PREVIEW (EMISSOR/BANCO MAIOR + BANDEIRA MENOR) */}
        {/* ========================================================================= */}
        <div
          className="relative w-full h-44 rounded-[25px] p-5 text-white shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 border border-white/10"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, #111827 100%)`,
          }}
        >
          {/* Top of Card: Bank Logo (Larger) + Brand Logo (Smaller) */}
          <div className="flex items-center justify-between z-10">
            {/* Bank / Emissor (PROMINENT & LARGE) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center p-1.5 shadow-md border border-white/20">
                <BankLogo nameOrId={selectedBankId || name} size={28} className="w-7 h-7 rounded-lg" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider uppercase block text-white drop-shadow-sm">
                  {name || 'Nome do Cartão'}
                </span>
                <span className="text-[10px] text-white/70 font-semibold uppercase">Crédito</span>
              </div>
            </div>

            {/* Brand Logo (SMALLER & COMPACT) */}
            <div className="px-2.5 py-1 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xs">
              <CardBrandLogo brand={brand} size={22} className="w-8 h-5" />
            </div>
          </div>

          {/* Chip & Contactless Wave */}
          <div className="flex items-center gap-3 z-10 my-auto">
            <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-500/50 shadow-inner flex items-center justify-center">
              <div className="w-full h-[1px] bg-amber-600/40" />
            </div>
            <span className="text-lg opacity-60">📶</span>
          </div>

          {/* Bottom: Cardholder and Limit */}
          <div className="flex items-end justify-between z-10">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-300 font-semibold">Titular</p>
              <p className="text-xs font-mono font-bold tracking-wider">{user.name.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-slate-300 font-semibold">Limite Total</p>
              <p className="text-sm font-black text-emerald-400">
                R$ {parseFloat(limit || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Background Decorative Glow */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </div>

        {/* ========================================================================= */}
        {/* 2. PRIMARY: SELETOR DE EMISSOR / BANCO (DESTAQUE PRINCIPAL & MAIOR) */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Selecione o Emissor / Banco (Principal)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-bold">{ALL_BANKS.length} bancos disponíveis</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 scrollbar-thin">
            {ALL_BANKS.map((bank) => {
              const isSelected = selectedBankId.toLowerCase() === bank.id.toLowerCase() || name.toLowerCase().includes(bank.name.toLowerCase());
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleSelectBank(bank)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/40 shadow-sm scale-[1.02]'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-900 shrink-0 shadow-xs">
                    <BankLogo nameOrId={bank.id} size={20} className="w-5 h-5 rounded" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                      {bank.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SECONDARY: SELETOR DE BANDEIRA (COMPACTO & MENOR) */}
        {/* ========================================================================= */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            Bandeira do Cartão (Secundário)
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {CARD_BRANDS.map((b) => {
              const isSelected = brand.toLowerCase() === b.name.toLowerCase();
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBrand(b)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-center transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <CardBrandLogo brand={b.name} size={18} className="w-6 h-4" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {b.name}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. DADOS DO CARTÃO (NOME, LIMITE, DATAS, COR) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Cartão *</label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank Ultravioleta, Inter Black..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Limite Total (R$) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={limit}
              onChange={e => setLimit(e.target.value !== undefined && e.target.value !== null ? e.target.value : '')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs"
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
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs"
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
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cor do Cartão</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
