import assert from 'node:assert/strict';
import { resolveCategory } from '../src/utils/categoryResolver';
import { DEFAULT_CATEGORIES } from '../src/utils/defaultCategories';

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

// Teste 1: deve agrupar despesas por subcategoria e associar à categoria-mãe
{
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

  assert.equal(total, 680.0);
  assert.equal(items.length, 5);

  // Encontrar Óculos & Lentes
  const oculos = items.find(i => i.id.includes('sub-saude-oculos-lentes'));
  assert.ok(oculos, 'Deveria encontrar a subcategoria Óculos & Lentes');
  assert.equal(oculos.amount, 150.0);
  assert.equal(oculos.parentCategoryName, 'Saúde');
  assert.ok(Math.abs((oculos.amount / total) * 100 - 22.058) < 0.1);

  // Encontrar item Geral de Alimentação
  const geralAlim = items.find(i => i.id.includes('geral_cat-desp-alimentacao'));
  assert.ok(geralAlim, 'Deveria encontrar alimentação geral');
  assert.equal(geralAlim.amount, 100.0);
  assert.ok(geralAlim.name.includes('ALIMENTAÇÃO (GERAL)'));
}

// Teste 2: deve filtrar corretamente quando uma categoria-mãe estiver selecionada
{
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
  assert.equal(total, 200.0);
  assert.equal(items.length, 2);

  const oculos = items.find(i => i.id.includes('sub-saude-oculos-lentes'));
  assert.ok(oculos);
  assert.equal(oculos.amount, 150.0);
  assert.equal((oculos.amount / total) * 100, 75.0); // 75% do total de Saúde
}

console.log('OK: reportsSubcategoryDonut.test.ts passou com sucesso.');
