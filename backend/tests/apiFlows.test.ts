import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test, { type TestContext } from 'node:test';
import { createApp } from '../src/app.js';
import { MemoryStateRepository } from '../src/repositories/memoryStateRepository.js';
import { createDefaultStore, createEmptyStore, type DataStore } from '../src/repositories/store.js';
import type {
  Book, LoginLogRecord, Order, Publisher, PurchaseOrder, School,
  StaffPartner, Stationery, StockMovementRecord,
} from '../src/types.js';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// These are isolated local fixtures. This suite never loads .env or connects to a cloud database.
async function startApi(t: TestContext, repository: MemoryStateRepository) {
  await repository.initialize(createDefaultStore());
  const server = createApp(repository).listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  async function request<T>(path: string, method = 'GET', payload?: unknown, token?: string) {
    const response = await fetch(`${origin}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    return { status: response.status, body: await response.json() as ApiResponse<T> };
  }
  async function success<T>(path: string, method = 'GET', payload?: unknown, status = 200, token?: string): Promise<T> {
    const result = await request<T>(path, method, payload, token);
    assert.equal(result.status, status, `${method} ${path}: ${result.body.error ?? 'unexpected status'}`);
    assert.equal(result.body.success, true, `${method} ${path}`);
    return result.body.data;
  }
  return { request, success };
}

test('catalog CRUD preserves publisher, school and class mappings after a new app instance', { timeout: 20_000 }, async (t) => {
  const repository = new MemoryStateRepository();
  const api = await startApi(t, repository);
  const publisher = await api.success<Publisher>('/publishers', 'POST', {
    name: 'API Regression Publisher', contactPerson: 'Catalog Contact', phone: '9000000001',
    email: 'catalog@example.test', address: 'Local test address', creditDays: 30,
    bankDetails: { accountNumber: 'TEST-ACCOUNT', ifsc: 'TEST000001', bankName: 'Test Bank' },
  }, 201);
  assert.equal(publisher.totalPurchased, 0);
  assert.equal(publisher.pendingDue, 0);
  const updatedPublisher = await api.success<Publisher>(`/publishers/${publisher.id}`, 'PUT', { creditDays: 45 });
  assert.equal(updatedPublisher.name, publisher.name);
  assert.equal(updatedPublisher.creditDays, 45);

  const book = await api.success<Book>('/books', 'POST', {
    name: 'API Regression Mathematics', publisherId: publisher.id, publisherName: publisher.name,
    subject: 'Mathematics', applicableClass: '7', isbn: 'TEST-ISBN-001',
    purchasePrice: 80, sellingPrice: 100, currentStock: 10, minStock: 12,
  }, 201);
  const updatedBook = await api.success<Book>(`/books/${book.id}`, 'PUT', { sellingPrice: 110 });
  assert.equal(updatedBook.purchasePrice, 80);
  assert.equal(updatedBook.sellingPrice, 110);
  const filteredBooks = await api.success<Book[]>(`/books?search=TEST-ISBN-001&subject=Mathematics&class=7&publisherId=${publisher.id}&lowStock=true`);
  assert.deepEqual(filteredBooks, [updatedBook]);

  const stationery = await api.success<Stationery>('/stationery', 'POST', {
    name: 'API Regression Notebook', category: 'Notebook', unit: 'Piece',
    purchasePrice: 20, sellingPrice: 30, currentStock: 4, minStock: 5,
  }, 201);
  const updatedStationery = await api.success<Stationery>(`/stationery/${stationery.id}`, 'PUT', { sellingPrice: 35 });
  assert.equal(updatedStationery.currentStock, 4);
  const filteredStationery = await api.success<Stationery[]>('/stationery?search=API%20Regression&category=Notebook&lowStock=true');
  assert.deepEqual(filteredStationery, [updatedStationery]);

  const staff = await api.success<StaffPartner[]>('/auth/staff');
  const school = await api.success<School>('/schools', 'POST', {
    code: 'api-regression', name: 'API Regression School', city: 'Test City', address: 'Local campus',
    contactPerson: 'School Contact', phone: '9000000002', email: 'school@example.test', status: 'Active',
    classes: ['7'], publicOrderingEnabled: true, expectedStudentsPerClass: { '7': 40 },
    assignedEmployeeId: staff[0].id, assignedEmployeeName: staff[0].name,
  }, 201);
  assert.equal(school.code, 'API-REGRESSION');
  const bookMappings = [{ bookId: book.id, classId: '7', isMandatory: true }];
  const stationeryMappings = [{ stationeryId: stationery.id, classId: '7', defaultQuantity: 3, isMandatory: false }];
  await api.success<School>(`/schools/${school.id}/book-mappings`, 'PUT', { mappings: bookMappings });
  await api.success<School>(`/schools/${school.id}/stationery-mappings`, 'PUT', { mappings: stationeryMappings });
  const updatedSchool = await api.success<School>(`/schools/${school.id}`, 'PUT', { contactPerson: 'Updated Contact' });
  assert.deepEqual(updatedSchool.bookMappings, bookMappings);
  assert.deepEqual(updatedSchool.stationeryMappings, stationeryMappings);
  assert.equal(updatedSchool.assignedEmployeeId, staff[0].id);
  assert.deepEqual(await api.success<School[]>('/schools?search=API-REGRESSION&status=Active&city=test%20city'), [updatedSchool]);

  // Delete a separate unused title to check the existing delete contract without dangling fixture mappings.
  const disposable = await api.success<Book>('/books', 'POST', { ...updatedBook, name: 'Disposable local test title' }, 201);
  assert.deepEqual(await api.success(`/books/${disposable.id}`, 'DELETE'), { deleted: true });
  assert.equal((await api.request(`/books/${disposable.id}`)).status, 404);

  const restarted = await startApi(t, repository);
  assert.deepEqual(await restarted.success<Publisher>(`/publishers/${publisher.id}`), updatedPublisher);
  assert.deepEqual(await restarted.success<Book>(`/books/${book.id}`), updatedBook);
  assert.deepEqual(await restarted.success<School>('/schools/api-regression'), updatedSchool);
  assert.deepEqual((await restarted.success<Stationery[]>('/stationery')).find((item) => item.id === stationery.id), updatedStationery);
});

test('mixed-item order, payment, fulfillment and return update stock, dashboard and reports together', { timeout: 20_000 }, async (t) => {
  const repository = new MemoryStateRepository();
  const api = await startApi(t, repository);
  const before = (await repository.load()).data;
  const book = before.books[0];
  const stationery = before.stationery[0];
  const school = before.schools[0];
  const order = await api.success<Order>('/orders', 'POST', {
    schoolId: school.id, schoolName: school.name, classId: book.applicableClass,
    studentName: 'API Regression Student', parentName: 'Local Test Parent', phone: '9000000003',
    source: 'Store', createdBy: before.staff[0].name,
    items: [
      { id: 'TEST-LINE-1', type: 'book', itemId: book.id, name: book.name, publisherOrCategory: book.publisherName, unitPrice: 100, quantity: 2, total: 200 },
      { id: 'TEST-LINE-2', type: 'stationery', itemId: stationery.id, name: stationery.name, publisherOrCategory: stationery.category, unitPrice: 50, quantity: 1, total: 50 },
    ],
    subtotal: 250, discount: 0, total: 250, paidAmount: 0, remainingAmount: 250,
    paymentStatus: 'Pending', orderStatus: 'Confirmed', pickupOrDelivery: 'Store Pickup', notes: 'Local regression order',
  }, 201);
  assert.deepEqual(order.payments, []);
  let saved = (await repository.load()).data;
  assert.equal(saved.books.find((item) => item.id === book.id)?.currentStock, Math.max(0, book.currentStock - 2));
  assert.equal(saved.stationery.find((item) => item.id === stationery.id)?.currentStock, Math.max(0, stationery.currentStock - 1));
  const sales = saved.stockMovements.filter((movement) => movement.referenceId === order.id);
  assert.equal(sales.length, 2);
  assert.equal(sales.reduce((sum, movement) => sum + movement.change, 0), -3);
  assert.ok(sales.every((movement) => movement.type === 'Customer Sale'));

  const partial = await api.success<Order>(`/orders/${order.id}/payments`, 'POST', { amount: 100, method: 'UPI', collectedBy: 'Regression cashier', note: 'First installment' });
  assert.equal(partial.paymentStatus, 'Partial');
  assert.equal(partial.remainingAmount, 150);
  assert.equal(partial.payments[0].method, 'UPI');
  assert.equal(partial.payments[0].collectedBy, 'Regression cashier');
  const paid = await api.success<Order>(`/orders/${order.id}/payments`, 'POST', { amount: 150, method: 'Cash' });
  assert.equal(paid.paidAmount, 250);
  assert.equal(paid.remainingAmount, 0);
  assert.equal(paid.paymentStatus, 'Paid');
  assert.equal(paid.payments.length, 2);
  await api.success<Order>(`/orders/${order.id}/status`, 'PUT', { status: 'Ready' });
  const completed = await api.success<Order>(`/orders/${order.id}/status`, 'PUT', { status: 'Completed' });
  assert.equal(completed.orderStatus, 'Completed');
  const filtered = await api.success<Order[]>(`/orders?search=API%20Regression%20Student&status=completed&source=Store&schoolId=${school.id}`);
  assert.deepEqual(filtered, [completed]);

  const restarted = await startApi(t, repository);
  assert.deepEqual(await restarted.success<Order>(`/orders/${order.id}`), completed);
  const returned = await restarted.success<Order>(`/orders/${order.id}/returns`, 'POST', {
    items: [{ itemId: book.id, itemName: book.name, quantity: 1, refundAmount: 100, reason: 'Duplicate' }],
    notes: 'One title returned',
  });
  assert.equal(returned.orderStatus, 'Returned');
  assert.equal(returned.total, 150);
  assert.equal(returned.paidAmount, 150);
  assert.equal(returned.returns?.[0].quantity, 1);
  assert.equal(returned.returns?.[0].reason, 'Duplicate');
  saved = (await repository.load()).data;
  assert.equal(saved.books.find((item) => item.id === book.id)?.currentStock, Math.max(0, book.currentStock - 2) + 1);
  assert.equal(saved.stockMovements[0].type, 'Customer Return');
  assert.equal(saved.stockMovements[0].referenceId, order.id);

  const totals = {
    sales: saved.orders.reduce((sum, item) => sum + item.total, 0),
    received: saved.orders.reduce((sum, item) => sum + item.paidAmount, 0),
    pending: saved.orders.reduce((sum, item) => sum + item.remainingAmount, 0),
  };
  const dashboard = await restarted.success<{
    kpis: { totalSales: number; totalReceived: number; totalPending: number; totalSchoolsCount: number };
    recentOrders: Order[];
    channelVelocity: { channel: string; volume: number; orderCount: number }[];
  }>('/dashboard');
  assert.equal(dashboard.kpis.totalSales, totals.sales);
  assert.equal(dashboard.kpis.totalReceived, totals.received);
  assert.equal(dashboard.kpis.totalPending, totals.pending);
  assert.equal(dashboard.kpis.totalSchoolsCount, saved.schools.length);
  assert.deepEqual(dashboard.recentOrders[0], returned);
  const storeChannel = dashboard.channelVelocity.find((channel) => channel.channel === 'Store');
  assert.equal(storeChannel?.volume, saved.orders.filter((item) => item.source === 'Store').reduce((sum, item) => sum + item.total, 0));
  const report = await restarted.success<{
    financials: { totalSales: number; totalPaid: number; totalDue: number; totalValuation: number };
    schoolPerformance: { schoolId: string; ordersCount: number; revenue: number; collected: number }[];
    bestsellerBooks: { name: string; quantity: number; revenue: number }[];
  }>('/reports/summary');
  assert.equal(report.financials.totalSales, totals.sales);
  assert.equal(report.financials.totalPaid, totals.received);
  assert.equal(report.financials.totalDue, totals.pending);
  const schoolOrders = saved.orders.filter((item) => item.schoolId === school.id);
  assert.equal(report.schoolPerformance.find((item) => item.schoolId === school.id)?.ordersCount, schoolOrders.length);
  assert.equal(report.schoolPerformance.find((item) => item.schoolId === school.id)?.revenue, schoolOrders.reduce((sum, item) => sum + item.total, 0));
  const expectedValuation = saved.books.reduce((sum, item) => sum + item.currentStock * item.purchasePrice, 0)
    + saved.stationery.reduce((sum, item) => sum + item.currentStock * item.purchasePrice, 0);
  assert.equal(report.financials.totalValuation, expectedValuation);
});

test('purchase receiving and supplier payments persist their linked stock and balances', { timeout: 20_000 }, async (t) => {
  const repository = new MemoryStateRepository();
  const api = await startApi(t, repository);
  const before = (await repository.load()).data;
  const publisher = before.publishers[0];
  const book = before.books.find((item) => item.publisherId === publisher.id)!;
  const stationery = before.stationery[0];
  const po = await api.success<PurchaseOrder>('/purchase-orders', 'POST', {
    publisherId: publisher.id, publisherName: publisher.name,
    items: [
      { itemId: book.id, itemType: 'book', name: book.name, publisherName: publisher.name, orderedQty: 4, unitPrice: 80, total: 320 },
      { itemId: stationery.id, itemType: 'stationery', name: stationery.name, publisherName: publisher.name, orderedQty: 2, unitPrice: 20, total: 40 },
    ],
    subtotal: 360, gstAmount: 0, totalAmount: 360, notes: 'Local test purchase',
  }, 201);
  assert.equal(po.status, 'Sent');
  assert.equal(po.remainingAmount, 360);
  const afterCreate = await api.success<Publisher>(`/publishers/${publisher.id}`);
  assert.equal(afterCreate.totalPurchased, publisher.totalPurchased + 360);
  assert.equal(afterCreate.pendingDue, publisher.pendingDue + 360);
  const received = await api.success<PurchaseOrder>(`/purchase-orders/${po.id}/receive`, 'POST', { notes: 'Local stock receipt' });
  assert.equal(received.status, 'Received');
  assert.match(received.receivedDate ?? '', /^\d{4}-\d{2}-\d{2}$/);
  const paid = await api.success<PurchaseOrder>(`/purchase-orders/${po.id}/payments`, 'POST', { amount: 360 });
  assert.equal(paid.status, 'Paid');
  assert.equal(paid.paidAmount, 360);
  assert.equal(paid.remainingAmount, 0);
  const supplierPayment = await api.success<Publisher>(`/publishers/${publisher.id}/payments`, 'POST', { amount: 25, note: 'Existing supplier balance' });
  assert.equal(supplierPayment.totalPaid, publisher.totalPaid + 385);
  assert.equal(supplierPayment.pendingDue, Math.max(0, publisher.pendingDue - 25));

  const adjusted = await api.success<{ itemId: string; newStock: number; movement: StockMovementRecord }>('/inventory/adjust', 'POST', {
    itemType: 'stationery', itemId: stationery.id, change: -1, type: 'Damage', notes: 'Local test damaged item',
  });
  assert.equal(adjusted.newStock, stationery.currentStock + 1);
  assert.equal(adjusted.movement.notes, 'Local test damaged item');
  const restarted = await startApi(t, repository);
  assert.deepEqual((await restarted.success<PurchaseOrder[]>('/purchase-orders')).find((item) => item.id === po.id), paid);
  assert.deepEqual(await restarted.success<Publisher>(`/publishers/${publisher.id}`), supplierPayment);
  assert.equal((await restarted.success<Book>(`/books/${book.id}`)).currentStock, book.currentStock + 4);
  const snapshot = (await repository.load()).data;
  const overview = await restarted.success<{ totalBookStock: number; totalStationeryStock: number; totalUnits: number; totalValuation: number }>('/inventory/overview');
  assert.equal(overview.totalBookStock, snapshot.books.reduce((sum, item) => sum + item.currentStock, 0));
  assert.equal(overview.totalStationeryStock, snapshot.stationery.reduce((sum, item) => sum + item.currentStock, 0));
  assert.equal(overview.totalUnits, overview.totalBookStock + overview.totalStationeryStock);
  const movements = await restarted.success<StockMovementRecord[]>('/inventory/movements?limit=3');
  assert.equal(movements.length, 3);
  assert.deepEqual(movements[0], adjusted.movement);
  const receipts = movements.filter((movement) => movement.referenceId === po.id);
  assert.equal(receipts.length, 2);
  assert.ok(receipts.every((movement) => movement.type === 'PO Receiving'));

  const unchanged = await repository.load();
  for (const path of [`/purchase-orders/${po.id}/payments`, `/publishers/${publisher.id}/payments`]) {
    const invalid = await restarted.request(path, 'POST', { amount: 0 });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.success, false);
  }
  assert.deepEqual(await repository.load(), unchanged);
});

test('every existing role retains identity, staff edits and login/logout log contracts', { timeout: 20_000 }, async (t) => {
  const repository = new MemoryStateRepository();
  const api = await startApi(t, repository);
  const staff = await api.success<StaffPartner[]>('/auth/staff');
  assert.deepEqual(new Set(staff.map((member) => member.role)), new Set(['Super Admin', 'Store Manager', 'Field Employee', 'Campus Partner']));
  for (const member of staff) {
    const login = await api.success<{ user: StaffPartner; log: LoginLogRecord }>('/auth/login', 'POST', {
      emailOrId: member.email.toUpperCase(), loginMethod: 'Quick Role Switch', terminal: 'Local test store POS',
    });
    assert.equal(login.user.id, member.id);
    assert.equal(login.user.role, member.role);
    assert.equal(login.log.role, member.role);
    assert.equal(login.log.status, 'Active');
    const current = await api.success<StaffPartner>('/auth/me', 'GET', undefined, 200, login.log.sessionToken);
    assert.equal(current.id, member.id);
    const logs = await api.success<LoginLogRecord[]>(`/auth/logs?userId=${member.id}&role=${encodeURIComponent(member.role)}&status=Active&limit=1`);
    assert.deepEqual(logs, [login.log]);
    assert.deepEqual(await api.success('/auth/logout', 'POST', { token: login.log.sessionToken }), { loggedOut: true });
  }
  const beforeInvalid = await repository.load();
  assert.equal((await api.request('/auth/login', 'POST', { emailOrId: 'absent@example.test' })).status, 404);
  assert.equal((await api.request('/auth/login', 'POST', {})).status, 400);
  assert.deepEqual(await repository.load(), beforeInvalid);

  const added = await api.success<StaffPartner>('/auth/staff', 'POST', {
    name: 'Local Regression Staff', email: 'staff@example.test', phone: '9000000004', role: 'Field Employee',
    type: 'Employee', assignedSchoolCodes: ['DPS45'], active: true,
  }, 201);
  const updated = await api.success<StaffPartner>(`/auth/staff/${added.id}`, 'PUT', { assignedSchoolCodes: ['DPS45', 'TEST'], commissionPct: 5 });
  assert.equal(updated.role, added.role);
  assert.equal(updated.token, added.token);
  assert.deepEqual(updated.assignedSchoolCodes, ['DPS45', 'TEST']);
  const restarted = await startApi(t, repository);
  assert.deepEqual((await restarted.success<StaffPartner[]>('/auth/staff')).find((member) => member.id === added.id), updated);
  const logoutLogs = await restarted.success<LoginLogRecord[]>('/auth/logs?status=Logged%20Out&search=Local%20test%20store%20POS');
  assert.equal(logoutLogs.length, staff.length);
  assert.deepEqual(new Set(logoutLogs.map((log) => log.role)), new Set(staff.map((member) => member.role)));
  // The original API models role identities, but contains no authorization middleware.
  // Enforced role permissions are intentionally not claimed by these contract regressions.
});

test('complete backups restore nested order payments, school mappings and movement history intact', { timeout: 20_000 }, async (t) => {
  const repository = new MemoryStateRepository();
  const api = await startApi(t, repository);
  const original = await api.success<{ version: string; store: DataStore }>('/admin/backup');
  assert.equal(original.version, '2.4.0');
  const custom = structuredClone(original.store);
  custom.businessProfile.businessName = 'Local restored regression business';
  custom.orders[0].payments.push({
    id: 'LOCAL-RESTORE-PAYMENT', date: '2026-10-01 12:00', amount: 25,
    method: 'Bank Transfer', note: 'Preserve nested history', collectedBy: 'Test staff',
  });
  custom.schools[0].bookMappings = [{ bookId: custom.books[0].id, classId: '7', isMandatory: true }];
  custom.stockMovements[0].notes = 'Preserve movement history';
  const restored = await api.success<{ message: string; store: DataStore }>('/admin/restore', 'POST', { store: custom });
  assert.deepEqual(restored.store, custom);
  const restarted = await startApi(t, repository);
  assert.deepEqual((await restarted.success<{ store: DataStore }>('/admin/backup')).store, custom);
  assert.deepEqual(await restarted.success<Order>(`/orders/${custom.orders[0].id}`), custom.orders[0]);
  assert.deepEqual(await restarted.success<School>(`/schools/${custom.schools[0].id}`), custom.schools[0]);
  const reset = await restarted.success<{ store: DataStore }>('/admin/reset', 'POST');
  assert.deepEqual(reset.store, original.store);
  assert.deepEqual((await repository.load()).data, original.store);
});

test('an empty persistent-store shape serves all read contracts and accepts the first staff login without demo rows', { timeout: 20_000 }, async (t) => {
  const repository = new MemoryStateRepository();
  const empty = createEmptyStore();
  await repository.initialize(empty);
  const api = await startApi(t, repository);
  assert.equal(await api.success('/auth/me'), null);
  for (const path of ['/books', '/publishers', '/stationery', '/schools', '/orders', '/purchase-orders', '/auth/staff', '/auth/logs', '/inventory/movements']) {
    assert.deepEqual(await api.success(path), [], path);
  }
  assert.deepEqual(await api.success('/business-profile'), empty.businessProfile);
  const dashboard = await api.success<{
    kpis: Record<string, number>; recentOrders: Order[]; lowStockAlerts: Book[];
    channelVelocity: { orderCount: number; volume: number; percentage: number }[];
  }>('/dashboard');
  assert.ok(Object.values(dashboard.kpis).every((value) => value === 0));
  assert.deepEqual(dashboard.recentOrders, []);
  assert.deepEqual(dashboard.lowStockAlerts, []);
  assert.ok(dashboard.channelVelocity.every((channel) => channel.volume === 0 && channel.orderCount === 0));
  const overview = await api.success<{
    totalBookStock: number; totalStationeryStock: number; totalUnits: number;
    lowStockCount: number; lowStockBooks: Book[]; lowStockStationery: Stationery[]; totalValuation: number;
  }>('/inventory/overview');
  assert.deepEqual(overview, {
    totalBookStock: 0, totalStationeryStock: 0, totalUnits: 0, lowStockCount: 0,
    lowStockBooks: [], lowStockStationery: [], totalValuation: 0,
  });
  const report = await api.success<{
    financials: Record<string, number>; schoolPerformance: unknown[]; bestsellerBooks: unknown[]; publishers: Publisher[];
  }>('/reports/summary');
  assert.ok(Object.values(report.financials).every((value) => value === 0));
  assert.deepEqual(report.schoolPerformance, []);
  assert.deepEqual(report.bestsellerBooks, []);
  assert.deepEqual(report.publishers, []);
  assert.deepEqual((await api.success<{ store: DataStore }>('/admin/backup')).store, empty);
  // Reading a fresh store must not populate it with sample publishers, inventory or staff.
  assert.deepEqual((await repository.load()).data, empty);
  assert.equal((await repository.load()).revision, 0);

  const firstStaff = await api.success<StaffPartner>('/auth/staff', 'POST', {
    name: 'First Local Administrator', email: 'first-admin@example.test', phone: '9000000005',
    role: 'Super Admin', type: 'Employee', assignedSchoolCodes: [], active: true,
  }, 201);
  const login = await api.success<{ user: StaffPartner; log: LoginLogRecord }>('/auth/login', 'POST', { emailOrId: firstStaff.email });
  const restarted = await startApi(t, repository);
  assert.deepEqual(await restarted.success<StaffPartner>('/auth/me', 'GET', undefined, 200, login.log.sessionToken), firstStaff);
  const persisted = (await repository.load()).data;
  assert.equal(persisted.staff.length, 1);
  assert.equal(persisted.loginLogs.length, 1);
  assert.deepEqual(persisted.books, []);
  assert.deepEqual(persisted.publishers, []);
  assert.deepEqual(persisted.orders, []);
});
