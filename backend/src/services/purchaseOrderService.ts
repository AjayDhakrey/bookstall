import { getStore, updateStore } from '../repositories/store.js';
import { PurchaseOrder, StockMovementRecord } from '../types.js';

export const purchaseOrderService = {
  getPurchaseOrders(): PurchaseOrder[] {
    return getStore().purchaseOrders;
  },

  getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return getStore().purchaseOrders.find((po) => po.id === id);
  },

  createPurchaseOrder(poInput: Omit<PurchaseOrder, 'id' | 'orderDate' | 'status' | 'paidAmount' | 'remainingAmount'>): PurchaseOrder {
    const store = getStore();
    const newId = `PO-2026-${String(store.purchaseOrders.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().substring(0, 10);

    const newPO: PurchaseOrder = {
      ...poInput,
      id: newId,
      orderDate: today,
      status: 'Sent',
      paidAmount: 0,
      remainingAmount: poInput.totalAmount,
    };

    updateStore((prev) => ({
      ...prev,
      purchaseOrders: [newPO, ...prev.purchaseOrders],
      publishers: prev.publishers.map((p) => {
        if (p.id === poInput.publisherId) {
          return {
            ...p,
            totalPurchased: p.totalPurchased + poInput.totalAmount,
            pendingDue: p.pendingDue + poInput.totalAmount,
          };
        }
        return p;
      }),
    }));

    return newPO;
  },

  receivePurchaseOrderStock(poId: string, notes?: string): PurchaseOrder {
    const store = getStore();
    const po = store.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    const nowPretty = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newMovements: StockMovementRecord[] = [];

    const updatedBooks = store.books.map((b) => {
      const match = po.items.find((i) => i.itemId === b.id && i.itemType === 'book');
      if (match) {
        const newStock = b.currentStock + match.orderedQty;
        newMovements.push({
          id: `MOV-${Date.now()}-${b.id}`,
          timestamp: nowPretty,
          type: 'PO Receiving',
          itemType: 'book',
          itemId: b.id,
          itemName: b.name,
          change: +match.orderedQty,
          newStock,
          referenceId: poId,
          notes: notes || `Received against ${poId}`,
        });
        return { ...b, currentStock: newStock };
      }
      return b;
    });

    const updatedStationery = store.stationery.map((s) => {
      const match = po.items.find((i) => i.itemId === s.id && i.itemType === 'stationery');
      if (match) {
        const newStock = s.currentStock + match.orderedQty;
        newMovements.push({
          id: `MOV-${Date.now()}-${s.id}`,
          timestamp: nowPretty,
          type: 'PO Receiving',
          itemType: 'stationery',
          itemId: s.id,
          itemName: s.name,
          change: +match.orderedQty,
          newStock,
          referenceId: poId,
          notes: notes || `Received against ${poId}`,
        });
        return { ...s, currentStock: newStock };
      }
      return s;
    });

    let updatedPO: PurchaseOrder | undefined;

    updateStore((prev) => ({
      ...prev,
      books: updatedBooks,
      stationery: updatedStationery,
      stockMovements: [...newMovements, ...prev.stockMovements],
      purchaseOrders: prev.purchaseOrders.map((p) => {
        if (p.id === poId) {
          updatedPO = {
            ...p,
            status: p.paidAmount >= p.totalAmount ? 'Paid' : 'Received',
            receivedDate: new Date().toISOString().substring(0, 10),
          };
          return updatedPO;
        }
        return p;
      }),
    }));

    if (!updatedPO) throw new Error(`PO ${poId} update failed`);
    return updatedPO;
  },

  payPurchaseOrder(poId: string, amount: number, note?: string): PurchaseOrder {
    const store = getStore();
    const po = store.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    let updatedPO: PurchaseOrder | undefined;

    updateStore((prev) => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map((p) => {
        if (p.id === poId) {
          const newPaid = p.paidAmount + amount;
          const newRem = Math.max(0, p.totalAmount - newPaid);
          const newStatus = newRem === 0 && p.status === 'Received' ? 'Paid' : p.status;
          updatedPO = {
            ...p,
            paidAmount: newPaid,
            remainingAmount: newRem,
            status: newStatus,
          };
          return updatedPO;
        }
        return p;
      }),
      publishers: prev.publishers.map((pub) => {
        if (pub.id === po.publisherId) {
          return {
            ...pub,
            totalPaid: pub.totalPaid + amount,
            pendingDue: Math.max(0, pub.pendingDue - amount),
          };
        }
        return pub;
      }),
    }));

    if (!updatedPO) throw new Error(`PO ${poId} payment failed`);
    return updatedPO;
  },
};
