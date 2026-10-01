import { getStore, updateStore } from '../data/store.js';
import { Stationery } from '../types.js';

export const stationeryService = {
  getStationery(query?: { search?: string; category?: string; lowStock?: boolean }): Stationery[] {
    let items = getStore().stationery;

    if (!query) return items;

    if (query.search) {
      const q = query.search.toLowerCase();
      items = items.filter(
        (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      );
    }

    if (query.category && query.category !== 'All') {
      items = items.filter((s) => s.category === query.category);
    }

    if (query.lowStock) {
      items = items.filter((s) => s.currentStock <= s.minStock);
    }

    return items;
  },

  getStationeryById(id: string): Stationery | undefined {
    return getStore().stationery.find((s) => s.id === id);
  },

  createStationery(data: Omit<Stationery, 'id'>): Stationery {
    const store = getStore();
    const newItem: Stationery = {
      ...data,
      id: `ST-0${store.stationery.length + 1}`,
    };

    updateStore((prev) => ({
      ...prev,
      stationery: [...prev.stationery, newItem],
    }));

    return newItem;
  },

  updateStationery(id: string, updates: Partial<Stationery>): Stationery {
    let updated: Stationery | undefined;

    updateStore((prev) => ({
      ...prev,
      stationery: prev.stationery.map((s) => {
        if (s.id === id) {
          updated = { ...s, ...updates };
          return updated;
        }
        return s;
      }),
    }));

    if (!updated) {
      throw new Error(`Stationery item with id ${id} not found`);
    }

    return updated;
  },
};
