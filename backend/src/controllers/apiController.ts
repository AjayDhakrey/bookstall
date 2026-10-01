import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { businessProfileService } from '../services/businessProfileService.js';
import { publisherService } from '../services/publisherService.js';
import { bookService } from '../services/bookService.js';
import { stationeryService } from '../services/stationeryService.js';
import { schoolService } from '../services/schoolService.js';
import { orderService } from '../services/orderService.js';
import { inventoryService } from '../services/inventoryService.js';
import { purchaseOrderService } from '../services/purchaseOrderService.js';
import { dashboardService, reportService } from '../services/dashboardService.js';
import { getStore, resetStore, restoreStore } from '../repositories/store.js';
import { sendSuccess, sendError } from '../middleware/httpResponses.js';
import { authenticate, requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Automatically authenticate token on all incoming requests
router.use(authenticate);

// ======================== AUTH & STAFF ========================
router.get('/auth/me', (req: Request, res: Response) => {
  try {
    const user = authService.getCurrentUser(req.headers.authorization);
    return sendSuccess(res, user);
  } catch (err) {
    return sendError(res, err, 401);
  }
});

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { emailOrId, password, terminal, device, ipAddress, loginMethod } = req.body;
    if (!emailOrId) return sendError(res, 'emailOrId is required', 400);

    const clientIp =
      ipAddress ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '192.168.1.100';

    const clientDevice = device || req.headers['user-agent'] || 'Chrome Web';

    const result = authService.login(emailOrId, {
      password,
      terminal,
      device: clientDevice,
      ipAddress: clientIp,
      loginMethod: loginMethod || 'Password',
    });

    return sendSuccess(res, result);
  } catch (err: any) {
    const isCredentialsError = err?.message?.toLowerCase().includes('password') || err?.message?.toLowerCase().includes('not found') || err?.message?.toLowerCase().includes('invalid');
    const status = isCredentialsError ? 404 : 400;
    return sendError(res, err, status);
  }
});

router.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const identifier = userId || token || headerToken || req.user?.id;
    authService.logout(identifier);
    return sendSuccess(res, { loggedOut: true });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/auth/logs', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const query = {
      search: req.query.search as string,
      role: req.query.role as string,
      userId: req.query.userId as string,
      status: req.query.status as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const logs = authService.getLoginLogs(query);
    return sendSuccess(res, logs);
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/auth/staff', requireRole('Super Admin'), (req: Request, res: Response) => {
  try {
    const staff = authService.listStaff();
    return sendSuccess(res, staff);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/auth/staff', requireRole('Super Admin'), (req: Request, res: Response) => {
  try {
    const newStaff = authService.addStaff(req.body);
    return sendSuccess(res, newStaff, 201);
  } catch (err) {
    return sendError(res, err);
  }
});

router.put('/auth/staff/:id', requireRole('Super Admin'), (req: Request, res: Response) => {
  try {
    const updated = authService.updateStaff(req.params.id, req.body);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

// ======================== BUSINESS PROFILE ========================
router.get('/business-profile', (req: Request, res: Response) => {
  try {
    const profile = businessProfileService.getProfile();
    return sendSuccess(res, profile);
  } catch (err) {
    return sendError(res, err);
  }
});

router.put('/business-profile', requireRole('Super Admin'), (req: Request, res: Response) => {
  try {
    const updated = businessProfileService.updateProfile(req.body);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err);
  }
});

// ======================== PUBLISHERS ========================
router.get('/publishers', (req: Request, res: Response) => {
  try {
    const publishers = publisherService.getPublishers();
    return sendSuccess(res, publishers);
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/publishers/:id', (req: Request, res: Response) => {
  try {
    const pub = publisherService.getPublisherById(req.params.id);
    if (!pub) return sendError(res, 'Publisher not found', 404);
    return sendSuccess(res, pub);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/publishers', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const created = publisherService.createPublisher(req.body);
    return sendSuccess(res, created, 201);
  } catch (err) {
    return sendError(res, err);
  }
});

router.put('/publishers/:id', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const updated = publisherService.updatePublisher(req.params.id, req.body);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

router.post('/publishers/:id/payments', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const { amount, note } = req.body;
    if (!amount || amount <= 0) return sendError(res, 'Valid amount is required', 400);
    const updated = publisherService.recordPayment(req.params.id, Number(amount), note);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

// ======================== BOOKS ========================
router.get('/books', (req: Request, res: Response) => {
  try {
    const query = {
      search: req.query.search as string,
      subject: req.query.subject as string,
      applicableClass: req.query.class as string,
      publisherId: req.query.publisherId as string,
      lowStock: req.query.lowStock === 'true',
    };
    const books = bookService.getBooks(query);
    return sendSuccess(res, books);
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/books/:id', (req: Request, res: Response) => {
  try {
    const book = bookService.getBookById(req.params.id);
    if (!book) return sendError(res, 'Book not found', 404);
    return sendSuccess(res, book);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/books', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const newBook = bookService.createBook(req.body);
    return sendSuccess(res, newBook, 201);
  } catch (err) {
    return sendError(res, err);
  }
});

router.put('/books/:id', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const updated = bookService.updateBook(req.params.id, req.body);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

router.delete('/books/:id', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const deleted = bookService.deleteBook(req.params.id);
    if (!deleted) return sendError(res, 'Book not found', 404);
    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return sendError(res, err);
  }
});

// ======================== STATIONERY ========================
router.get('/stationery', (req: Request, res: Response) => {
  try {
    const query = {
      search: req.query.search as string,
      category: req.query.category as string,
      lowStock: req.query.lowStock === 'true',
    };
    const stationery = stationeryService.getStationery(query);
    return sendSuccess(res, stationery);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/stationery', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const created = stationeryService.createStationery(req.body);
    return sendSuccess(res, created, 201);
  } catch (err) {
    return sendError(res, err);
  }
});

router.put('/stationery/:id', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const updated = stationeryService.updateStationery(req.params.id, req.body);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

// ======================== SCHOOLS ========================
router.get('/schools', (req: Request, res: Response) => {
  try {
    const query = {
      search: req.query.search as string,
      status: req.query.status as string,
      city: req.query.city as string,
    };
    const schools = schoolService.getSchools(query);
    return sendSuccess(res, schools);
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/schools/:idOrCode', (req: Request, res: Response) => {
  try {
    const school = schoolService.getSchoolByIdOrCode(req.params.idOrCode);
    if (!school) return sendError(res, 'School not found', 404);
    return sendSuccess(res, school);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/schools', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const created = schoolService.createSchool(req.body);
    return sendSuccess(res, created, 201);
  } catch (err) {
    return sendError(res, err);
  }
});

router.put('/schools/:id', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const updated = schoolService.updateSchool(req.params.id, req.body);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

router.put('/schools/:id/book-mappings', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const updated = schoolService.updateBookMappings(req.params.id, req.body.mappings);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

router.put('/schools/:id/stationery-mappings', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const updated = schoolService.updateStationeryMappings(req.params.id, req.body.mappings);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

// ======================== ORDERS ========================
router.get('/orders', (req: Request, res: Response) => {
  try {
    const query = {
      search: req.query.search as string,
      status: req.query.status as string,
      source: req.query.source as string,
      schoolId: req.query.schoolId as string,
    };
    const orders = orderService.getOrders(query);
    return sendSuccess(res, orders);
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/orders/:id', (req: Request, res: Response) => {
  try {
    const order = orderService.getOrderById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    return sendSuccess(res, order);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/orders', (req: Request, res: Response) => {
  try {
    const created = orderService.createOrder(req.body);
    return sendSuccess(res, created, 201);
  } catch (err) {
    return sendError(res, err);
  }
});

router.put('/orders/:id/status', requireAuth, (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 'Status is required', 400);
    const updated = orderService.updateOrderStatus(req.params.id, status);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

router.post('/orders/:id/payments', requireAuth, (req: Request, res: Response) => {
  try {
    const { amount, method, note, collectedBy } = req.body;
    if (!amount || amount <= 0) return sendError(res, 'Valid amount is required', 400);
    const updated = orderService.collectPayment(
      req.params.id,
      Number(amount),
      method || 'Cash',
      note,
      collectedBy || req.user?.name || 'Authorized Staff'
    );
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

router.post('/orders/:id/returns', requireAuth, (req: Request, res: Response) => {
  try {
    const { items, notes } = req.body;
    if (!items || !Array.isArray(items)) return sendError(res, 'Items array required', 400);
    const updated = orderService.processReturn(req.params.id, items, notes);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

// ======================== INVENTORY ========================
router.get('/inventory/overview', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const overview = inventoryService.getStockOverview();
    return sendSuccess(res, overview);
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/inventory/movements', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const movements = inventoryService.getMovements(limit);
    return sendSuccess(res, movements);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/inventory/adjust', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const { itemType, itemId, change, type, notes } = req.body;
    if (!itemType || !itemId || change === undefined) {
      return sendError(res, 'itemType, itemId, and change are required', 400);
    }
    const result = inventoryService.adjustStock(
      itemType,
      itemId,
      Number(change),
      type || 'Damage',
      notes
    );
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

// ======================== PURCHASE ORDERS ========================
router.get('/purchase-orders', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const pos = purchaseOrderService.getPurchaseOrders();
    return sendSuccess(res, pos);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/purchase-orders', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const created = purchaseOrderService.createPurchaseOrder(req.body);
    return sendSuccess(res, created, 201);
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/purchase-orders/:id/receive', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const updated = purchaseOrderService.receivePurchaseOrderStock(req.params.id, req.body.notes);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

router.post('/purchase-orders/:id/payments', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const { amount, note } = req.body;
    if (!amount || amount <= 0) return sendError(res, 'Valid amount is required', 400);
    const updated = purchaseOrderService.payPurchaseOrder(req.params.id, Number(amount), note);
    return sendSuccess(res, updated);
  } catch (err) {
    return sendError(res, err, 404);
  }
});

// ======================== DASHBOARD & REPORTS ========================
router.get('/dashboard', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const data = dashboardService.getDashboardData();
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err);
  }
});

router.get('/reports/summary', requireRole('Super Admin', 'Store Manager'), (req: Request, res: Response) => {
  try {
    const summary = reportService.getExecutiveSummary();
    return sendSuccess(res, summary);
  } catch (err) {
    return sendError(res, err);
  }
});

// ======================== ADMIN DATABASE READY UTILITIES ========================
router.get('/admin/backup', requireRole('Super Admin'), (req: Request, res: Response) => {
  try {
    const currentStore = getStore();
    return sendSuccess(res, {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      system: 'Vanguard Book Dealer Management System',
      store: currentStore,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/admin/restore', requireRole('Super Admin'), (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const storeToRestore = payload.store || payload;
    if (!storeToRestore || typeof storeToRestore !== 'object') {
      return sendError(res, 'Invalid backup data format', 400);
    }
    const updated = restoreStore(storeToRestore);
    return sendSuccess(res, { message: 'Database restored successfully', store: updated });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/admin/reset', requireRole('Super Admin'), (req: Request, res: Response) => {
  try {
    const reset = resetStore();
    return sendSuccess(res, { message: 'Database reset to benchmark showroom defaults', store: reset });
  } catch (err) {
    return sendError(res, err);
  }
});

export default router;

