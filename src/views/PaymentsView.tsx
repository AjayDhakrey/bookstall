import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, Publisher, PaymentMethod } from '../types';
import {
  CreditCard,
  TrendingUp,
  Clock,
  Building2,
  Search,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const {
    orders,
    publishers,
    collectOrderPayment,
    recordPublisherPayment,
    businessProfile,
    setSelectedOrderForReceipt,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending-customer' | 'received' | 'publisher-dues'>('pending-customer');
  const [search, setSearch] = useState('');

  // Collect Payment Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('Cash');
  const [collectNote, setCollectNote] = useState('');

  // Pay Publisher Modal
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  const [pubPayAmount, setPubPayAmount] = useState('');
  const [pubPayNote, setPubPayNote] = useState('');

  // Financial calculations
  const totalReceivedFromCustomers = orders.reduce((acc, o) => acc + o.paidAmount, 0);
  const totalPendingFromCustomers = orders.reduce((acc, o) => acc + o.remainingAmount, 0);
  const totalPublisherDue = publishers.reduce((acc, p) => acc + p.pendingDue, 0);

  // Flattened customer payment receipts
  const allCustomerPayments = orders.flatMap((o) =>
    o.payments.map((p) => ({
      ...p,
      orderId: o.id,
      studentName: o.studentName,
      schoolName: o.schoolName,
      orderTotal: o.total,
    }))
  ).sort((a, b) => (a.date < b.date ? 1 : -1));

  // Orders with remaining balances
  const pendingOrders = orders.filter((o) => o.remainingAmount > 0);

  // Handlers
  const handleConfirmCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !collectAmount) return;
    const amount = Number(collectAmount);
    if (amount <= 0) return;

    collectOrderPayment(selectedOrder.id, amount, collectMethod, collectNote);
    setSelectedOrder(null);
    setCollectAmount('');
    setCollectNote('');
  };

  const handleConfirmPublisherPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublisher || !pubPayAmount) return;
    const amount = Number(pubPayAmount);
    if (amount <= 0) return;

    recordPublisherPayment(selectedPublisher.id, amount, pubPayNote);
    setSelectedPublisher(null);
    setPubPayAmount('');
    setPubPayNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">Financials & Payments Ledger</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Track customer payments, school stall cash flows, and publisher accounts payable
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Customer Payments Received</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {businessProfile.currencySymbol}{totalReceivedFromCustomers.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Across {allCustomerPayments.length} transactions
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Pending Customer Dues</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {businessProfile.currencySymbol}{totalPendingFromCustomers.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-500">
            {pendingOrders.length} orders awaiting balance settlement
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Publisher Payables Due</span>
            <Building2 className="w-4 h-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-rose-600 tabular-nums">
            {businessProfile.currencySymbol}{totalPublisherDue.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Owed to {publishers.filter((p) => p.pendingDue > 0).length} publishing houses
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 overflow-x-auto w-fit text-xs">
        <button
          onClick={() => setActiveTab('pending-customer')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'pending-customer'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Pending Customer Dues ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'received'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Payment Receipts Log ({allCustomerPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('publisher-dues')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'publisher-dues'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Publisher Payables ({publishers.filter((p) => p.pendingDue > 0).length})
        </button>
      </div>

      {/* TAB 1: Pending Customer Dues */}
      {activeTab === 'pending-customer' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Student & Contact</th>
                  <th className="py-3 px-4 font-semibold">School & Grade</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Billed</th>
                  <th className="py-3 px-4 font-semibold text-right">Already Paid</th>
                  <th className="py-3 px-4 font-semibold text-right">Remaining Due</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      No pending customer dues! All orders are fully settled.
                    </td>
                  </tr>
                ) : (
                  pendingOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">{o.id}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-neutral-900">{o.studentName}</p>
                        <p className="text-[11px] text-neutral-500 font-mono">{o.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-700">
                        {o.schoolName} ({o.classId})
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-800">
                        {businessProfile.currencySymbol}{o.total}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700">
                        {businessProfile.currencySymbol}{o.paidAmount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-amber-700">
                        {businessProfile.currencySymbol}{o.remainingAmount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setCollectAmount(String(o.remainingAmount));
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          Collect Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Payment Receipts Log */}
      {activeTab === 'received' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Receipt / Date</th>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Payment Method</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount Received</th>
                  <th className="py-3 px-4 font-semibold">Collected By / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {allCustomerPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] text-neutral-400 block">{p.id}</span>
                      <span className="text-neutral-700">{p.date}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">{p.orderId}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-neutral-900">{p.studentName}</span>
                      <span className="text-[11px] text-neutral-400 block">{p.schoolName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-neutral-700">{p.method}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                      {businessProfile.currencySymbol}{p.amount}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">
                      <span>{p.collectedBy || 'Store POS'}</span>
                      {p.note && <span className="block text-[11px] text-neutral-400">{p.note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Publisher Payables */}
      {activeTab === 'publisher-dues' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Publisher</th>
                  <th className="py-3 px-4 font-semibold">Credit Terms</th>
                  <th className="py-3 px-4 font-semibold text-right">Lifetime Purchases</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Paid</th>
                  <th className="py-3 px-4 font-semibold text-right">Outstanding Due</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {publishers.map((pub) => (
                  <tr key={pub.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-neutral-900">{pub.name}</p>
                      <p className="text-[11px] text-neutral-500">{pub.contactPerson} · {pub.phone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600">{pub.paymentTerms}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-800">
                      {businessProfile.currencySymbol}{pub.totalPurchased.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700">
                      {businessProfile.currencySymbol}{pub.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-rose-600">
                      {businessProfile.currencySymbol}{pub.pendingDue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {pub.pendingDue > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedPublisher(pub);
                            setPubPayAmount(String(pub.pendingDue));
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                        >
                          Pay Publisher
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Record Customer Payment</h3>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <form onSubmit={handleConfirmCollect} className="p-6 space-y-3.5">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p>Order: <strong className="font-mono text-neutral-900">{selectedOrder.id}</strong></p>
                <p>Customer: <strong className="text-neutral-900">{selectedOrder.studentName}</strong></p>
                <p>Pending Due: <strong className="text-amber-700 font-mono font-bold">{businessProfile.currencySymbol}{selectedOrder.remainingAmount}</strong></p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Amount Received ({businessProfile.currencySymbol}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedOrder.remainingAmount}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Card">Card POS</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Note</label>
                <input
                  type="text"
                  placeholder="e.g. Counter cash receipt"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Publisher Modal */}
      {selectedPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Record Publisher Payment</h3>
              <button onClick={() => setSelectedPublisher(null)}>✕</button>
            </div>
            <form onSubmit={handleConfirmPublisherPayment} className="p-6 space-y-3.5">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p>Publisher: <strong className="text-neutral-900">{selectedPublisher.name}</strong></p>
                <p>Pending Due: <strong className="text-rose-600 font-mono font-bold">{businessProfile.currencySymbol}{selectedPublisher.pendingDue.toLocaleString()}</strong></p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Payment Amount ({businessProfile.currencySymbol}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedPublisher.pendingDue}
                  required
                  value={pubPayAmount}
                  onChange={(e) => setPubPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Payment Mode / Reference Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. RTGS ref #298371 / Cheque #88192"
                  value={pubPayNote}
                  onChange={(e) => setPubPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSelectedPublisher(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
