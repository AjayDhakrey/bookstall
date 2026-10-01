import React, { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export const PrintReceiptModal: React.FC = () => {
  const { selectedOrderForReceipt, setSelectedOrderForReceipt, businessProfile } = useApp();

  const handleClose = useCallback(() => {
    setSelectedOrderForReceipt(null);
  }, [setSelectedOrderForReceipt]);

  // Enable closing receipt screen when user presses Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (selectedOrderForReceipt) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOrderForReceipt, handleClose]);

  if (!selectedOrderForReceipt) return null;

  const order = selectedOrderForReceipt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Order Receipt"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 cursor-default animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions - Hidden during print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div>
            <h3 className="text-base font-bold text-slate-900">Order Tax Invoice & Receipt</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Invoice #{order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs card-3d-press"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handleClose}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200/80 hover:bg-slate-200 rounded-xl transition-colors"
              title="Close Receipt (Esc)"
              aria-label="Close receipt"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500">
                Esc
              </kbd>
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-8 text-slate-800 text-sm">
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">{businessProfile.businessName}</h1>
            <p className="text-xs text-slate-600 mt-0.5">{businessProfile.tagline}</p>
            <p className="text-xs text-slate-500 mt-1">{businessProfile.address}</p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-500 mt-1">
              <span>Ph: {businessProfile.phone}</span>
              <span>·</span>
              <span>GSTIN: {businessProfile.gstin}</span>
              <span>·</span>
              <span>Lic: {businessProfile.dealerLicenseNo}</span>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Billed To (Student / Parent)</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.studentName}</p>
              {order.parentName && <p className="text-slate-600">Guardian: {order.parentName}</p>}
              <p className="text-slate-600 font-mono">Phone: {order.phone}</p>
              {order.address && <p className="text-slate-600 truncate">{order.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Order Information</p>
              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{order.id}</p>
              <p className="text-slate-600">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-slate-600">Channel: <strong>{order.source}</strong></p>
            </div>
          </div>

          {/* School & Grade Banner */}
          <div className="py-2.5 px-3.5 my-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 font-medium">Affiliated School:</span>{' '}
              <strong className="text-slate-900">{order.schoolName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Grade / Curriculum:</span>{' '}
              <strong className="text-blue-700 font-mono">{order.classId}</strong>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse text-xs my-4">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 uppercase text-[10px] font-semibold">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Type</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.publisherOrCategory}</p>
                  </td>
                  <td className="py-2.5 text-center capitalize text-slate-600 text-[11px]">{item.type}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{businessProfile.currencySymbol}{item.unitPrice}</td>
                  <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {businessProfile.currencySymbol}{item.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Calculation Totals */}
          <div className="border-t border-slate-200 pt-3 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({order.items.length} items):</span>
                <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Special Discount:</span>
                  <span className="font-mono tabular-nums">-{businessProfile.currencySymbol}{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-950 pt-2 border-t border-slate-300">
                <span>Net Total Payable:</span>
                <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{order.total}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-1">
                <span>Total Amount Paid:</span>
                <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{order.paidAmount}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Outstanding Due:</span>
                <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{order.remainingAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Payment Records</h4>
            {order.payments && order.payments.length > 0 ? (
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-[11px] text-slate-600">
                    <span>{p.date} · {p.method} ({p.collectedBy || 'Staff'})</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {businessProfile.currencySymbol}{p.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-rose-600 italic">No payments recorded yet. Payment due on pickup.</p>
            )}
          </div>

          {/* Terms & Footer Note */}
          <div className="pt-6 text-center text-xs text-slate-500">
            <p className="italic">{businessProfile.receiptFooter}</p>
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>Generated by {order.createdBy}</span>
              <span>Authorized Signature: __________________</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs print:hidden">
          <span className="text-slate-500">
            Order Fulfillment Mode: <strong className="text-slate-800">{order.pickupOrDelivery}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
            >
              Print Invoice
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors card-3d-press"
            >
              Done / Close Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
