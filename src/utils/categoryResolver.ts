import { Category, Subcategory, TransactionType } from '../types';
import { DEFAULT_CATEGORIES } from './defaultCategories';

export interface ResolvedCategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  subName?: string;
  subIcon?: string;
  isCustomFallback?: boolean;
}

const KNOWN_ALIASES: Record<string, { categoryId: string; subcategoryId?: string; name?: string; icon?: string }> = {
  'cat-desp-tecnologia': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-informatica', name: 'Compras & Pessoal', icon: '🛍️' },
  'tecnologia': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-informatica', name: 'Compras & Pessoal', icon: '🛍️' },
  'cat-desp-viagens': { categoryId: 'cat-desp-lazer', subcategoryId: 'sub-lazer-viagens', name: 'Lazer & Entretenimento', icon: '🎮' },
  'viagens': { categoryId: 'cat-desp-lazer', subcategoryId: 'sub-lazer-viagens', name: 'Lazer & Entretenimento', icon: '🎮' },
  'cat-desp-academia': { categoryId: 'cat-desp-academia-esportes', name: 'Academia & Esportes', icon: '🏋️' },
  'academia': { categoryId: 'cat-desp-academia-esportes', name: 'Academia & Esportes', icon: '🏋️' },
  'mercado': { categoryId: 'cat-desp-alimentacao', subcategoryId: 'sub-alim-mercado', name: 'Alimentação', icon: '🍽️' },
  'combustivel': { categoryId: 'cat-desp-transporte', subcategoryId: 'sub-trans-combustivel', name: 'Transporte', icon: '🚗' },
  'aluguel': { categoryId: 'cat-desp-moradia', subcategoryId: 'sub-mor-aluguel', name: 'Moradia', icon: '🏠' },
  'cat-rec-salario': { categoryId: 'cat-rec-trabalho', subcategoryId: 'sub-sal-mensal', name: 'Salário & Trabalho', icon: '💼' },
  'salario': { categoryId: 'cat-rec-trabalho', subcategoryId: 'sub-sal-mensal', name: 'Salário & Trabalho', icon: '💼' },
  'cat-rec-outras': { categoryId: 'cat-rec-beneficios-outras', name: 'Benefícios, Reembolsos & Outros', icon: '✨' },
  'outras-receitas': { categoryId: 'cat-rec-beneficios-outras', name: 'Benefícios, Reembolsos & Outros', icon: '✨' },
  'sub-mor-telefone': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-plano-cel', name: 'Compras & Pessoal', icon: '🛍️' },
  'sub-saude-higiene': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-higiene', name: 'Compras & Pessoal', icon: '🛍️' },
  'sub-comp-perifericos': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-informatica', name: 'Compras & Pessoal', icon: '🛍️' },
  'sub-educ-livros-tecnicos': { categoryId: 'cat-desp-educacao', subcategoryId: 'sub-educ-livros', name: 'Educação', icon: '🎓' },
  'sub-fin-financiamento-imob': { categoryId: 'cat-desp-moradia', subcategoryId: 'sub-mor-financiamento-apto', name: 'Moradia', icon: '🏠' },
  'sub-mov-transf-poupanca': { categoryId: 'cat-mov-transferencias', subcategoryId: 'sub-mov-transf-contas', name: 'Transferências', icon: '🔄' },
  'sub-mov-emprestimo-recebido': { categoryId: 'cat-mov-emprestimos', subcategoryId: 'sub-mov-emprestimo-tomado', name: 'Empréstimos', icon: '🤝' },
  'sub-mov-pagamento-emp': { categoryId: 'cat-mov-emprestimos', subcategoryId: 'sub-mov-pagamento-emp-tomado', name: 'Empréstimos', icon: '🤝' },
  'sub-mov-recebimento-emp': { categoryId: 'cat-mov-emprestimos', subcategoryId: 'sub-mov-recebimento-emp-concedido', name: 'Empréstimos', icon: '🤝' },
  'sub-comp-clubes-beneficios': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-clubes-assinaturas', name: 'Compras & Pessoal', icon: '🛍️' },
  'clubes-beneficios': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-clubes-assinaturas', name: 'Compras & Pessoal', icon: '🛍️' },
  'clube-beneficios': { categoryId: 'cat-desp-compras-pessoal', subcategoryId: 'sub-comp-clubes-assinaturas', name: 'Compras & Pessoal', icon: '🛍️' },
};

/**
 * Resolves any category and subcategory safely into a clean display name, icon, and color.
 * Never outputs technical IDs like "CAT-DESP-TECNOLOGIA" or generic unstyled fallbacks.
 */
export function resolveCategory(
  categories: Category[] = [],
  categoryId?: string,
  subcategoryId?: string,
  txType: TransactionType | 'expense' | 'income' | 'transfer' | string = 'expense'
): ResolvedCategoryInfo {
  if (!categoryId && !subcategoryId) {
    return {
      id: 'outros',
      name: txType === 'income' ? 'Outras Receitas' : txType === 'transfer' ? 'Transferência' : 'Outras Despesas',
      icon: txType === 'income' ? '💰' : txType === 'transfer' ? '🔄' : '🛍️',
      color: '#94a3b8',
    };
  }

  const rawCatId = (categoryId || '').trim();
  const rawSubId = (subcategoryId || '').trim();

  // 1. Direct Category Match in user categories or DEFAULT_CATEGORIES
  let directCat = categories.find(
    c => c.id === rawCatId || c.name.toLowerCase() === rawCatId.toLowerCase()
  );

  if (!directCat) {
    directCat = DEFAULT_CATEGORIES.find(
      c => c.id === rawCatId || c.name.toLowerCase() === rawCatId.toLowerCase()
    );
  }

  // 2. Check Subcategory Match if category not found or to enrich subcategory
  let subItem: Subcategory | undefined;
  if (directCat && rawSubId) {
    subItem = directCat.subcategories?.find(
      s => s.id === rawSubId || s.name.toLowerCase() === rawSubId.toLowerCase()
    );
  }

  if (!directCat && rawSubId) {
    for (const c of [...categories, ...DEFAULT_CATEGORIES]) {
      const foundSub = c.subcategories?.find(
        s => s.id === rawSubId || s.name.toLowerCase() === rawSubId.toLowerCase()
      );
      if (foundSub) {
        directCat = c;
        subItem = foundSub;
        break;
      }
    }
  }

  // 3. Known Aliases
  if (!directCat && rawCatId) {
    const lower = rawCatId.toLowerCase();
    const alias = KNOWN_ALIASES[lower];
    if (alias) {
      directCat = categories.find(c => c.id === alias.categoryId) ||
        DEFAULT_CATEGORIES.find(c => c.id === alias.categoryId);
      if (directCat && alias.subcategoryId && !subItem) {
        subItem = directCat.subcategories?.find(s => s.id === alias.subcategoryId);
      }
    }
  }

  if (directCat) {
    return {
      id: directCat.id,
      name: directCat.name,
      icon: directCat.icon || (txType === 'income' ? '💰' : '🛍️'),
      color: directCat.color || '#8b5cf6',
      subName: subItem?.name,
      subIcon: subItem?.icon,
    };
  }

  // 4. Prettify raw slug if unknown (e.g., "cat-desp-minha-categoria" -> "Minha Categoria")
  let cleanName = rawCatId
    .replace(/^cat-desp-|^cat-rec-|^cat-mov-|^cat-|^sub-|^desp-|^rec-/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  if (!cleanName) cleanName = 'Outros';
  else {
    cleanName = cleanName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return {
    id: rawCatId,
    name: cleanName,
    icon: txType === 'income' ? '💰' : txType === 'transfer' ? '🔄' : '🏷️',
    color: '#6366f1',
    isCustomFallback: true,
  };
}
