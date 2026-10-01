import { getStore, updateStore } from '../repositories/store.js';
import { StockMovementRecord } from '../types.js';

export const inventoryService = {
  getStockOverview() {
    const store = getStore();
    const totalBookStock = store.books.reduce((acc, b) => acc + b.currentStock, 0);
    const totalStationeryStock = store.stationery.reduce((acc, s) => acc + s.currentStock, 0);
    const lowStockBooks = store.books.filter((b) => b.currentStock <= b.minStock);
    const lowStockStationery = store.stationery.filter((s) => s.currentStock <= s.minStock);

    const totalValuation =
      store.books.reduce((acc, b) => acc + b.currentStock * b.purchasePrice, 0) +
      store.stationery.reduce((acc, s) => acc + s.currentStock * s.purchasePrice, 0);

    return {
      totalBookStock,
      totalStationeryStock,
      totalUnits: totalBookStock + totalStationeryStock,
      lowStockCount: lowStockBooks.length + lowStockStationery.length,
      lowStockBooks,
      lowStockStationery,
      totalValuation,
    };
  },

  getMovements(limit: number = 100): StockMovementRecord[] {
    return getStore().stockMovements.slice(0, limit);
  },

  adjustStock(
    itemType: 'book' | 'stationery',
    itemId: string,
    change: number,
    type: 'Damage' | 'Adjustment In' | 'Adjustment Out',
    notes?: string
  ): { itemId: string; newStock: number; movement: StockMovementRecord } {
    const store = getStore();
    const nowPretty = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let itemName = '';
    let newStock = 0;

    if (itemType === 'book') {
      const book = store.books.find((b) => b.id === itemId);
      if (!book) throw new Error(`Book ${itemId} not found`);
      itemName = book.name;
      newStock = Math.max(0, book.currentStock + change);

      updateStore((prev) => ({
        ...prev,
        books: prev.books.map((b) => (b.id === itemId ? { ...b, currentStock: newStock } : b)),
      }));
    } else {
      const stat = store.stationery.find((s) => s.id === itemId);
      if (!stat) throw new Error(`Stationery ${itemId} not found`);
      itemName = stat.name;
      newStock = Math.max(0, stat.currentStock + change);

      updateStore((prev) => ({
        ...prev,
        stationery: prev.stationery.map((s) => (s.id === itemId ? { ...s, currentStock: newStock } : s)),
      }));
    }

    const movement: StockMovementRecord = {
      id: `MOV-${Date.now()}-${itemId}`,
      timestamp: nowPretty,
      type,
      itemType,
      itemId,
      itemName,
      change,
      newStock,
      referenceId: `ADJ-${Date.now()}`,
      notes: notes || `Manual ${type}`,
    };

    updateStore((prev) => ({
      ...prev,
      stockMovements: [movement, ...prev.stockMovements],
    }));

    return { itemId, newStock, movement };
  },
};
