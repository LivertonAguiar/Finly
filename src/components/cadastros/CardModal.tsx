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
  const [isCustomColor, setIsCustomColor] = useState(false);
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
        let detectedBankId = 'nubank';
        if (editingCard.bankId) {
          detectedBankId = editingCard.bankId;
          setSelectedBankId(editingCard.bankId);
        } else {
          const foundBank = ALL_BANKS.find(b =>
            (editingCard.name && editingCard.name.toLowerCase().includes(b.name.toLowerCase())) ||
            (editingCard.name && editingCard.name.toLowerCase().includes(b.id))
          );
          if (foundBank) {
            detectedBankId = foundBank.id;
            setSelectedBankId(foundBank.id);
          }
        }

        const refBank = ALL_BANKS.find(b => b.id === detectedBankId);
        const hasCustomColor = refBank ? refBank.color.toLowerCase() !== (editingCard.color || '').toLowerCase() : true;
        setIsCustomColor(hasCustomColor);
      } else {
        const defaultBank = ALL_BANKS[0]; // Nubank
        setSelectedBankId(defaultBank.id);
        setName(`${defaultBank.name} Crédito`);
        setBrand('Mastercard');
        setLimit('5000');
        setClosingDay('20');
        setDueDay('27');
        setColor(defaultBank.color);
        setIsCustomColor(false);
        setDefaultAccountId(accounts[0]?.id || '');
      }
    }
  }, [isOpen, editingCard?.id]);

  const handleSelectBank = (bank: typeof ALL_BANKS[0]) => {
    setSelectedBankId(bank.id);
    // Se o usuário ainda não personalizou a cor manualmente, aplica a cor oficial do novo banco selecionado
    if (!isCustomColor) {
      setColor(bank.color);
    }
    if (bank.id === 'bradesconeo' && (!editingCard || brand === 'Mastercard')) {
      setBrand('Visa');
    }
    // Only update name if empty or if it was the default generated name
    const isDefaultName =
      !name.trim() ||
      ALL_BANKS.some(b => name.trim() === `${b.name} Crédito` || name.trim() === b.name);
    if (isDefaultName) {
      setName(`${bank.name} Crédito`);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setIsCustomColor(true);
  };

  const handleResetToBankColor = () => {
    const b = ALL_BANKS.find(item => item.id === selectedBankId);
    if (b) {
      setColor(b.color);
      setIsCustomColor(false);
    }
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

  const currentBank = ALL_BANKS.find(b => b.id === selectedBankId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 pr-1">
        {/* ========================================================================= */}
        {/* 1. REALISTIC CARD PREVIEW (TEMA ATIVO DINÂMICO + ÍCONE DO BANCO PROEMINENTE) */}
        {/* ========================================================================= */}
        <div
          className="relative w-full h-48 rounded-[26px] p-5 text-white shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-500 border"
          style={{
            background: (selectedBankId === 'bradesconeo' && !isCustomColor)
              ? 'linear-gradient(125deg, #d60036 0%, #7a1862 48%, #162970 100%)'
              : `linear-gradient(135deg, ${color} 0%, ${color}dd 42%, #0f172a 100%)`,
            borderColor: `${color}80`,
            boxShadow: `0 16px 36px -6px ${color}60, 0 4px 14px rgba(0,0,0,0.45)`,
          }}
        >
          {/* Padrão dinâmico de linhas diagonais para o Bradesco Neo */}
          {selectedBankId === 'bradesconeo' && !isCustomColor && (
            <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="modal-neo-lines" width="12" height="12" patternTransform="rotate(28 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="12" stroke="#ff3b69" strokeWidth="1.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#modal-neo-lines)" />
              </svg>
            </div>
          )}

          {/* Top of Card: Bank Logo (Prominent) + Bank Emblem */}
          <div className="flex items-center justify-between z-10">
            {/* Bank / Emissor (PROMINENT & LARGE) */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center p-1.5 shadow-md border border-white/30 transition-transform duration-300 hover:scale-105">
                <BankLogo nameOrId={selectedBankId || name} size={30} className="w-8 h-8 rounded-xl object-contain" />
              </div>
              <div>
                <span className="text-sm font-black tracking-wider uppercase block text-white drop-shadow-md truncate max-w-[200px] sm:max-w-[280px]">
                  {name || 'Nome do Cartão'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/25 backdrop-blur-sm border border-white/15">
                    Crédito
                  </span>
                  <span className="text-[10px] text-white/80 font-semibold">
                    {currentBank?.name || 'Emissor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Emblem / Badge (Substitui bandeira pelo ícone do banco) */}
            <div
              className="px-3 py-1.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-sm transition-all"
              style={{ borderColor: `${color}70` }}
            >
              <BankLogo nameOrId={selectedBankId || name} size={18} className="w-5 h-5 rounded-md object-contain" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                {currentBank?.name || 'Banco'}
              </span>
            </div>
          </div>

          {/* Chip & Contactless Wave / NEO Branding */}
          <div className="flex items-center gap-3 z-10 my-auto">
            <div className="w-10 h-7 rounded-lg bg-gradient-to-tr from-amber-300 via-amber-400 to-amber-200 border border-amber-500/60 shadow-md flex items-center justify-center">
              <div className="w-full h-[1px] bg-amber-600/50" />
            </div>
            {selectedBankId === 'bradesconeo' ? (
              <span className="text-sm font-black tracking-[0.3em] text-white/95 uppercase drop-shadow-md ml-1">
                NEO
              </span>
            ) : (
              <span className="text-lg opacity-75 drop-shadow-sm">📶</span>
            )}
          </div>

          {/* Bottom: Cardholder and Limit */}
          <div className="flex items-end justify-between z-10">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-200/90 font-bold">Titular</p>
              <p className="text-xs font-mono font-black tracking-wider text-white drop-shadow-sm">{user.name.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-slate-200/90 font-bold">Limite Total</p>
              <p className="text-base font-black text-emerald-300 drop-shadow-md">
                R$ {parseFloat(limit || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Background Decorative Glow Synced with Theme Color */}
          <div
            className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-60"
            style={{ backgroundColor: color }}
          />
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

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* 5. SELEÇÃO DE COR LIVRE E INDEPENDENTE DO BANCO */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Cor do Cartão & Tema Visual
              </label>
              {isCustomColor ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  Personalizada
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  Cor oficial do banco
                </span>
              )}
            </div>

            {currentBank && isCustomColor && (
              <button
                type="button"
                onClick={handleResetToBankColor}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
                title={`Voltar para a cor oficial do ${currentBank.name} (${currentBank.color})`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40" style={{ backgroundColor: currentBank.color }} />
                <span>Restaurar cor do {currentBank.name}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={e => handleColorChange(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0.5 shadow-xs"
                  title="Abrir seletor visual de cor"
                />
              </div>
              <input
                type="text"
                value={color}
                onChange={e => handleColorChange(e.target.value)}
                placeholder="#820ad1"
                className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 shadow-xs uppercase"
              />
            </div>

            {/* Paletas de Cor Rápidas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
              {CARD_COLOR_PRESETS.map(p => {
                const isSelected = color.toLowerCase() === p.color.toLowerCase();
                return (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => handleColorChange(p.color)}
                    className={`w-6 h-6 rounded-full shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? 'scale-125 ring-2 ring-purple-500 border-white shadow-sm'
                        : 'border-white/30 hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                  />
                );
              })}
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
