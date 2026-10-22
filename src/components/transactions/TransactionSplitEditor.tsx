import React, { useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, Layers, Sparkles, Tag } from 'lucide-react';
import type { Category, ComponentRepetitionType, FinancialNature, Transaction, TransactionComponent } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { toCents, fromCents, validateTransactionComponents } from '../../utils/transactionAnalytics';
import { inferSmartTaxonomy } from '../../utils/smartTaxonomy';
import {
  predictCategoryAndSubcategory,
  suggestDynamicTags,
  normalizeTag,
} from '../../utils/smartCategorizer';
import { SubcategoryPicker } from '../ui/SubcategoryPicker';
import { OptionPicker } from '../ui/OptionPicker';

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
  predictedCategoryName?: string;
  predictedSubcategoryName?: string;
  manuallySelectedCategory?: boolean;
};

interface TransactionSplitEditorProps {
  totalAmount: number;
  components: SplitFormItem[];
  onChange: (items: SplitFormItem[]) => void;
  categories: Category[];
  historicalTransactions?: Transaction[];
  onAddTag?: (tag: string) => void;
  isRecurring?: boolean;
  currency?: string;
  defaultCategoryId?: string;
  defaultSubcategoryId?: string;
  onUpdateTotalAmount?: (newTotal: number) => void;
}

const COMMON_PRESETS = [
  { label: 'Taxa Condominial', defaultType: 'fixed' as const },
  { label: 'Gás de Cozinha', defaultType: 'variable' as const },
  { label: 'Água / Esgoto', defaultType: 'variable' as const },
  { label: 'Energia Elétrica', defaultType: 'variable' as const },
  { label: 'Taxa Extra', defaultType: 'temporary' as const },
  { label: 'Salão de Festas / Deck', defaultType: 'one_time' as const },
  { label: 'Fundo de Reserva', defaultType: 'fixed' as const },
];

export const TransactionSplitEditor: React.FC<TransactionSplitEditorProps> = ({
  totalAmount,
  components,
  onChange,
  categories,
  historicalTransactions = [],
  onAddTag,
  isRecurring = false,
  currency = 'BRL',
  defaultCategoryId = '',
  defaultSubcategoryId = '',
  onUpdateTotalAmount,
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
    let initialCatId = '';
    let initialSubId = '';
    let predCatName = '';
    let predSubName = '';

    if (presetDescription && presetDescription.trim().length >= 3) {
      const pred = predictCategoryAndSubcategory(presetDescription, 'expense', categories, historicalTransactions);
      if (pred) {
        initialCatId = pred.categoryId;
        initialSubId = pred.subcategoryId || '';
        predCatName = pred.categoryName;
        predSubName = pred.subcategoryName || '';
      }
    }

    const inferred = inferSmartTaxonomy({
      description: presetDescription || '',
      type: 'expense',
      categoryId: initialCatId,
      subcategoryId: initialSubId,
    });

    const newItem: SplitFormItem = {
      id: `comp-draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: presetDescription || '',
      amount: 0,
      categoryId: initialCatId,
      subcategoryId: initialSubId,
      financialNature: inferred.financialNature,
      necessity: inferred.characteristics.necessity,
      type: presetType || (isRecurring ? 'fixed' : 'one_time'),
      currentInstallment: undefined,
      totalInstallments: undefined,
      predictedCategoryName: predCatName,
      predictedSubcategoryName: predSubName,
      manuallySelectedCategory: false,
    };

    onChange([...components, newItem]);
  };

  const handleUpdateItem = (index: number, patch: Partial<SplitFormItem>) => {
    const current = components[index];
    let nextPatch = { ...patch };

    // Previsão automática inteligente ao alterar a descrição
    if (patch.description !== undefined) {
      const desc = patch.description.trim();
      if (desc.length >= 3 && !current.manuallySelectedCategory) {
        const pred = predictCategoryAndSubcategory(desc, 'expense', categories, historicalTransactions);
        if (pred) {
          nextPatch.categoryId = pred.categoryId;
          nextPatch.subcategoryId = pred.subcategoryId || '';
          nextPatch.predictedCategoryName = pred.categoryName;
          nextPatch.predictedSubcategoryName = pred.subcategoryName || '';
        }
      } else if (desc.length < 3 && current.predictedCategoryName) {
        nextPatch.predictedCategoryName = undefined;
        nextPatch.predictedSubcategoryName = undefined;
      }
    }

    // Se o usuário selecionou manualmente a categoria no picker
    if (patch.categoryId !== undefined && patch.description === undefined) {
      nextPatch.manuallySelectedCategory = true;
      nextPatch.predictedCategoryName = undefined;
      nextPatch.predictedSubcategoryName = undefined;
    }

    const shouldReclassify = nextPatch.description !== undefined
      || nextPatch.categoryId !== undefined
      || nextPatch.subcategoryId !== undefined;
    let nextFinancialNature = current.financialNature;
    let nextNecessity = current.necessity;
    if (shouldReclassify) {
      const inferred = inferSmartTaxonomy({
        description: nextPatch.description ?? current.description,
        type: 'expense',
        categoryId: nextPatch.categoryId ?? current.categoryId,
        subcategoryId: nextPatch.subcategoryId ?? current.subcategoryId,
      });
      nextFinancialNature = inferred.financialNature;
      nextNecessity = inferred.characteristics.necessity;
    }
    const updated = components.map((item, i) =>
      i === index ? {
        ...item,
        ...nextPatch,
        financialNature: nextFinancialNature,
        necessity: nextNecessity,
      } : item
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
                  <OptionPicker
                    title="Escolher Categoria"
                    placeholder="Selecione uma categoria..."
                    searchPlaceholder="Buscar categoria..."
                    value={item.categoryId}
                    onChange={val =>
                      handleUpdateItem(index, {
                        categoryId: String(val),
                        subcategoryId: '',
                      })
                    }
                    options={expenseCategories.map(cat => ({
                      value: cat.id,
                      label: cat.name,
                      icon: <span className="text-base">{cat.icon}</span>,
                    }))}
                  />
                </div>

                {/* Subcategoria (Largura ampla para evitar corte) */}
                <div className="sm:col-span-6">
                  <label className={labelClass}>Subcategoria</label>
                  <SubcategoryPicker
                    value={item.subcategoryId || ''}
                    disabled={!item.categoryId || !selectedCategory?.subcategories?.length}
                    subcategories={selectedCategory?.subcategories}
                    onChange={value => handleUpdateItem(index, { subcategoryId: value })}
                  />
                </div>
              </div>

              {/* Sugestões e Tags Inteligentes do Item */}
              {(item.predictedCategoryName || (item.description && item.description.trim().length >= 2)) && (
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/40 text-xs">
                  {/* Badge de Previsão de Categoria */}
                  {item.predictedCategoryName ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-[11px] font-medium animate-in fade-in">
                      <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                      <span>
                        Sugerido: <strong>{item.predictedCategoryName}</strong>
                        {item.predictedSubcategoryName ? ` > ${item.predictedSubcategoryName}` : ''}
                      </span>
                    </div>
                  ) : <div />}

                  {/* Micro-tags sugeridas com 1 clique para o lançamento */}
                  {onAddTag && (() => {
                    const itemSuggestedTags = suggestDynamicTags({
                      description: item.description,
                      categoryId: item.categoryId,
                      subcategoryId: item.subcategoryId,
                      categories,
                      historicalTransactions,
                      limit: 4,
                    });
                    if (itemSuggestedTags.length === 0) return null;
                    return (
                      <div className="inline-flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" /> Tags:
                        </span>
                        {itemSuggestedTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => onAddTag(tag)}
                            title={`Adicionar #${tag} ao lançamento`}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-purple-100 dark:bg-slate-700/80 dark:hover:bg-purple-900/60 text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-600/60"
                          >
                            + #{tag}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Opções de Repetição para despesas fixas recorrentes */}
              {isRecurring && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={labelClass}>Comportamento mensal</label>
                    <OptionPicker
                      title="Comportamento Mensal"
                      value={item.type || 'fixed'}
                      onChange={val => {
                        const newType = val as ComponentRepetitionType;
                        handleUpdateItem(index, {
                          type: newType,
                          ...(newType !== 'temporary'
                            ? { currentInstallment: undefined, totalInstallments: undefined }
                            : {}),
                        });
                      }}
                      options={[
                        { value: 'fixed', label: 'Fixo (copiar todo mês)' },
                        { value: 'variable', label: 'Variável (confirmar valor a cada mês)' },
                        { value: 'temporary', label: 'Temporário (taxa com parcelas)' },
                        { value: 'one_time', label: 'Eventual (somente neste mês)' },
                      ]}
                    />
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

          <div className="flex items-center gap-1.5 flex-wrap">
            {validation.difference > 0 && (
              <button
                type="button"
                onClick={handleDistributeRemainder}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
              >
                Distribuir restante
              </button>
            )}
            {!validation.isValid && onUpdateTotalAmount && (
              <button
                type="button"
                onClick={() => onUpdateTotalAmount(validation.distributedAmount)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 transition-colors cursor-pointer"
              >
                Ajustar total para {formatCurrency(validation.distributedAmount, currency)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
