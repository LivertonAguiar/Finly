import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useFinancial } from '../../context/FinancialContext';
import { Account, AccountType } from '../../types';
import { ALL_BANKS, BankLogo } from '../../utils/bankLogos';
import { Check } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, editingAccount }) => {
  const { addAccount, updateAccount } = useFinancial();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [institution, setInstitution] = useState(ALL_BANKS[0].name);
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState(ALL_BANKS[0].color);
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
      } else {
        setName('');
        setType('checking');
        setInstitution(ALL_BANKS[0].name);
        setBalance('0');
        setColor(ALL_BANKS[0].color);
        setIncludeInTotal(true);
      }
    }
  }, [isOpen, editingAccount?.id]);


  const handleSelectBank = (bank: typeof ALL_BANKS[0]) => {
    setInstitution(bank.name);
    setColor(bank.color);
    if (!name || ALL_BANKS.some(b => b.name === name)) {
      setName(bank.name);
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
        {/* Visual Bank Selector Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Selecione o Banco / Instituição
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
            {ALL_BANKS.map((b) => {
              const isSelected = institution.toLowerCase() === b.name.toLowerCase();
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBank(b)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="relative mb-1">
                    <BankLogo nameOrId={b.id} size={28} className="w-7 h-7 rounded-lg shadow-xs" />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                    {b.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cor de Identificação</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-9 h-9 rounded-xl border-none cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">{color}</span>
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
