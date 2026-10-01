import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Publisher,
  Book,
  Stationery,
  School,
  Student,
  Order,
  PurchaseOrder,
  StockMovementRecord,
  StaffPartner,
  BusinessProfile,
  OrderStatus,
  PaymentMethod,
  SchoolBookMapping,
  SchoolStationeryMapping,
  OrderReturnRecord,
  LoginLogRecord,
} from '../types';
import {
  authApi,
  businessProfileApi,
  publisherApi,
  bookApi,
  stationeryApi,
  schoolApi,
  orderApi,
  inventoryApi,
  purchaseOrderApi,
} from '../api/services';

interface AppContextType {
  // Data State from Real Backend
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;

  businessProfile: BusinessProfile;
  publishers: Publisher[];
  books: Book[];
  stationery: Stationery[];
  schools: School[];
  students: Student[];
  orders: Order[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovementRecord[];
  staff: StaffPartner[];
  currentUser: StaffPartner;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  publicPortalOpen: boolean;
  setPublicPortalOpen: (open: boolean) => void;
  publicSelectedSchoolCode: string | null;
  setPublicSelectedSchoolCode: (code: string | null) => void;
  setCurrentUser: (user: StaffPartner) => void;

  // Authentication & Login Audit Logs
  loginLogs: LoginLogRecord[];
  fetchLoginLogs: (query?: any) => Promise<void>;
  loginUser: (
    emailOrId: string,
    terminal?: string,
    loginMethod?: 'Password' | 'PIN Badge' | 'Quick Role Switch' | 'Session Token'
  ) => Promise<void>;
  logoutUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isLoginPageOpen: boolean;
  setIsLoginPageOpen: (open: boolean) => void;

  // Sidebar Responsiveness & Collapsing
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Modals & Drawers
  isNewOrderOpen: boolean;
  setIsNewOrderOpen: (open: boolean) => void;
  selectedOrderForReceipt: Order | null;
  setSelectedOrderForReceipt: (order: Order | null) => void;
  selectedSchoolForDetail: School | null;
  setSelectedSchoolForDetail: (school: School | null) => void;

  // Toast Notifications
  toast: { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  dismissToast: () => void;

  // Real Backend API Operations
  addSchool: (school: Omit<School, 'id'>) => Promise<School>;
  updateSchool: (id: string, updates: Partial<School>) => Promise<void>;
  addBook: (book: Omit<Book, 'id'>) => Promise<Book>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  addStationery: (item: Omit<Stationery, 'id'>) => Promise<Stationery>;
  updateStationery: (id: string, updates: Partial<Stationery>) => Promise<void>;
  addPublisher: (pub: Omit<Publisher, 'id' | 'totalPurchased' | 'totalPaid' | 'pendingDue'>) => Promise<Publisher>;
  updatePublisher: (id: string, updates: Partial<Publisher>) => Promise<void>;
  recordPublisherPayment: (publisherId: string, amount: number, note?: string) => Promise<void>;
  updateSchoolBookMappings: (schoolId: string, mappings: SchoolBookMapping[]) => Promise<void>;
  updateSchoolStationeryMappings: (schoolId: string, mappings: SchoolStationeryMapping[]) => Promise<void>;
  createOrder: (orderData: any) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  collectOrderPayment: (orderId: string, amount: number, method: PaymentMethod, note?: string) => Promise<void>;
  processOrderReturn: (orderId: string, returnItems: Omit<OrderReturnRecord, 'id' | 'returnedAt'>[], notes?: string) => Promise<void>;
  adjustStock: (
    itemType: 'book' | 'stationery',
    itemId: string,
    change: number,
    type: 'Damage' | 'Adjustment In' | 'Adjustment Out',
    notes?: string
  ) => Promise<void>;
  createPurchaseOrder: (poData: any) => Promise<PurchaseOrder>;
  receivePurchaseOrderStock: (poId: string) => Promise<void>;
  payPurchaseOrder: (poId: string, amount: number) => Promise<void>;
  addStaff: (staffMember: Omit<StaffPartner, 'id'>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<StaffPartner>) => Promise<void>;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial fallback profile before API returns
const fallbackProfile: BusinessProfile = {
  businessName: 'Vanguard Book Distributors',
  tagline: 'Authorized School Book & Academic Stationery Dealer',
  address: 'Plot 42, Academic Arcade, Book Market Road, Central District',
  phone: '+91 98765 43210',
  email: 'orders@vanguardbooks.com',
  gstin: '07AAAAA0000A1Z5',
  dealerLicenseNo: 'DL-EDU-2024-9842',
  currencySymbol: '₹',
  receiptFooter: 'Thank you for choosing Vanguard Books.',
  autoConfirmOrders: true,
};

const fallbackStaff: StaffPartner = {
  id: 'STF-01',
  name: 'Vikram Malhotra',
  phone: '+91 98991 12233',
  email: 'vikram@vanguardbooks.com',
  role: 'Super Admin',
  type: 'Employee',
  assignedSchoolCodes: [],
  status: 'Active',
  active: true,
  ordersCount: 0,
  totalSales: 0,
  token: 'token-admin-session-001',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Entities loaded from backend REST APIs
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(fallbackProfile);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [stationery, setStationery] = useState<Stationery[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>([]);
  const [staff, setStaff] = useState<StaffPartner[]>([fallbackStaff]);
  const [currentUser, setCurrentUserState] = useState<StaffPartner>(fallbackStaff);
  const [loginLogs, setLoginLogs] = useState<LoginLogRecord[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [publicPortalOpen, setPublicPortalOpen] = useState<boolean>(false);
  const [publicSelectedSchoolCode, setPublicSelectedSchoolCode] = useState<string | null>(null);

  // Sidebar responsive mobile drawer & desktop collapse state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modals
  const [isNewOrderOpen, setIsNewOrderOpen] = useState<boolean>(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [selectedSchoolForDetail, setSelectedSchoolForDetail] = useState<School | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Fetch all domain data from real backend REST endpoints
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        profileRes,
        publishersRes,
        booksRes,
        stationeryRes,
        schoolsRes,
        ordersRes,
        poRes,
        movementsRes,
        staffRes,
        userRes,
        logsRes,
      ] = await Promise.all([
        businessProfileApi.getProfile(),
        publisherApi.getPublishers(),
        bookApi.getBooks(),
        stationeryApi.getStationery(),
        schoolApi.getSchools(),
        orderApi.getOrders(),
        purchaseOrderApi.getPurchaseOrders(),
        inventoryApi.getMovements(100),
        authApi.getStaff(),
        authApi.getCurrentUser(),
        authApi.getLoginLogs(),
      ]);

      setBusinessProfile(profileRes);
      setPublishers(publishersRes);
      setBooks(booksRes);
      setStationery(stationeryRes);
      setSchools(schoolsRes);
      setOrders(ordersRes);
      setPurchaseOrders(poRes);
      setStockMovements(movementsRes);
      setStaff(staffRes);
      setLoginLogs(logsRes);
      if (userRes) {
        setCurrentUserState(userRes);
        if (userRes.token) {
          localStorage.setItem('vanguard_auth_token', userRes.token);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch data from backend:', err);
      setError(err?.message || 'Error communicating with backend REST API');
      showToast('Could not load backend data. Please ensure the server is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial load on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const fetchLoginLogs = async (params?: any) => {
    try {
      const logs = await authApi.getLoginLogs(params);
      setLoginLogs(logs);
    } catch (err) {
      console.error('Failed to fetch login logs', err);
    }
  };

  const loginUser = async (
    emailOrId: string,
    terminal: string = 'Central Admin Workstation 01',
    loginMethod: any = 'Password'
  ) => {
    try {
      setIsLoading(true);
      const res = await authApi.login({
        emailOrId,
        terminal,
        loginMethod,
      });
      setCurrentUserState(res.user);
      if (res.user.token) {
        localStorage.setItem('vanguard_auth_token', res.user.token);
      }
      setLoginLogs((prev) => [res.log, ...prev]);
      setIsAuthModalOpen(false);
      setIsLoginPageOpen(false);
      showToast(`Welcome, ${res.user.name} (${res.user.role})! Logged in to ${terminal}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await authApi.logout(currentUser.id, currentUser.token);
      const updatedLogs = await authApi.getLoginLogs();
      setLoginLogs(updatedLogs);
      showToast(`Session ended for ${currentUser.name}. Please select a user profile to log in.`, 'info');
      setIsLoginPageOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Logout error', 'error');
    }
  };

  const setCurrentUser = (user: StaffPartner) => {
    setCurrentUserState(user);
    if (user.token) {
      localStorage.setItem('vanguard_auth_token', user.token);
    }
    showToast(`Switched active profile to ${user.name} (${user.role})`, 'info');
  };

  // ---------------- OPERATIONS WITH REAL API INTEGRATION ----------------

  const addSchool = async (schoolData: Omit<School, 'id'>): Promise<School> => {
    try {
      const created = await schoolApi.createSchool(schoolData);
      setSchools((prev) => [...prev, created]);
      showToast(`School ${created.name} (${created.code}) created successfully`, 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to create school', 'error');
      throw err;
    }
  };

  const updateSchool = async (id: string, updates: Partial<School>): Promise<void> => {
    try {
      const updated = await schoolApi.updateSchool(id, updates);
      setSchools((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (selectedSchoolForDetail?.id === id) {
        setSelectedSchoolForDetail(updated);
      }
      showToast('School updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update school', 'error');
      throw err;
    }
  };

  const updateSchoolBookMappings = async (schoolId: string, mappings: SchoolBookMapping[]): Promise<void> => {
    try {
      const updated = await schoolApi.updateBookMappings(schoolId, mappings);
      setSchools((prev) => prev.map((s) => (s.id === schoolId ? updated : s)));
      if (selectedSchoolForDetail?.id === schoolId) {
        setSelectedSchoolForDetail(updated);
      }
      showToast('Class book prescribed curriculum saved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update book mappings', 'error');
      throw err;
    }
  };

  const updateSchoolStationeryMappings = async (
    schoolId: string,
    mappings: SchoolStationeryMapping[]
  ): Promise<void> => {
    try {
      const updated = await schoolApi.updateStationeryMappings(schoolId, mappings);
      setSchools((prev) => prev.map((s) => (s.id === schoolId ? updated : s)));
      if (selectedSchoolForDetail?.id === schoolId) {
        setSelectedSchoolForDetail(updated);
      }
      showToast('Class stationery requirements saved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update stationery mappings', 'error');
      throw err;
    }
  };

  const addBook = async (bookData: Omit<Book, 'id'>): Promise<Book> => {
    try {
      const created = await bookApi.createBook(bookData);
      setBooks((prev) => [...prev, created]);
      showToast(`Book "${created.name}" registered in Master Catalog`, 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to register book', 'error');
      throw err;
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
    try {
      const updated = await bookApi.updateBook(id, updates);
      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      showToast('Book details updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update book', 'error');
      throw err;
    }
  };

  const deleteBook = async (id: string): Promise<void> => {
    try {
      await bookApi.deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      showToast('Book removed from catalog', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete book', 'error');
      throw err;
    }
  };

  const addStationery = async (itemData: Omit<Stationery, 'id'>): Promise<Stationery> => {
    try {
      const created = await stationeryApi.createStationery(itemData);
      setStationery((prev) => [...prev, created]);
      showToast(`Stationery item "${created.name}" added`, 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to add stationery item', 'error');
      throw err;
    }
  };

  const updateStationery = async (id: string, updates: Partial<Stationery>): Promise<void> => {
    try {
      const updated = await stationeryApi.updateStationery(id, updates);
      setStationery((prev) => prev.map((s) => (s.id === id ? updated : s)));
      showToast('Stationery details updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update stationery item', 'error');
      throw err;
    }
  };

  const addPublisher = async (
    pubData: Omit<Publisher, 'id' | 'totalPurchased' | 'totalPaid' | 'pendingDue'>
  ): Promise<Publisher> => {
    try {
      const created = await publisherApi.createPublisher(pubData);
      setPublishers((prev) => [...prev, created]);
      showToast(`Publisher "${created.name}" onboarded`, 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to add publisher', 'error');
      throw err;
    }
  };

  const updatePublisher = async (id: string, updates: Partial<Publisher>): Promise<void> => {
    try {
      const updated = await publisherApi.updatePublisher(id, updates);
      setPublishers((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast('Publisher profile updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update publisher', 'error');
      throw err;
    }
  };

  const recordPublisherPayment = async (
    publisherId: string,
    amount: number,
    note?: string
  ): Promise<void> => {
    try {
      const updated = await publisherApi.recordPayment(publisherId, amount, note);
      setPublishers((prev) => prev.map((p) => (p.id === publisherId ? updated : p)));
      showToast(`Payment of ${businessProfile.currencySymbol}${amount} recorded for ${updated.name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record publisher payment', 'error');
      throw err;
    }
  };

  const createOrder = async (orderData: any): Promise<Order> => {
    try {
      const newOrder = await orderApi.createOrder(orderData);
      setOrders((prev) => [newOrder, ...prev]);

      // Refresh inventory stock and movements after backend deduction
      const [updatedBooks, updatedStat, updatedMovements] = await Promise.all([
        bookApi.getBooks(),
        stationeryApi.getStationery(),
        inventoryApi.getMovements(100),
      ]);
      setBooks(updatedBooks);
      setStationery(updatedStat);
      setStockMovements(updatedMovements);

      showToast(`Order #${newOrder.id} placed successfully`, 'success');
      return newOrder;
    } catch (err: any) {
      showToast(err.message || 'Failed to create order', 'error');
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    try {
      const updated = await orderApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Order #${orderId} moved to ${newStatus}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
      throw err;
    }
  };

  const collectOrderPayment = async (
    orderId: string,
    amount: number,
    method: PaymentMethod,
    note?: string
  ): Promise<void> => {
    try {
      const updated = await orderApi.collectPayment(
        orderId,
        amount,
        method,
        note,
        currentUser.name
      );
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(
        `Payment of ${businessProfile.currencySymbol}${amount} recorded via ${method}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
      throw err;
    }
  };

  const processOrderReturn = async (
    orderId: string,
    returnItems: Omit<OrderReturnRecord, 'id' | 'returnedAt'>[],
    notes?: string
  ): Promise<void> => {
    try {
      const updated = await orderApi.processReturn(orderId, returnItems, notes);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));

      // Sync restocked books & stationery
      const [updatedBooks, updatedStat, updatedMovements] = await Promise.all([
        bookApi.getBooks(),
        stationeryApi.getStationery(),
        inventoryApi.getMovements(100),
      ]);
      setBooks(updatedBooks);
      setStationery(updatedStat);
      setStockMovements(updatedMovements);

      showToast(`Return processed for Order #${orderId}. Items restocked.`, 'warning');
    } catch (err: any) {
      showToast(err.message || 'Failed to process return', 'error');
      throw err;
    }
  };

  const adjustStock = async (
    itemType: 'book' | 'stationery',
    itemId: string,
    change: number,
    type: 'Damage' | 'Adjustment In' | 'Adjustment Out',
    notes?: string
  ): Promise<void> => {
    try {
      await inventoryApi.adjustStock({ itemType, itemId, change, type, notes });
      const [updatedBooks, updatedStat, updatedMovements] = await Promise.all([
        bookApi.getBooks(),
        stationeryApi.getStationery(),
        inventoryApi.getMovements(100),
      ]);
      setBooks(updatedBooks);
      setStationery(updatedStat);
      setStockMovements(updatedMovements);
      showToast(`Stock updated (${change > 0 ? '+' : ''}${change} units)`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
      throw err;
    }
  };

  const createPurchaseOrder = async (poData: any): Promise<PurchaseOrder> => {
    try {
      const created = await purchaseOrderApi.createPurchaseOrder(poData);
      setPurchaseOrders((prev) => [created, ...prev]);

      // Publisher payable increases
      const updatedPublishers = await publisherApi.getPublishers();
      setPublishers(updatedPublishers);

      showToast(`Purchase Order #${created.id} sent to ${created.publisherName}`, 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to create Purchase Order', 'error');
      throw err;
    }
  };

  const receivePurchaseOrderStock = async (poId: string): Promise<void> => {
    try {
      const updated = await purchaseOrderApi.receiveStock(poId, 'Received & verified by store manager');
      setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updated : p)));

      // Refresh stock & movements
      const [updatedBooks, updatedStat, updatedMovements] = await Promise.all([
        bookApi.getBooks(),
        stationeryApi.getStationery(),
        inventoryApi.getMovements(100),
      ]);
      setBooks(updatedBooks);
      setStationery(updatedStat);
      setStockMovements(updatedMovements);

      showToast(`Stock received and inventoried for ${poId}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to receive purchase order', 'error');
      throw err;
    }
  };

  const payPurchaseOrder = async (poId: string, amount: number): Promise<void> => {
    try {
      const updated = await purchaseOrderApi.payPurchaseOrder(poId, amount);
      setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updated : p)));

      const updatedPublishers = await publisherApi.getPublishers();
      setPublishers(updatedPublishers);

      showToast(`Payment of ${businessProfile.currencySymbol}${amount} recorded for PO #${poId}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record PO payment', 'error');
      throw err;
    }
  };

  const addStaff = async (staffMember: Omit<StaffPartner, 'id'>): Promise<void> => {
    try {
      const created = await authApi.addStaff(staffMember);
      setStaff((prev) => [...prev, created]);
      showToast(`Staff account for ${created.name} created`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add staff member', 'error');
      throw err;
    }
  };

  const updateStaff = async (id: string, updates: Partial<StaffPartner>): Promise<void> => {
    try {
      const updated = await authApi.updateStaff(id, updates);
      setStaff((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (currentUser.id === id) {
        setCurrentUserState(updated);
      }
      showToast('Staff member updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update staff member', 'error');
      throw err;
    }
  };

  const updateBusinessProfile = async (profileUpdates: Partial<BusinessProfile>): Promise<void> => {
    try {
      const updated = await businessProfileApi.updateProfile(profileUpdates);
      setBusinessProfile(updated);
      showToast('Dealership profile updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update business profile', 'error');
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        error,
        refreshData,
        businessProfile,
        publishers,
        books,
        stationery,
        schools,
        students: [],
        orders,
        purchaseOrders,
        stockMovements,
        staff,
        currentUser,
        setCurrentUser,
        loginLogs,
        fetchLoginLogs,
        loginUser,
        logoutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isLoginPageOpen,
        setIsLoginPageOpen,
        sidebarOpen,
        setSidebarOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        activeTab,
        setActiveTab,
        publicPortalOpen,
        setPublicPortalOpen,
        publicSelectedSchoolCode,
        setPublicSelectedSchoolCode,
        isNewOrderOpen,
        setIsNewOrderOpen,
        selectedOrderForReceipt,
        setSelectedOrderForReceipt,
        selectedSchoolForDetail,
        setSelectedSchoolForDetail,
        toast,
        showToast,
        dismissToast,
        addSchool,
        updateSchool,
        addBook,
        updateBook,
        deleteBook,
        addStationery,
        updateStationery,
        addPublisher,
        updatePublisher,
        recordPublisherPayment,
        updateSchoolBookMappings,
        updateSchoolStationeryMappings,
        createOrder,
        updateOrderStatus,
        collectOrderPayment,
        processOrderReturn,
        adjustStock,
        createPurchaseOrder,
        receivePurchaseOrderStock,
        payPurchaseOrder,
        addStaff,
        updateStaff,
        updateBusinessProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
