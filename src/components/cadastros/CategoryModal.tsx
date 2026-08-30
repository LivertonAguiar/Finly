import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { EmojiPicker } from '../ui/EmojiPicker';
import { useFinancial } from '../../context/FinancialContext';
import { Category } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  defaultType?: 'income' | 'expense' | 'transfer';
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
  defaultType = 'expense',
}) => {
  const { addCategory, updateCategory } = useFinancial();

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(defaultType);
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#10b981');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setIcon(editingCategory.icon || '📁');
      setColor(editingCategory.color || '#10b981');
    } else {
      setName('');
      setType(defaultType);
      setIcon(defaultType === 'income' ? '💰' : defaultType === 'transfer' ? '🔄' : '🍽️');
      setColor('#10b981');
    }
  }, [editingCategory, defaultType, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, { name, type, icon, color });
    } else {
      addCategory({ name, type, icon, color });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo da Categoria</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Movimentação
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Categoria *</label>
          <input
            type="text"
            required
            placeholder="Ex: Supermercado, Viagens, Salário..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Emoji / Ícone Identificador (Selecionado: {icon})
          </label>
          <EmojiPicker selectedEmoji={icon} onSelectEmoji={setIcon} />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
          >
            {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
