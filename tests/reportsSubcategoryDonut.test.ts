import { describe, it, expect } from 'vitest';
import { resolveCategory } from '../src/utils/categoryResolver';
import { DEFAULT_CATEGORIES } from '../src/utils/defaultCategories';

describe('Relatórios Donut com Subcategorias', () => {
  const categories = DEFAULT_CATEGORIES;

  const mockTransactions = [
    {
      id: 'tx-1',
      type: 'expense',
      amount: 150.0,
      categoryId: 'cat-desp-saude',
      subcategoryId: 'sub-saude-oculos-lentes',
      date: '2026-09-05',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 50.0,
      categoryId: 'cat-desp-saude',
      subcategoryId: 'sub-saude-farmacia',
      date: '2026-09-06',
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 300.0,
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-mercado',
      date: '2026-09-07',
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 80.0,
      categoryId: 'cat-desp-alimentacao',
      subcategoryId: 'sub-alim-restaurante',
      date: '2026-09-08',
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 100.0,
      categoryId: 'cat-desp-alimentacao',
      // Sem subcategoria explícita -> deve cair em Geral
      date: '2026-09-09',
    },
  ];

  it('deve agrupar despesas por subcategoria e associar à categoria-mãe', () => {
    const map: Record<string, any> = {};

    mockTransactions.forEach(t => {
      const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, 'expense');
      const parentId = resolved.id;
      const parentName = resolved.name;
      const parentIcon = resolved.icon;

      let subId = resolved.subId || t.subcategoryId;
      let subName = resolved.subName;
      let subIcon = resolved.subIcon || resolved.icon || '🏷️';

      if (!subId || !subName) {
        subId = `geral_${parentId}`;
        subName = `${parentName} (Geral)`;
        subIcon = parentIcon;
      }

      const uniqueKey = `${parentId}__${subId}`;

      if (!map[uniqueKey]) {
        map[uniqueKey] = {
          id: uniqueKey,
          name: subName.toUpperCase(),
          icon: subIcon,
          amount: 0,
          parentCategoryId: parentId,
          parentCategoryName: parentName,
          parentCategoryIcon: parentIcon,
        };
      }
      map[uniqueKey].amount += t.amount;
    });

    const items = Object.values(map);
    const total = items.reduce((sum, i) => sum + i.amount, 0);

    expect(total).toBe(680.0);
    expect(items.length).toBe(5);

    // Encontrar Óculos & Lentes
    const oculos = items.find(i => i.id.includes('sub-saude-oculos-lentes'));
    expect(oculos).toBeDefined();
    expect(oculos.amount).toBe(150.0);
    expect(oculos.parentCategoryName).toBe('Saúde');
    expect((oculos.amount / total) * 100).toBeCloseTo(22.058, 2);

    // Encontrar item Geral de Alimentação
    const geralAlim = items.find(i => i.id.includes('geral_cat-desp-alimentacao'));
    expect(geralAlim).toBeDefined();
    expect(geralAlim.amount).toBe(100.0);
    expect(geralAlim.name).toContain('ALIMENTAÇÃO (GERAL)');
  });

  it('deve filtrar corretamente quando uma categoria-mãe estiver selecionada', () => {
    const selectedParent = 'cat-desp-saude';
    const map: Record<string, any> = {};

    mockTransactions.forEach(t => {
      const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, 'expense');
      const parentId = resolved.id;

      if (parentId !== selectedParent) return;

      const parentName = resolved.name;
      const parentIcon = resolved.icon;

      let subId = resolved.subId || t.subcategoryId;
      let subName = resolved.subName;
      let subIcon = resolved.subIcon || resolved.icon || '🏷️';

      if (!subId || !subName) {
        subId = `geral_${parentId}`;
        subName = `${parentName} (Geral)`;
        subIcon = parentIcon;
      }

      const uniqueKey = `${parentId}__${subId}`;

      if (!map[uniqueKey]) {
        map[uniqueKey] = {
          id: uniqueKey,
          name: subName.toUpperCase(),
          icon: subIcon,
          amount: 0,
          parentCategoryId: parentId,
          parentCategoryName: parentName,
          parentCategoryIcon: parentIcon,
        };
      }
      map[uniqueKey].amount += t.amount;
    });

    const items = Object.values(map);
    const total = items.reduce((sum, i) => sum + i.amount, 0);

    // Total de Saúde: 150 + 50 = 200
    expect(total).toBe(200.0);
    expect(items.length).toBe(2);

    const oculos = items.find(i => i.id.includes('sub-saude-oculos-lentes'));
    expect(oculos.amount).toBe(150.0);
    expect((oculos.amount / total) * 100).toBe(75.0); // 75% do total de Saúde
  });
});
