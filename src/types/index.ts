export type OrderSource = 'Store' | 'Stall' | 'Employee' | 'Partner' | 'Public Link';

export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Returned';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

export type UserRole = 'Super Admin' | 'Store Manager' | 'Field Employee' | 'Campus Partner' | 'Manager' | 'Employee' | 'Partner';

export interface Publisher {
  id: string; // PUB-0001
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditDays?: number;
  paymentTerms?: string;
  status?: 'Active' | 'Inactive';
  totalPurchased: number;
  totalPaid: number;
  pendingDue: number;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
}

export interface Book {
  id: string; // BK-0001
  name: string;
  publisherId: string;
  publisherName: string;
  subject: string;
  applicableClass: string;
  isbn?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  status?: 'Active' | 'Inactive';
}

export interface Stationery {
  id: string; // ST-0001
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  status?: 'Active' | 'Inactive';
}

export interface SchoolBookMapping {
  bookId: string;
  classId: string;
  isMandatory: boolean;
}

export interface SchoolStationeryMapping {
  stationeryId: string;
  classId: string;
  defaultQuantity: number;
  isMandatory: boolean;
}

export interface School {
  id: string; // SCH-0001
  code: string; // ABC01
  name: string;
  address: string;
  city: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  classes: string[]; // e.g. ["Class 1", "Class 2", ...]
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  publicOrderingEnabled: boolean;
  expectedStudentsPerClass?: Record<string, number>;
  bookMappings: SchoolBookMapping[];
  stationeryMappings: SchoolStationeryMapping[];
}

export interface Student {
  id: string;
  schoolId: string;
  schoolName?: string;
  name: string;
  classId: string;
  parentName: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface OrderItem {
  id: string;
  type: 'book' | 'stationery';
  itemId: string;
  name: string;
  publisherOrCategory: string;
  classOrSpec?: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  referenceNo?: string;
  note?: string;
  collectedBy: string;
}

export interface OrderReturnRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitRefund?: number;
  refundAmount: number;
  reason: 'Wrong Book' | 'Duplicate' | 'Damaged' | 'Student Left' | 'Other';
  returnedAt: string;
  notes?: string;
}

export interface Order {
  id: string; // ORD-10254
  schoolId: string;
  schoolName: string;
  classId: string;
  studentId?: string;
  studentName: string;
  parentName?: string;
  phone: string;
  email?: string;
  address?: string;
  source: OrderSource;
  createdBy: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  payments: PaymentRecord[];
  returns?: OrderReturnRecord[];
  pickupOrDelivery: 'Stall Pickup' | 'Store Pickup' | 'Home Delivery' | 'School Desk';
  notes?: string;
}

export interface PurchaseOrderItem {
  itemId?: string;
  itemType?: 'book' | 'stationery';
  bookId?: string;
  bookName?: string;
  name?: string;
  publisherId?: string;
  publisherName?: string;
  quantity?: number;
  orderedQty?: number;
  unitCost?: number;
  unitPrice?: number;
  total: number;
}

export interface PurchaseOrder {
  id: string; // PUR-0001
  publisherId: string;
  publisherName: string;
  date?: string;
  orderDate?: string;
  items: PurchaseOrderItem[];
  subtotal?: number;
  gstAmount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  status: 'Draft' | 'Sent' | 'Ordered' | 'Partially Received' | 'Received' | 'Paid' | 'Cancelled';
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  stockReceivedAt?: string;
  receivedDate?: string;
  notes?: string;
}

export interface StockMovementRecord {
  id: string;
  timestamp: string;
  type:
    | 'Opening Stock'
    | 'Purchase Received'
    | 'PO Receiving'
    | 'Sale'
    | 'Customer Sale'
    | 'Customer Return'
    | 'Damage'
    | 'Adjustment In'
    | 'Adjustment Out';
  itemType: 'book' | 'stationery';
  itemId: string;
  itemName: string;
  change: number; // positive or negative
  newStock: number;
  referenceId?: string;
  notes?: string;
}

export interface StaffPartner {
  id: string; // EMP-0001 or PTR-0001
  name: string;
  type: 'Employee' | 'Partner';
  role: UserRole;
  phone: string;
  email: string;
  assignedSchoolCodes: string[];
  status?: 'Active' | 'Inactive';
  active?: boolean;
  commissionPct?: number;
  ordersCount?: number;
  totalSales?: number;
  token?: string;
}

export interface LoginLogRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  timestamp: string;
  ipAddress: string;
  location: string;
  device: string;
  terminal: string;
  status: 'Active' | 'Success' | 'Logged Out' | 'Failed';
  loginMethod: 'Password' | 'PIN Badge' | 'Quick Role Switch' | 'Session Token';
  sessionToken?: string;
}

export interface BusinessProfile {
  businessName: string;
  tagline: string;
  dealerLicenseNo: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  currencySymbol: string;
  receiptFooter?: string;
  autoConfirmOrders?: boolean;
}
