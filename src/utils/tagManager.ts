import { Transaction } from '../types';
import { normalizeTag } from './smartCategorizer';

const CUSTOM_TAGS_STORAGE_KEY = 'finly_custom_tags';

export interface TagUsageStats {
  tag: string;
  count: number;
  lastUsedDate?: string;
  categories: string[];
}

/**
 * Loads custom user tags registered manually in Cadastros
 */
export function getStoredCustomTags(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Array.from(new Set(parsed.map(normalizeTag).filter(Boolean)));
    }
  } catch (err) {
    console.error('Failed to load custom tags:', err);
  }
  return [];
}

/**
 * Saves custom user tags
 */
export function saveCustomTags(tags: string[]): void {
  try {
    const clean = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
    localStorage.setItem(CUSTOM_TAGS_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to save custom tags:', err);
  }
}

/**
 * Computes consolidated tag statistics from all transactions and custom tags
 */
export function getConsolidatedTags(
  transactions: Transaction[] = [],
  customTags: string[] = []
): TagUsageStats[] {
  const map = new Map<string, { count: number; lastUsedDate?: string; categories: Set<string> }>();

  // Initialize with custom tags
  for (const tag of customTags) {
    const clean = normalizeTag(tag);
    if (!clean) continue;
    if (!map.has(clean)) {
      map.set(clean, { count: 0, categories: new Set() });
    }
  }

  // Aggregate through transactions
  for (const tx of transactions) {
    if (!Array.isArray(tx.tags) || tx.tags.length === 0) continue;
    for (const rawTag of tx.tags) {
      const clean = normalizeTag(rawTag);
      if (!clean) continue;

      const current = map.get(clean) || { count: 0, categories: new Set() };
      current.count += 1;

      if (tx.date) {
        if (!current.lastUsedDate || tx.date > current.lastUsedDate) {
          current.lastUsedDate = tx.date;
        }
      }

      if (tx.categoryId) {
        current.categories.add(tx.categoryId);
      }

      map.set(clean, current);
    }
  }

  return Array.from(map.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      lastUsedDate: data.lastUsedDate,
      categories: Array.from(data.categories),
    }))
    .sort((a, b) => {
      // Sort by count descending, then alphabetically
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    });
}
