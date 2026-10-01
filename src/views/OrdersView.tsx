import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, OrderSource, PaymentMethod } from '../types';
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  RotateCcw,
  CreditCard,
  X,
  ArrowRight,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Package,
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const {
    orders,
    setIsNewOrderOpen,
    setSelectedOrderForReceipt,
    updateOrderStatus,
    collectOrderPayment,
    processOrderReturn,
    businessProfile,
    currentUser,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  // Collect Payment Modal state
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('Cash');
  const [collectNote, setCollectNote] = useState('');

  // Process Return Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItemQuantities, setReturnItemQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState<
    'Wrong Book' | 'Duplicate' | 'Damaged' | 'Student Left' | 'Other'
  >('Wrong Book');
  const [returnNotes, setReturnNotes] = useState('');

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (activeTab === 'pending-payment' && order.paymentStatus === 'Paid') return false;
    if (activeTab === 'preparing' && order.orderStatus !== 'Preparing') return false;
    if (activeTab === 'ready' && order.orderStatus !== 'Ready') return false;
    if (activeTab === 'completed' && order.orderStatus !== 'Completed') return false;
    if (activeTab === 'returns' && !order.returns?.length && order.orderStatus !== 'Returned') return false;

    // Source filter
    if (sourceFilter !== 'All' && order.source !== sourceFilter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchStudent = order.studentName.toLowerCase().includes(q);
      const matchSchool = order.schoolName.toLowerCase().includes(q);
      const matchPhone = order.phone.includes(q);
      if (!matchId && !matchStudent && !matchSchool && !matchPhone) return false;
    }

    return true;
  });

  const totalBilled = orders.reduce((acc, o) => acc + o.total, 0);
  const totalCollected = orders.reduce((acc, o) => acc + o.paidAmount, 0);
  const totalDue = orders.reduce((acc, o) => acc + o.remainingAmount, 0);

  const handleCollectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDetail) return;
    const amt = Number(collectAmount);
    if (!amt || amt <= 0) return;

    collectOrderPayment(selectedOrderForDetail.id, amt, collectMethod, collectNote);

    // Refresh selected order in drawer
    const updated = orders.find((o) => o.id === selectedOrderForDetail.id);
    if (updated) {
      const newPaid = updated.paidAmount + amt;
      const newRemaining = Math.max(0, updated.total - newPaid);
      setSelectedOrderForDetail({
        ...updated,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        paymentStatus: newRemaining === 0 ? 'Paid' : 'Partial',
      });
    }

    setIsCollectPaymentOpen(false);
    setCollectAmount('');
    setCollectNote('');
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDetail) return;

    const returnItemsToProcess: any[] = [];
    Object.entries(returnItemQuantities).forEach(([itemId, qty]) => {
      if (qty > 0) {
        const item = selectedOrderForDetail.items.find((i) => i.itemId === itemId);
        if (item) {
          returnItemsToProcess.push({
            itemId: item.itemId,
            itemName: item.name,
            quantity: qty,
            refundAmount: item.unitPrice * qty,
            reason: returnReason,
          });
        }
      }
    });

    if (returnItemsToProcess.length === 0) return;

    processOrderReturn(
      selectedOrderForDetail.id,
      returnItemsToProcess,
      `${returnReason}: ${returnNotes}`
    );

    setIsReturnModalOpen(false);
    setReturnItemQuantities({});
    setReturnNotes('');
    setSelectedOrderForDetail(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Orders & Dispatches Console
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single repository for in-store sales, campus stall pickups, field rep orders, and parent portal links
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-auto card-3d-press"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Order</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Total Orders Placed</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {orders.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">all channels combined</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Billed Sales Volume</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {businessProfile.currencySymbol}{totalBilled.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">gross invoice value</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Collected Cash / UPI</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {businessProfile.currencySymbol}{totalCollected.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">realized revenue</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Outstanding Balances</span>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {businessProfile.currencySymbol}{totalDue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">due on delivery / pickup</p>
        </div>
      </div>

      {/* 3. Filter Segmented Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            {
              id: 'pending-payment',
              label: 'Unpaid Dues',
              count: orders.filter((o) => o.paymentStatus !== 'Paid').length,
            },
            {
              id: 'preparing',
              label: 'Packing',
              count: orders.filter((o) => o.orderStatus === 'Preparing').length,
            },
            {
              id: 'ready',
              label: 'Ready at Stall',
              count: orders.filter((o) => o.orderStatus === 'Ready').length,
            },
            {
              id: 'completed',
              label: 'Completed',
              count: orders.filter((o) => o.orderStatus === 'Completed').length,
            },
            {
              id: 'returns',
              label: 'Returns',
              count: orders.filter((o) => o.returns?.length || o.orderStatus === 'Returned').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Channel Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, student, phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Channels</option>
            <option value="Store">Store</option>
            <option value="Stall">School Stall</option>
            <option value="Public Link">Public Link</option>
            <option value="Employee">Employee</option>
            <option value="Partner">Partner</option>
          </select>
        </div>
      </div>

      {/* 4. Orders Data Display: Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Student & School</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderForDetail(order)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {order.id}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                        {order.createdAt.substring(0, 16)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 truncate max-w-48">{order.studentName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-48">{order.schoolName}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{order.classId}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {order.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      {businessProfile.currencySymbol}{order.total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[11px] font-bold ${
                          order.paymentStatus === 'Paid'
                            ? 'text-emerald-700'
                            : order.paymentStatus === 'Partial'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.orderStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.orderStatus === 'Ready'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : order.orderStatus === 'Preparing'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : order.orderStatus === 'Returned'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedOrderForReceipt(order)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrderForDetail(order)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Inspect →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Orders Data Display: Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No orders found.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrderForDetail(order)}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900">{order.id}</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{order.studentName}</h4>
                  <p className="text-xs text-slate-500">{order.schoolName} · {order.classId}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.orderStatus === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Total: <strong className="font-mono text-slate-900">{businessProfile.currencySymbol}{order.total}</strong> ({order.paymentStatus})
                </span>
                <span className="text-blue-600 font-semibold">View Details →</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Slide-Over Order Details Drawer */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-fade-in">
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Order #{selectedOrderForDetail.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedOrderForDetail.studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedOrderForDetail.schoolName} — {selectedOrderForDetail.classId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Stepper Progression */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[11px] font-semibold text-slate-600 mb-2">Fulfillment Progression:</p>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                  {(['Confirmed', 'Preparing', 'Ready', 'Completed'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateOrderStatus(selectedOrderForDetail.id, st)}
                      className={`py-1.5 rounded-lg border transition-colors ${
                        selectedOrderForDetail.orderStatus === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items in this Order */}
              <div className="p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Prescribed Kit Items ({selectedOrderForDetail.items.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedOrderForDetail.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.publisherOrCategory} · Qty: {item.quantity} × {businessProfile.currencySymbol}{item.unitPrice}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {businessProfile.currencySymbol}{item.total}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{selectedOrderForDetail.subtotal}</span>
                  </div>
                  {selectedOrderForDetail.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span className="font-mono tabular-nums">-{businessProfile.currencySymbol}{selectedOrderForDetail.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Bill</span>
                    <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{selectedOrderForDetail.total}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Paid to Date</span>
                    <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{selectedOrderForDetail.paidAmount}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Balance Due</span>
                    <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{selectedOrderForDetail.remainingAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-5 border-t border-slate-200 bg-white space-y-2">
              <div className="flex gap-2">
                {selectedOrderForDetail.remainingAmount > 0 && (
                  <button
                    onClick={() => {
                      setCollectAmount(String(selectedOrderForDetail.remainingAmount));
                      setIsCollectPaymentOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Collect {businessProfile.currencySymbol}{selectedOrderForDetail.remainingAmount}</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrderForReceipt(selectedOrderForDetail)}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const initMap: Record<string, number> = {};
                  selectedOrderForDetail.items.forEach((i) => (initMap[i.itemId] = 0));
                  setReturnItemQuantities(initMap);
                  setIsReturnModalOpen(true);
                }}
                className="w-full py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
              >
                Process Student Return / Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal Dialog */}
      {isCollectPaymentOpen && selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Record Parent Payment</h3>
              <button onClick={() => setIsCollectPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount to Collect ({businessProfile.currencySymbol})</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedOrderForDetail.remainingAmount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-base font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="Cash">Cash at Counter</option>
                  <option value="UPI">UPI Digital Transfer</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCollectPaymentOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Confirm Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal Dialog */}
      {isReturnModalOpen && selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Process Item Return & Restock</h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <p className="text-slate-500 text-[11px]">
                Returned items will be automatically restocked into warehouse inventory.
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrderForDetail.items.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-medium truncate max-w-44">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Return qty:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItemQuantities[item.itemId] || 0}
                        onChange={(e) =>
                          setReturnItemQuantities({
                            ...returnItemQuantities,
                            [item.itemId]: Number(e.target.value),
                          })
                        }
                        className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Wrong Book">Wrong Book Prescribed / Purchased</option>
                  <option value="Duplicate">Duplicate Purchase</option>
                  <option value="Damaged">Damaged / Binding Flaw</option>
                  <option value="Student Left">Student Transferred / Section Changed</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
                >
                  Process Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
