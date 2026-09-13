import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES } from '../src/utils/defaultCategories';
import { resolveCategory, splitEmojiFromName } from '../src/utils/categoryResolver';

// 1. Verify DEFAULT_CATEGORIES has cat-desp-moradia and sub-mor-limpeza-utilidades
const moradia = DEFAULT_CATEGORIES.find(c => c.id === 'cat-desp-moradia');
assert.ok(moradia, 'Categoria Moradia deve existir em DEFAULT_CATEGORIES');
assert.equal(moradia.name, 'Moradia');
assert.equal(moradia.icon, '🏠');

const limpezaUtilidades = moradia.subcategories.find(s => s.id === 'sub-mor-limpeza-utilidades');
assert.ok(limpezaUtilidades, 'Subcategoria Limpeza & Utilidades deve existir em Moradia');
assert.equal(limpezaUtilidades.name, 'Limpeza & Utilidades');
assert.equal(limpezaUtilidades.icon, '🧹');
assert.equal(limpezaUtilidades.categoryId, 'cat-desp-moradia');

// 2. Verify resolveCategory directly with IDs
const resolvedDirect = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-moradia', 'sub-mor-limpeza-utilidades');
assert.equal(resolvedDirect.id, 'cat-desp-moradia');
assert.equal(resolvedDirect.name, 'Moradia');
assert.equal(resolvedDirect.subId, 'sub-mor-limpeza-utilidades');
assert.equal(resolvedDirect.subName, 'Limpeza & Utilidades');
assert.equal(resolvedDirect.subIcon, '🧹');

// 3. Verify resolveCategory with text aliases
const resolvedAlias1 = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-moradia', 'limpeza & utilidades');
assert.equal(resolvedAlias1.subId, 'sub-mor-limpeza-utilidades');
assert.equal(resolvedAlias1.subName, 'Limpeza & Utilidades');

const resolvedAlias2 = resolveCategory(DEFAULT_CATEGORIES, 'cat-desp-moradia', 'limpeza');
assert.equal(resolvedAlias2.subId, 'sub-mor-limpeza-utilidades');

// 4. Verify splitEmojiFromName
const parsedWithEmoji = splitEmojiFromName('🧹 Limpeza & Utilidades');
assert.equal(parsedWithEmoji.name, 'Limpeza & Utilidades');
assert.equal(parsedWithEmoji.icon, '🧹');

console.log('✅ categoryLimpezaUtilidades.test.ts: Subcategoria 🏠 Moradia → 🧹 Limpeza & Utilidades validada com sucesso!');
