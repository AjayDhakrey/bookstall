import { api } from './client';
import {
  BusinessProfile,
  Publisher,
  Book,
  Stationery,
  School,
  SchoolBookMapping,
  SchoolStationeryMapping,
  Order,
  OrderItem,
  OrderStatus,
  OrderSource,
  PaymentMethod,
  PurchaseOrder,
  StockMovementRecord,
  StaffPartner,
  LoginLogRecord,
} from '../types';

export const authApi = {
  getCurrentUser: () => api.get<StaffPartner>('/auth/me'),
  login: (options: {
    emailOrId: string;
    terminal?: string;
    device?: string;
    loginMethod?: 'Password' | 'PIN Badge' | 'Quick Role Switch' | 'Session Token';
  }) => api.post<{ user: StaffPartner; log: LoginLogRecord }>('/auth/login', options),
  logout: (userId?: string, token?: string) =>
    api.post<{ loggedOut: boolean }>('/auth/logout', { userId, token }),
  getLoginLogs: (params?: {
    search?: string;
    role?: string;
    userId?: string;
    status?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role && params.role !== 'All') query.set('role', params.role);
    if (params?.userId && params.userId !== 'All') query.set('userId', params.userId);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return api.get<LoginLogRecord[]>(`/auth/logs${qStr}`);
  },
  getStaff: () => api.get<StaffPartner[]>('/auth/staff'),
  addStaff: (data: Omit<StaffPartner, 'id'>) => api.post<StaffPartner>('/auth/staff', data),
  updateStaff: (id: string, updates: Partial<StaffPartner>) =>
    api.put<StaffPartner>(`/auth/staff/${id}`, updates),
};

export const businessProfileApi = {
  getProfile: () => api.get<BusinessProfile>('/business-profile'),
  updateProfile: (updates: Partial<BusinessProfile>) =>
    api.put<BusinessProfile>('/business-profile', updates),
};

export const publisherApi = {
  getPublishers: () => api.get<Publisher[]>('/publishers'),
  getPublisher: (id: string) => api.get<Publisher>(`/publishers/${id}`),
  createPublisher: (data: Omit<Publisher, 'id' | 'totalPurchased' | 'totalPaid' | 'pendingDue'>) =>
    api.post<Publisher>('/publishers', data),
  updatePublisher: (id: string, updates: Partial<Publisher>) =>
    api.put<Publisher>(`/publishers/${id}`, updates),
  recordPayment: (publisherId: string, amount: number, note?: string) =>
    api.post<Publisher>(`/publishers/${publisherId}/payments`, { amount, note }),
};

export const bookApi = {
  getBooks: (params?: {
    search?: string;
    subject?: string;
    class?: string;
    publisherId?: string;
    lowStock?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.subject && params.subject !== 'All') query.set('subject', params.subject);
    if (params?.class && params.class !== 'All') query.set('class', params.class);
    if (params?.publisherId && params.publisherId !== 'All') query.set('publisherId', params.publisherId);
    if (params?.lowStock) query.set('lowStock', 'true');
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return api.get<Book[]>(`/books${qStr}`);
  },
  getBook: (id: string) => api.get<Book>(`/books/${id}`),
  createBook: (data: Omit<Book, 'id'>) => api.post<Book>('/books', data),
  updateBook: (id: string, updates: Partial<Book>) => api.put<Book>(`/books/${id}`, updates),
  deleteBook: (id: string) => api.delete<{ deleted: boolean }>(`/books/${id}`),
};

export const stationeryApi = {
  getStationery: (params?: { search?: string; category?: string; lowStock?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.lowStock) query.set('lowStock', 'true');
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return api.get<Stationery[]>(`/stationery${qStr}`);
  },
  createStationery: (data: Omit<Stationery, 'id'>) => api.post<Stationery>('/stationery', data),
  updateStationery: (id: string, updates: Partial<Stationery>) =>
    api.put<Stationery>(`/stationery/${id}`, updates),
};

export const schoolApi = {
  getSchools: (params?: { search?: string; status?: string; city?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.city && params.city !== 'All') query.set('city', params.city);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return api.get<School[]>(`/schools${qStr}`);
  },
  getSchool: (idOrCode: string) => api.get<School>(`/schools/${idOrCode}`),
  createSchool: (data: Omit<School, 'id'>) => api.post<School>('/schools', data),
  updateSchool: (id: string, updates: Partial<School>) => api.put<School>(`/schools/${id}`, updates),
  updateBookMappings: (schoolId: string, mappings: SchoolBookMapping[]) =>
    api.put<School>(`/schools/${schoolId}/book-mappings`, { mappings }),
  updateStationeryMappings: (schoolId: string, mappings: SchoolStationeryMapping[]) =>
    api.put<School>(`/schools/${schoolId}/stationery-mappings`, { mappings }),
};

export const orderApi = {
  getOrders: (params?: { search?: string; status?: string; source?: string; schoolId?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.source && params.source !== 'All') query.set('source', params.source);
    if (params?.schoolId) query.set('schoolId', params.schoolId);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return api.get<Order[]>(`/orders${qStr}`);
  },
  getOrder: (id: string) => api.get<Order>(`/orders/${id}`),
  createOrder: (data: {
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
  }) => api.post<Order>('/orders', data),
  updateStatus: (orderId: string, status: OrderStatus) =>
    api.put<Order>(`/orders/${orderId}/status`, { status }),
  collectPayment: (
    orderId: string,
    amount: number,
    method: PaymentMethod,
    note?: string,
    collectedBy?: string
  ) => api.post<Order>(`/orders/${orderId}/payments`, { amount, method, note, collectedBy }),
  processReturn: (
    orderId: string,
    items: Array<{ itemId: string; itemName: string; quantity: number; refundAmount: number; reason: any }>,
    notes?: string
  ) => api.post<Order>(`/orders/${orderId}/returns`, { items, notes }),
};

export const inventoryApi = {
  getOverview: () =>
    api.get<{
      totalBookStock: number;
      totalStationeryStock: number;
      totalUnits: number;
      lowStockCount: number;
      lowStockBooks: Book[];
      lowStockStationery: Stationery[];
      totalValuation: number;
    }>('/inventory/overview'),
  getMovements: (limit: number = 100) =>
    api.get<StockMovementRecord[]>(`/inventory/movements?limit=${limit}`),
  adjustStock: (data: {
    itemType: 'book' | 'stationery';
    itemId: string;
    change: number;
    type: 'Damage' | 'Adjustment In' | 'Adjustment Out';
    notes?: string;
  }) =>
    api.post<{ itemId: string; newStock: number; movement: StockMovementRecord }>(
      '/inventory/adjust',
      data
    ),
};

export const purchaseOrderApi = {
  getPurchaseOrders: () => api.get<PurchaseOrder[]>('/purchase-orders'),
  createPurchaseOrder: (
    data: Omit<PurchaseOrder, 'id' | 'orderDate' | 'status' | 'paidAmount' | 'remainingAmount'>
  ) => api.post<PurchaseOrder>('/purchase-orders', data),
  receiveStock: (poId: string, notes?: string) =>
    api.post<PurchaseOrder>(`/purchase-orders/${poId}/receive`, { notes }),
  payPurchaseOrder: (poId: string, amount: number, note?: string) =>
    api.post<PurchaseOrder>(`/purchase-orders/${poId}/payments`, { amount, note }),
};

export const dashboardApi = {
  getDashboardData: () =>
    api.get<{
      kpis: any;
      channelVelocity: any[];
      recentOrders: Order[];
      lowStockAlerts: Book[];
    }>('/dashboard'),
};

export const reportApi = {
  getExecutiveSummary: () =>
    api.get<{
      financials: any;
      schoolPerformance: any[];
      bestsellerBooks: any[];
      publishers: Publisher[];
    }>('/reports/summary'),
};
