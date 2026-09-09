import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { BankSelector } from '../ui/BankSelector';
import { useFinancial } from '../../context/FinancialContext';
import { Account, AccountType } from '../../types';
import { ALL_BANKS, BankLogo } from '../../utils/bankLogos';
import { Check } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
}

const ACCOUNT_COLOR_PRESETS = [
  { name: 'Esmeralda', color: '#10b981' },
  { name: 'Azul Real', color: '#0066b3' },
  { name: 'Roxo Finly', color: '#820ad1' },
  { name: 'Laranja Vibrante', color: '#ff7a00' },
  { name: 'Vermelho Carmim', color: '#ea1d25' },
  { name: 'Dourado / Ouro', color: '#f59e0b' },
  { name: 'Ciano Neon', color: '#00e5ff' },
  { name: 'Rosa Magenta', color: '#ec4899' },
  { name: 'Preto Obsidian', color: '#1e293b' },
];

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, editingAccount }) => {
  const { addAccount, updateAccount } = useFinancial();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [institution, setInstitution] = useState(ALL_BANKS[0].name);
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState(ALL_BANKS[0].color);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [includeInTotal, setIncludeInTotal] = useState(true);

  const prevIsOpenRef = React.useRef(false);
  const prevEditingIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isSwitching = editingAccount?.id !== prevEditingIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevEditingIdRef.current = editingAccount?.id || null;

    if (!isOpen) return;

    if (isOpening || isSwitching) {
      if (editingAccount) {
        setName(editingAccount.name);
        setType(editingAccount.type);
        setInstitution(editingAccount.institution);
        setBalance(editingAccount.balance !== undefined ? Number(editingAccount.balance).toFixed(2) : '0');
        setColor(editingAccount.color);
        setIncludeInTotal(editingAccount.includeInTotal);

        const refBank = ALL_BANKS.find(b => b.name.toLowerCase() === (editingAccount.institution || '').toLowerCase() || b.id.toLowerCase() === (editingAccount.institution || '').toLowerCase());
        const hasCustom = refBank ? refBank.color.toLowerCase() !== (editingAccount.color || '').toLowerCase() : true;
        setIsCustomColor(hasCustom);
      } else {
        setName('');
        setType('checking');
        setInstitution(ALL_BANKS[0].name);
        setBalance('0');
        setColor(ALL_BANKS[0].color);
        setIsCustomColor(false);
        setIncludeInTotal(true);
      }
    }
  }, [isOpen, editingAccount?.id]);

  const handleSelectBank = (bank: typeof ALL_BANKS[0]) => {
    setInstitution(bank.name);
    // Se ainda não escolheu cor customizada, usa a cor oficial da instituição
    if (!isCustomColor) {
      setColor(bank.color);
    }
    if (!name || ALL_BANKS.some(b => b.name === name)) {
      setName(bank.name);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setIsCustomColor(true);
  };

  const handleResetToBankColor = () => {
    const refBank = ALL_BANKS.find(b => b.name.toLowerCase() === institution.toLowerCase() || b.id.toLowerCase() === institution.toLowerCase());
    if (refBank) {
      setColor(refBank.color);
      setIsCustomColor(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance) || 0;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name,
        type,
        institution,
        balance: numBalance,
        color,
        includeInTotal,
      });
    } else {
      addAccount({
        name,
        type,
        institution,
        balance: numBalance,
        initialBalance: numBalance,
        color,
        includeInTotal,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visual Bank Selector */}
        <BankSelector
          selectedBankName={institution}
          onSelectBank={handleSelectBank}
          accentColor="emerald"
          title="Selecione o Banco / Instituição"
          maxHeightClass="max-h-52"
        />

        {/* Selected Bank Preview & Customization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Conta *</label>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                <BankLogo nameOrId={institution} size={24} className="w-6 h-6 rounded-md" />
              </div>
              <input
                type="text"
                required
                placeholder="Ex: Nubank Conta Principal..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Conta</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as AccountType)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <option value="checking">Conta Corrente</option>
              <option value="savings">Poupança</option>
              <option value="investment">Investimento / Corretora</option>
              <option value="cash">Dinheiro em Espécie</option>
              <option value="other">Outros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Saldo Atual (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={balance}
              onChange={e => setBalance(e.target.value !== undefined && e.target.value !== null ? Number(e.target.value).toFixed(2) : '')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Cor de Identificação da Conta
                </label>
                {isCustomColor ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Personalizada
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    Cor oficial
                  </span>
                )}
              </div>

              {isCustomColor && (
                <button
                  type="button"
                  onClick={handleResetToBankColor}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Restaurar para a cor padrão da instituição"
                >
                  <span>Restaurar cor do banco</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={color}
                  onChange={e => handleColorChange(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0.5 shadow-xs"
                  title="Abrir seletor visual de cor"
                />
                <input
                  type="text"
                  value={color}
                  onChange={e => handleColorChange(e.target.value)}
                  placeholder="#10b981"
                  className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 shadow-xs uppercase"
                />
              </div>

              {/* Paletas Rápidas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
                {ACCOUNT_COLOR_PRESETS.map(p => {
                  const isSelected = color.toLowerCase() === p.color.toLowerCase();
                  return (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => handleColorChange(p.color)}
                      className={`w-6 h-6 rounded-full shrink-0 transition-all cursor-pointer border ${
                        isSelected
                          ? 'scale-125 ring-2 ring-emerald-500 border-white shadow-sm'
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
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="includeTotal"
            checked={includeInTotal}
            onChange={e => setIncludeInTotal(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
          />
          <label htmlFor="includeTotal" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Incluir saldo no cálculo do patrimônio geral
          </label>
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
            {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
