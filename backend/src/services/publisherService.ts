import { getStore, updateStore } from '../repositories/store.js';
import { Publisher } from '../types.js';

export const publisherService = {
  getPublishers(): Publisher[] {
    return getStore().publishers;
  },

  getPublisherById(id: string): Publisher | undefined {
    return getStore().publishers.find((p) => p.id === id);
  },

  createPublisher(data: Omit<Publisher, 'id' | 'totalPurchased' | 'totalPaid' | 'pendingDue'>): Publisher {
    const store = getStore();
    const newPub: Publisher = {
      ...data,
      id: `PUB-0${store.publishers.length + 1}`,
      totalPurchased: 0,
      totalPaid: 0,
      pendingDue: 0,
    };

    updateStore((prev) => ({
      ...prev,
      publishers: [...prev.publishers, newPub],
    }));

    return newPub;
  },

  updatePublisher(id: string, updates: Partial<Publisher>): Publisher {
    let updated: Publisher | undefined;

    updateStore((prev) => ({
      ...prev,
      publishers: prev.publishers.map((p) => {
        if (p.id === id) {
          updated = { ...p, ...updates };
          return updated;
        }
        return p;
      }),
    }));

    if (!updated) {
      throw new Error(`Publisher with id ${id} not found`);
    }

    return updated;
  },

  recordPayment(publisherId: string, amount: number, note?: string): Publisher {
    let updatedPub: Publisher | undefined;

    updateStore((prev) => ({
      ...prev,
      publishers: prev.publishers.map((p) => {
        if (p.id === publisherId) {
          const newPaid = p.totalPaid + amount;
          const newDue = Math.max(0, p.pendingDue - amount);
          updatedPub = {
            ...p,
            totalPaid: newPaid,
            pendingDue: newDue,
          };
          return updatedPub;
        }
        return p;
      }),
    }));

    if (!updatedPub) {
      throw new Error(`Publisher with id ${publisherId} not found`);
    }

    return updatedPub;
  },
};
