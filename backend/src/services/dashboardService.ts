import { getStore } from '../repositories/store.js';

export const dashboardService = {
  getDashboardData() {
    const store = getStore();
    const orders = store.orders;
    const books = store.books;
    const stationery = store.stationery;
    const publishers = store.publishers;
    const schools = store.schools;

    const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
    const totalReceived = orders.reduce((acc, o) => acc + o.paidAmount, 0);
    const totalPending = orders.reduce((acc, o) => acc + o.remainingAmount, 0);

    const pendingOrders = orders.filter((o) => o.orderStatus === 'Confirmed' || o.orderStatus === 'Preparing');
    const readyOrders = orders.filter((o) => o.orderStatus === 'Ready');
    const completedOrders = orders.filter((o) => o.orderStatus === 'Completed');

    const lowStockBooks = books.filter((b) => b.currentStock <= b.minStock);
    const lowStockStationery = stationery.filter((s) => s.currentStock <= s.minStock);
    const totalPublisherDue = publishers.reduce((acc, p) => acc + p.pendingDue, 0);

    const realizationPct = totalSales > 0 ? Math.round((totalReceived / totalSales) * 100) : 0;

    // Sales by channel
    const channels = ['Store', 'Stall', 'Public Link', 'Employee', 'Partner'] as const;
    const channelVelocity = channels.map((ch) => {
      const chOrders = orders.filter((o) => o.source === ch);
      const volume = chOrders.reduce((acc, o) => acc + o.total, 0);
      const pct = totalSales > 0 ? Math.round((volume / totalSales) * 100) : 0;
      return {
        channel: ch,
        orderCount: chOrders.length,
        volume,
        percentage: pct,
      };
    });

    return {
      kpis: {
        totalSales,
        totalReceived,
        totalPending,
        realizationPct,
        activeOrdersCount: pendingOrders.length + readyOrders.length,
        readyOrdersCount: readyOrders.length,
        completedOrdersCount: completedOrders.length,
        lowStockTitlesCount: lowStockBooks.length + lowStockStationery.length,
        totalPublisherDue,
        totalSchoolsCount: schools.length,
        activeSchoolsCount: schools.filter((s) => s.status === 'Active').length,
      },
      channelVelocity,
      recentOrders: orders.slice(0, 8),
      lowStockAlerts: lowStockBooks.slice(0, 5),
    };
  },
};

export const reportService = {
  getExecutiveSummary() {
    const store = getStore();
    const totalSales = store.orders.reduce((acc, o) => acc + o.total, 0);
    const totalPaid = store.orders.reduce((acc, o) => acc + o.paidAmount, 0);
    const totalDue = store.orders.reduce((acc, o) => acc + o.remainingAmount, 0);

    const schoolPerformance = store.schools.map((s) => {
      const sOrders = store.orders.filter((o) => o.schoolId === s.id);
      const revenue = sOrders.reduce((acc, o) => acc + o.total, 0);
      const collected = sOrders.reduce((acc, o) => acc + o.paidAmount, 0);
      return {
        schoolId: s.id,
        schoolName: s.name,
        code: s.code,
        ordersCount: sOrders.length,
        revenue,
        collected,
        due: revenue - collected,
      };
    });

    const bookSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    store.orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.type === 'book') {
          if (!bookSalesMap[item.itemId]) {
            bookSalesMap[item.itemId] = { name: item.name, quantity: 0, revenue: 0 };
          }
          bookSalesMap[item.itemId].quantity += item.quantity;
          bookSalesMap[item.itemId].revenue += item.total;
        }
      });
    });

    const bestsellerBooks = Object.values(bookSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const totalValuation =
      store.books.reduce((acc, b) => acc + b.currentStock * b.purchasePrice, 0) +
      store.stationery.reduce((acc, s) => acc + s.currentStock * s.purchasePrice, 0);

    return {
      financials: {
        totalSales,
        totalPaid,
        totalDue,
        totalValuation,
      },
      schoolPerformance,
      bestsellerBooks,
      publishers: store.publishers,
    };
  },
};
