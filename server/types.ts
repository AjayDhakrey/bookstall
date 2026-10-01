// Server domain types matching the dealer operations schema
export type UserRole = 'Super Admin' | 'Store Manager' | 'Field Employee' | 'Campus Partner';
export type StaffType = 'Employee' | 'Partner';
export type OrderSource = 'Store' | 'Stall' | 'Public Link' | 'Employee' | 'Partner';
export type OrderStatus = 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Returned' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export interface StaffPartner {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  type: StaffType;
  assignedSchoolCodes: string[];
  commissionPct?: number;
  active: boolean;
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
  address: string;
  phone: string;
  email: string;
  gstin: string;
  dealerLicenseNo: string;
  currencySymbol: string;
}

export interface Publisher {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditDays: number;
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
  id: string;
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
}

export interface Stationery {
  id: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
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
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  classes: string[];
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  publicOrderingEnabled: boolean;
  expectedStudentsPerClass?: Record<string, number>;
  bookMappings: SchoolBookMapping[];
  stationeryMappings: SchoolStationeryMapping[];
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
  note?: string;
  collectedBy: string;
}

export interface OrderReturnRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  refundAmount: number;
  reason: 'Wrong Book' | 'Duplicate' | 'Damaged' | 'Student Left' | 'Other';
  returnedAt: string;
  notes?: string;
}

export interface Order {
  id: string;
  schoolId: string;
  schoolName: string;
  classId: string;
  studentName: string;
  parentName?: string;
  phone: string;
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
  pickupOrDelivery: 'Stall Pickup' | 'Store Pickup' | 'Home Delivery';
  notes?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemType: 'book' | 'stationery';
  name: string;
  publisherName: string;
  orderedQty: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  publisherId: string;
  publisherName: string;
  orderDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Received' | 'Paid';
  receivedDate?: string;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
}

export interface StockMovementRecord {
  id: string;
  timestamp: string;
  type: 'Customer Sale' | 'PO Receiving' | 'Customer Return' | 'Damage' | 'Adjustment In' | 'Adjustment Out';
  itemType: 'book' | 'stationery';
  itemId: string;
  itemName: string;
  change: number;
  newStock: number;
  referenceId: string;
  notes?: string;
}
