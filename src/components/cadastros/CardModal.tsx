import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { BankSelector } from '../ui/BankSelector';
import { useFinancial } from '../../context/FinancialContext';
import { CreditCard } from '../../types';
import { CARD_BRANDS, CardBrandLogo, ALL_BANKS, BankLogo } from '../../utils/bankLogos';
import { CreditCard as CardIcon, Check, Building2 } from 'lucide-react';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: CreditCard | null;
}

const CARD_COLOR_PRESETS = [
  { name: 'Roxo Finly', color: '#820ad1' },
  { name: 'Indigo Noturno', color: '#4f46e5' },
  { name: 'Azul Real', color: '#0066b3' },
  { name: 'Ciano Neon', color: '#00e5ff' },
  { name: 'Esmeralda', color: '#10b981' },
  { name: 'Laranja Vibrante', color: '#ff7a00' },
  { name: 'Vermelho Carmim', color: '#ea1d25' },
  { name: 'Dourado / Ouro', color: '#f59e0b' },
  { name: 'Rosa Magenta', color: '#ec4899' },
  { name: 'Grafite Titanium', color: '#2b2b2b' },
  { name: 'Preto Obsidian', color: '#111827' },
];

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
  const prevEditingCardIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isSwitchingCard = isOpen && editingCard?.id !== prevEditingCardIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevEditingCardIdRef.current = editingCard?.id;

    if (!isOpen) return;

    if (isOpening || isSwitchingCard) {
      if (editingCard) {
        setName(editingCard.name || '');
        setBrand(editingCard.brand || 'Mastercard');
        setLimit(editingCard.limit !== undefined ? Number(editingCard.limit).toString() : '0');
        setClosingDay(editingCard.closingDay ? editingCard.closingDay.toString() : '20');
        setDueDay(editingCard.dueDay ? editingCard.dueDay.toString() : '27');
        setColor(editingCard.color || '#820ad1');
        setDefaultAccountId(editingCard.defaultAccountId || accounts[0]?.id || '');

        // Preserve existing bankId, or match bank from name if possible
        if (editingCard.bankId) {
          setSelectedBankId(editingCard.bankId);
        } else {
          const foundBank = ALL_BANKS.find(b =>
            (editingCard.name && editingCard.name.toLowerCase().includes(b.name.toLowerCase())) ||
            (editingCard.name && editingCard.name.toLowerCase().includes(b.id))
          );
          if (foundBank) setSelectedBankId(foundBank.id);
        }
      } else {
        const defaultBank = ALL_BANKS[0]; // Nubank
        setSelectedBankId(defaultBank.id);
        setName(`${defaultBank.name} Crédito`);
        setBrand('Mastercard');
        setLimit('5000');
        setClosingDay('20');
        setDueDay('27');
        setColor(defaultBank.color);
        setDefaultAccountId(accounts[0]?.id || '');
      }
    }
  }, [isOpen, editingCard?.id]);

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
    const cleanLimitStr = limit.toString().replace(/\./g, '').replace(',', '.');
    const numLimit = parseFloat(cleanLimitStr) || parseFloat(limit) || 0;
    const cDay = Math.min(31, Math.max(1, parseInt(closingDay, 10) || 20));
    const dDay = Math.min(31, Math.max(1, parseInt(dueDay, 10) || 27));
    const finalName = name.trim() || 'Cartão de Crédito';

    if (editingCard) {
      updateCard(editingCard.id, {
        name: finalName,
        brand,
        limit: numLimit,
        closingDay: cDay,
        dueDay: dDay,
        color,
        defaultAccountId,
        bankId: selectedBankId,
      });
    } else {
      addCard({
        name: finalName,
        brand,
        limit: numLimit,
        closingDay: cDay,
        dueDay: dDay,
        color,
        defaultAccountId,
        bankId: selectedBankId,
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
        <BankSelector
          selectedBankId={selectedBankId}
          onSelectBank={handleSelectBank}
          accentColor="purple"
          title="Selecione o Emissor / Banco (Principal)"
          maxHeightClass="max-h-56"
        />

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

          <div className="col-span-3 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cor do Cartão & Tema</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                title="Personalizar cor"
              />
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
            {/* Paletas de Cor Rápidas */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              {CARD_COLOR_PRESETS.map(p => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => setColor(p.color)}
                  className={`w-5 h-5 rounded-full shrink-0 transition-transform cursor-pointer border ${
                    color.toLowerCase() === p.color.toLowerCase()
                      ? 'scale-125 ring-2 ring-purple-500 border-white'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
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
            className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
