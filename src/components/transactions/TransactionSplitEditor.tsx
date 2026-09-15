import React, { useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, Layers, Sparkles } from 'lucide-react';
import type { Category, ComponentRepetitionType, FinancialNature, TransactionComponent } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { toCents, fromCents, validateTransactionComponents } from '../../utils/transactionAnalytics';
import { FINANCIAL_NATURE_CONFIG, inferSmartTaxonomy } from '../../utils/smartTaxonomy';

export type SplitFormItem = {
  id?: string;
  description: string;
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  financialNature?: FinancialNature;
  necessity?: 'essential' | 'discretionary' | 'strategic';
  type?: ComponentRepetitionType;
  currentInstallment?: number;
  totalInstallments?: number;
  notes?: string;
};

interface TransactionSplitEditorProps {
  totalAmount: number;
  components: SplitFormItem[];
  onChange: (items: SplitFormItem[]) => void;
  categories: Category[];
  isRecurring?: boolean;
  currency?: string;
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
}

const COMMON_PRESETS = [
  { label: 'Taxa Condominial', defaultType: 'fixed' as const },
  { label: 'Água / Esgoto', defaultType: 'variable' as const },
  { label: 'Taxa Extra', defaultType: 'temporary' as const },
  { label: 'Salão de Festas / Deck', defaultType: 'one_time' as const },
  { label: 'Fundo de Reserva', defaultType: 'fixed' as const },
];

export const TransactionSplitEditor: React.FC<TransactionSplitEditorProps> = ({
  totalAmount,
  components,
  onChange,
  categories,
  isRecurring = false,
  currency = 'BRL',
  defaultCategoryId = '',
  defaultSubcategoryId = '',
}) => {
  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories],
  );

  const validation = useMemo(
    () => validateTransactionComponents(totalAmount, components),
    [totalAmount, components],
  );

  const handleAddItem = (presetDescription?: string, presetType?: ComponentRepetitionType) => {
    const inferred = inferSmartTaxonomy({
      description: presetDescription || '',
      type: 'expense',
      categoryId: '',
      subcategoryId: '',
    });

    const newItem: SplitFormItem = {
      id: `comp-draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: presetDescription || '',
      amount: 0,
      categoryId: '',
      subcategoryId: '',
      financialNature: inferred.financialNature,
      necessity: inferred.characteristics.necessity,
      type: presetType || (isRecurring ? 'fixed' : 'one_time'),
      currentInstallment: undefined,
      totalInstallments: undefined,
    };

    onChange([...components, newItem]);
  };

  const handleUpdateItem = (index: number, patch: Partial<SplitFormItem>) => {
    const current = components[index];
    let nextFinancialNature = patch.financialNature !== undefined ? patch.financialNature : current.financialNature;
    if (patch.description && !current.financialNature) {
      const inferred = inferSmartTaxonomy({
        description: patch.description,
        type: 'expense',
        categoryId: patch.categoryId || current.categoryId,
        subcategoryId: patch.subcategoryId || current.subcategoryId,
      });
      nextFinancialNature = inferred.financialNature;
    }
    const updated = components.map((item, i) =>
      i === index ? { ...item, ...patch, financialNature: nextFinancialNature } : item
    );
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    onChange(components.filter((_, i) => i !== index));
  };

  const handleDistributeRemainder = () => {
    if (validation.difference <= 0) return;

    if (components.length === 0) {
      handleAddItem();
      return;
    }

    // Adiciona o restante ao último item existente
    const lastIndex = components.length - 1;
    const lastItem = components[lastIndex];
    const newLastAmount = fromCents(toCents(lastItem.amount) + validation.diffCents);

    handleUpdateItem(lastIndex, { amount: Math.max(0, newLastAmount) });
  };

  const fieldClass =
    'w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all';
  const labelClass = 'block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1';

  return (
    <div className="rounded-2xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/10 p-3.5 sm:p-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/50 dark:border-purple-900/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/40">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              Detalhamento por Categorias
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Divida esta transação em vários itens sem criar débitos extras na sua conta.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAddItem()}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar item</span>
        </button>
      </div>

      {/* Atalhos rápidos para condomínio / boletos */}
      {components.length === 0 && (
        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Sugestões rápidas de itens:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_PRESETS.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleAddItem(preset.label, preset.defaultType)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-purple-100 dark:bg-slate-700 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 transition-colors border border-slate-200 dark:border-slate-600/60 cursor-pointer"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Itens do Detalhamento */}
      <div className="space-y-3">
        {components.map((item, index) => {
          const selectedCategory = expenseCategories.find(c => c.id === item.categoryId);

          return (
            <div
              key={item.id || index}
              className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                  Item #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Remover item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Descrição do Item */}
                <div className="sm:col-span-8">
                  <label className={labelClass}>Descrição do item</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="Ex: Taxa ordinária, Água, Material..."
                    value={item.description}
                    onChange={e => handleUpdateItem(index, { description: e.target.value })}
                    required
                  />
                </div>

                {/* Valor */}
                <div className="sm:col-span-4">
                  <label className={labelClass}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className={`${fieldClass} font-bold text-right`}
                    value={item.amount || ''}
                    onChange={e =>
                      handleUpdateItem(index, {
                        amount: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    required
                  />
                </div>

                {/* Categoria (Largura ampla para evitar corte) */}
                <div className="sm:col-span-6">
                  <label className={labelClass}>Categoria</label>
                  <select
                    className={fieldClass}
                    value={item.categoryId}
                    onChange={e =>
                      handleUpdateItem(index, {
                        categoryId: e.target.value,
                        subcategoryId: '',
                      })
                    }
                    required
                  >
                    <option value="">Selecione uma categoria...</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategoria (Largura ampla para evitar corte) */}
                <div className="sm:col-span-6">
                  <label className={labelClass}>Subcategoria</label>
                  <select
                    className={fieldClass}
                    value={item.subcategoryId || ''}
                    onChange={e => handleUpdateItem(index, { subcategoryId: e.target.value })}
                  >
                    <option value="">
                      {!item.categoryId
                        ? 'Selecione primeiro uma categoria'
                        : selectedCategory?.subcategories && selectedCategory.subcategories.length > 0
                        ? `Nenhuma (${selectedCategory.subcategories.length} disponíveis)`
                        : 'Sem subcategorias cadastradas'}
                    </option>
                    {selectedCategory?.subcategories?.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.icon ? `${sub.icon} ` : ''}
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Natureza Contábil deste item */}
                <div className="sm:col-span-12 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-bold uppercase text-[9.5px]">Natureza Contábil:</span>
                  <select
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                    value={item.financialNature || 'expense'}
                    onChange={e =>
                      handleUpdateItem(index, {
                        financialNature: e.target.value as FinancialNature,
                      })
                    }
                  >
                    {Object.values(FINANCIAL_NATURE_CONFIG).map(cfg => (
                      <option key={cfg.id} value={cfg.id}>
                        {cfg.icon} {cfg.label}
                      </option>
                    ))}
                  </select>
                  {item.financialNature && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase"
                      style={{
                        backgroundColor:
                          FINANCIAL_NATURE_CONFIG[item.financialNature]?.color || '#8b5cf6',
                      }}
                    >
                      {FINANCIAL_NATURE_CONFIG[item.financialNature]?.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Opções de Repetição para despesas fixas recorrentes */}
              {isRecurring && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={labelClass}>Comportamento mensal</label>
                    <select
                      className={fieldClass}
                      value={item.type || 'fixed'}
                      onChange={e => {
                        const newType = e.target.value as ComponentRepetitionType;
                        handleUpdateItem(index, {
                          type: newType,
                          ...(newType !== 'temporary'
                            ? { currentInstallment: undefined, totalInstallments: undefined }
                            : {}),
                        });
                      }}
                    >
                      <option value="fixed">Fixo (copiar todo mês)</option>
                      <option value="variable">Variável (confirmar valor a cada mês)</option>
                      <option value="temporary">Temporário (taxa com parcelas)</option>
                      <option value="one_time">Eventual (somente neste mês)</option>
                    </select>
                  </div>

                  {item.type === 'temporary' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Parcela atual</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ex: 1"
                          className={fieldClass}
                          value={item.currentInstallment !== undefined ? item.currentInstallment : ''}
                          onChange={e => {
                            const val = e.target.value;
                            handleUpdateItem(index, {
                              currentInstallment: val === '' ? undefined : parseInt(val, 10) || undefined,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Total parcelas</label>
                        <input
                          type="number"
                          min="2"
                          max="120"
                          placeholder="Ex: 12"
                          className={fieldClass}
                          value={item.totalInstallments !== undefined ? item.totalInstallments : ''}
                          onChange={e => {
                            const val = e.target.value;
                            handleUpdateItem(index, {
                              totalInstallments: val === '' ? undefined : parseInt(val, 10) || undefined,
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de Resumo e Distribuição */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Total da transação:</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Distribuído nos itens:</span>
          <span className="font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(validation.distributedAmount, currency)}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {validation.isValid ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% distribuído</span>
              </span>
            ) : validation.difference > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Faltam {formatCurrency(validation.difference, currency)}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Excede em {formatCurrency(Math.abs(validation.difference), currency)}</span>
              </span>
            )}
          </div>

          {validation.difference > 0 && (
            <button
              type="button"
              onClick={handleDistributeRemainder}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
            >
              Distribuir restante
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
