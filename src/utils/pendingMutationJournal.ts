export interface PendingMutationJournal<T extends { id: string }> {
  upserts: Record<string, T>;
  deletes: string[];
}

export interface PendingMutationReconciliation<T extends { id: string }> {
  items: T[];
  journal: PendingMutationJournal<T>;
  retryUpserts: T[];
  retryDeletes: string[];
}

export const createEmptyMutationJournal = <T extends { id: string }>(): PendingMutationJournal<T> => ({
  upserts: {},
  deletes: [],
});

export const enqueueMutationUpsert = <T extends { id: string }>(
  journal: PendingMutationJournal<T>,
  item: T,
): PendingMutationJournal<T> => ({
  upserts: { ...journal.upserts, [item.id]: item },
  deletes: journal.deletes.filter(id => id !== item.id),
});

export const enqueueMutationDelete = <T extends { id: string }>(
  journal: PendingMutationJournal<T>,
  id: string,
): PendingMutationJournal<T> => {
  const upserts = { ...journal.upserts };
  delete upserts[id];
  return {
    upserts,
    deletes: journal.deletes.includes(id) ? [...journal.deletes] : [...journal.deletes, id],
  };
};

/**
 * Reapplies acknowledged-or-pending local intent over an eventually consistent
 * remote snapshot. Confirmed mutations leave the journal; stale snapshots are
 * masked and produce an explicit retry list.
 */
export const reconcilePendingMutations = <T extends { id: string }>(options: {
  remoteItems: T[];
  journal: PendingMutationJournal<T>;
  equals: (remote: T, local: T) => boolean;
}): PendingMutationReconciliation<T> => {
  const byId = new Map(options.remoteItems.map(item => [item.id, item]));
  const nextJournal: PendingMutationJournal<T> = {
    upserts: { ...options.journal.upserts },
    deletes: [...options.journal.deletes],
  };
  const retryUpserts: T[] = [];
  const retryDeletes: string[] = [];

  for (const id of options.journal.deletes) {
    if (!byId.has(id)) {
      nextJournal.deletes = nextJournal.deletes.filter(itemId => itemId !== id);
      continue;
    }
    byId.delete(id);
    retryDeletes.push(id);
  }

  for (const [id, localItem] of Object.entries(options.journal.upserts)) {
    const remoteItem = byId.get(id);
    if (remoteItem && options.equals(remoteItem, localItem)) {
      delete nextJournal.upserts[id];
      continue;
    }
    byId.set(id, localItem);
    retryUpserts.push(localItem);
  }

  return {
    items: Array.from(byId.values()),
    journal: nextJournal,
    retryUpserts,
    retryDeletes,
  };
};
