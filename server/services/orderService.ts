import { getStore, updateStore } from '../data/store.js';
import {
  Order,
  OrderItem,
  OrderStatus,
  OrderSource,
  PaymentMethod,
  StockMovementRecord,
  Book,
  Stationery,
} from '../types.js';

export const orderService = {
  getOrders(query?: {
    search?: string;
    status?: string;
    source?: string;
    schoolId?: string;
  }): Order[] {
    let orders = getStore().orders;

    if (!query) return orders;

    if (query.search) {
      const q = query.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.studentName.toLowerCase().includes(q) ||
          o.schoolName.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }

    if (query.status && query.status !== 'All') {
      if (query.status === 'pending-payment') {
        orders = orders.filter((o) => o.paymentStatus !== 'Paid');
      } else {
        orders = orders.filter((o) => o.orderStatus.toLowerCase() === query.status?.toLowerCase());
      }
    }

    if (query.source && query.source !== 'All') {
      orders = orders.filter((o) => o.source === query.source);
    }

    if (query.schoolId) {
      orders = orders.filter((o) => o.schoolId === query.schoolId);
    }

    return orders;
  },

  getOrderById(id: string): Order | undefined {
    return getStore().orders.find((o) => o.id === id);
  },

  createOrder(orderInput: {
    schoolId: string;
    schoolName: string;
    classId: string;
    studentName: string;
    parentName?: string;
    phone: string;
    address?: string;
    source: OrderSource;
    createdBy: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    total: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: 'Paid' | 'Partial' | 'Pending';
    orderStatus: OrderStatus;
    payments?: any[];
    pickupOrDelivery: 'Stall Pickup' | 'Store Pickup' | 'Home Delivery';
    notes?: string;
  }): Order {
    const store = getStore();
    const newOrderId = `ORD-${1000 + store.orders.length + 1}`;
    const nowIso = new Date().toISOString();
    const nowPretty = nowIso.replace('T', ' ').substring(0, 16);

    const newMovements: StockMovementRecord[] = [];
    const bookQtyMap: Record<string, number> = {};
    const statQtyMap: Record<string, number> = {};

    orderInput.items.forEach((item) => {
      if (item.type === 'book') {
        bookQtyMap[item.itemId] = (bookQtyMap[item.itemId] || 0) + item.quantity;
      } else {
        statQtyMap[item.itemId] = (statQtyMap[item.itemId] || 0) + item.quantity;
      }
    });

    // Deduct stock and record movement
    const updatedBooks = store.books.map((b) => {
      if (bookQtyMap[b.id]) {
        const qtyDeducted = bookQtyMap[b.id];
        const newStock = Math.max(0, b.currentStock - qtyDeducted);
        newMovements.push({
          id: `MOV-${Date.now()}-${b.id}`,
          timestamp: nowPretty,
          type: 'Customer Sale',
          itemType: 'book',
          itemId: b.id,
          itemName: b.name,
          change: -qtyDeducted,
          newStock,
          referenceId: newOrderId,
          notes: `Sold on Order #${newOrderId} (${orderInput.studentName})`,
        });
        return { ...b, currentStock: newStock };
      }
      return b;
    });

    const updatedStationery = store.stationery.map((s) => {
      if (statQtyMap[s.id]) {
        const qtyDeducted = statQtyMap[s.id];
        const newStock = Math.max(0, s.currentStock - qtyDeducted);
        newMovements.push({
          id: `MOV-${Date.now()}-${s.id}`,
          timestamp: nowPretty,
          type: 'Customer Sale',
          itemType: 'stationery',
          itemId: s.id,
          itemName: s.name,
          change: -qtyDeducted,
          newStock,
          referenceId: newOrderId,
          notes: `Sold on Order #${newOrderId} (${orderInput.studentName})`,
        });
        return { ...s, currentStock: newStock };
      }
      return s;
    });

    const newOrder: Order = {
      ...orderInput,
      id: newOrderId,
      createdAt: nowIso,
      payments: orderInput.payments || [],
    };

    updateStore((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      books: updatedBooks,
      stationery: updatedStationery,
      stockMovements: [...newMovements, ...prev.stockMovements],
    }));

    return newOrder;
  },

  updateOrderStatus(orderId: string, newStatus: OrderStatus): Order {
    let updated: Order | undefined;

    updateStore((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id === orderId) {
          updated = { ...o, orderStatus: newStatus };
          return updated;
        }
        return o;
      }),
    }));

    if (!updated) {
      throw new Error(`Order #${orderId} not found`);
    }

    return updated;
  },

  collectPayment(
    orderId: string,
    amount: number,
    method: PaymentMethod,
    note?: string,
    collectedBy: string = 'Staff'
  ): Order {
    const paymentId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let updated: Order | undefined;

    updateStore((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id === orderId) {
          const newPaid = o.paidAmount + amount;
          const newRemaining = Math.max(0, o.total - newPaid);
          const newPaymentStatus = newRemaining === 0 ? 'Paid' : 'Partial';
          const newRecord = {
            id: paymentId,
            date: dateStr,
            amount,
            method,
            note: note || `Collected via ${method}`,
            collectedBy,
          };
          updated = {
            ...o,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            paymentStatus: newPaymentStatus,
            payments: [...o.payments, newRecord],
          };
          return updated;
        }
        return o;
      }),
    }));

    if (!updated) {
      throw new Error(`Order #${orderId} not found`);
    }

    return updated;
  },

  processReturn(
    orderId: string,
    returnItems: Array<{ itemId: string; itemName: string; quantity: number; refundAmount: number; reason: any }>,
    notes?: string
  ): Order {
    const store = getStore();
    const nowPretty = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newMovements: StockMovementRecord[] = [];

    const bookQtyMap: Record<string, number> = {};
    const statQtyMap: Record<string, number> = {};

    returnItems.forEach((item) => {
      const isBook = store.books.some((b) => b.id === item.itemId);
      if (isBook) {
        bookQtyMap[item.itemId] = (bookQtyMap[item.itemId] || 0) + item.quantity;
      } else {
        statQtyMap[item.itemId] = (statQtyMap[item.itemId] || 0) + item.quantity;
      }
    });

    const updatedBooks = store.books.map((b) => {
      if (bookQtyMap[b.id]) {
        const added = bookQtyMap[b.id];
        const newStock = b.currentStock + added;
        newMovements.push({
          id: `MOV-${Date.now()}-${b.id}`,
          timestamp: nowPretty,
          type: 'Customer Return',
          itemType: 'book',
          itemId: b.id,
          itemName: b.name,
          change: +added,
          newStock,
          referenceId: orderId,
          notes: `Return on Order #${orderId}: ${notes || 'Item restocked'}`,
        });
        return { ...b, currentStock: newStock };
      }
      return b;
    });

    const updatedStationery = store.stationery.map((s) => {
      if (statQtyMap[s.id]) {
        const added = statQtyMap[s.id];
        const newStock = s.currentStock + added;
        newMovements.push({
          id: `MOV-${Date.now()}-${s.id}`,
          timestamp: nowPretty,
          type: 'Customer Return',
          itemType: 'stationery',
          itemId: s.id,
          itemName: s.name,
          change: +added,
          newStock,
          referenceId: orderId,
          notes: `Return on Order #${orderId}: ${notes || 'Item restocked'}`,
        });
        return { ...s, currentStock: newStock };
      }
      return s;
    });

    const totalRefund = returnItems.reduce((acc, r) => acc + r.refundAmount, 0);
    const fullReturnRecords = returnItems.map((r, i) => ({
      ...r,
      id: `RET-${Date.now()}-${i}`,
      returnedAt: nowPretty,
      notes,
    }));

    let updatedOrder: Order | undefined;

    updateStore((prev) => ({
      ...prev,
      books: updatedBooks,
      stationery: updatedStationery,
      stockMovements: [...newMovements, ...prev.stockMovements],
      orders: prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        const newTotal = Math.max(0, o.total - totalRefund);
        const newPaid = Math.max(0, o.paidAmount - totalRefund);
        updatedOrder = {
          ...o,
          orderStatus: 'Returned',
          total: newTotal,
          paidAmount: newPaid,
          returns: [...(o.returns || []), ...fullReturnRecords],
        };
        return updatedOrder;
      }),
    }));

    if (!updatedOrder) {
      throw new Error(`Order #${orderId} not found`);
    }

    return updatedOrder;
  },
};
