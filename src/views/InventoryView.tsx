import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Book, Stationery, PurchaseOrder } from '../types';
import {
  Package,
  AlertTriangle,
  History,
  ArrowDownUp,
  Plus,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    books,
    stationery,
    stockMovements,
    purchaseOrders,
    adjustStock,
    receivePurchaseOrderStock,
    businessProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'stock' | 'low-stock' | 'movements' | 'receiving'>('stock');
  const [filterType, setFilterType] = useState<'All' | 'Books' | 'Stationery'>('All');
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjItemType, setAdjItemType] = useState<'book' | 'stationery'>('book');
  const [adjItemId, setAdjItemId] = useState('');
  const [adjChangeType, setAdjChangeType] = useState<'Adjustment In' | 'Adjustment Out' | 'Damage'>('Damage');
  const [adjQty, setAdjQty] = useState(1);
  const [adjNotes, setAdjNotes] = useState('');

  const lowStockBooks = books.filter((b) => b.currentStock <= b.minStock);
  const lowStockStationery = stationery.filter((s) => s.currentStock <= s.minStock);
  const totalLowStock = lowStockBooks.length + lowStockStationery.length;

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItemId || adjQty <= 0) return;

    const change = adjChangeType === 'Adjustment In' ? adjQty : -adjQty;
    adjustStock(adjItemType, adjItemId, change, adjChangeType, adjNotes);
    setIsAdjustModalOpen(false);
    setAdjItemId('');
    setAdjQty(1);
    setAdjNotes('');
  };

  // Filtered Stock List
  const stockList = [
    ...(filterType === 'All' || filterType === 'Books'
      ? books.map((b) => ({
          id: b.id,
          name: b.name,
          category: `Book (${b.subject})`,
          publisherOrCat: b.publisherName,
          spec: b.applicableClass,
          cost: b.purchasePrice,
          price: b.sellingPrice,
          currentStock: b.currentStock,
          minStock: b.minStock,
          itemType: 'book' as const,
        }))
      : []),
    ...(filterType === 'All' || filterType === 'Stationery'
      ? stationery.map((s) => ({
          id: s.id,
          name: s.name,
          category: `Stationery (${s.category})`,
          publisherOrCat: s.category,
          spec: s.unit,
          cost: s.purchasePrice,
          price: s.sellingPrice,
          currentStock: s.currentStock,
          minStock: s.minStock,
          itemType: 'stationery' as const,
        }))
      : []),
  ].filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Inventory & Stock Movement</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Single-source inventory reconciliation across all store dispatches, stall sales, and returns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors shadow-xs"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span>Stock Adjustment / Damage</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'stock'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Current Stock ({books.length + stationery.length})
          </button>
          <button
            onClick={() => setActiveTab('low-stock')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'low-stock'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Low Stock Alerts</span>
            {totalLowStock > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-rose-100 text-rose-700 font-bold rounded">
                {totalLowStock}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('receiving')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'receiving'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Purchase Receiving ({purchaseOrders.filter((p) => p.status === 'Ordered').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'movements'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Audit Log</span>
          </button>
        </div>

        {activeTab === 'stock' && (
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50"
            >
              <option value="All">All Categories</option>
              <option value="Books">Books Only</option>
              <option value="Stationery">Stationery Only</option>
            </select>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stock..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: Current Stock */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">SKU / Item</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Publisher / Spec</th>
                  <th className="py-3 px-4 font-semibold text-right">Cost</th>
                  <th className="py-3 px-4 font-semibold text-right">MRP</th>
                  <th className="py-3 px-4 font-semibold text-center">Available Stock</th>
                  <th className="py-3 px-4 font-semibold text-center">Reorder Level</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stockList.map((item) => {
                  const isLow = item.currentStock <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] text-neutral-400 block">{item.id}</span>
                        <span className="font-semibold text-neutral-900">{item.name}</span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{item.category}</td>
                      <td className="py-3 px-4 text-neutral-500">{item.publisherOrCat} {item.spec && `· ${item.spec}`}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600">
                        {businessProfile.currencySymbol}{item.cost}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {businessProfile.currencySymbol}{item.price}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono tabular-nums font-bold text-sm ${isLow ? 'text-rose-600' : 'text-neutral-900'}`}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-neutral-500">
                        {item.minStock}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdjItemType(item.itemType);
                            setAdjItemId(item.id);
                            setIsAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Low Stock Critical Alerts */}
      {activeTab === 'low-stock' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-rose-950">Immediate Procurement Required</h4>
                <p className="text-xs text-rose-700">
                  {totalLowStock} items have fallen below safety inventory. Generate publisher purchase orders to prevent stock-outs during school peak ordering.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Item Name</th>
                  <th className="py-3 px-4 font-semibold">Publisher / Category</th>
                  <th className="py-3 px-4 font-semibold text-center">Current Stock</th>
                  <th className="py-3 px-4 font-semibold text-center">Minimum Safety</th>
                  <th className="py-3 px-4 font-semibold text-center">Deficit</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {lowStockBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-neutral-400 block">{b.id}</span>
                      <span className="font-semibold text-neutral-900">{b.name}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{b.publisherName} ({b.applicableClass})</td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-rose-600">
                      {b.currentStock}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-neutral-600">
                      {b.minStock}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-rose-700">
                      -{b.minStock - b.currentStock}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setAdjItemType('book');
                          setAdjItemId(b.id);
                          setAdjChangeType('Adjustment In');
                          setIsAdjustModalOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-semibold text-white bg-neutral-900 rounded-md hover:bg-neutral-800"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Purchase Receiving (Section 10 & 23) */}
      {activeTab === 'receiving' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
            <h4 className="text-sm font-bold text-blue-950">Publisher Consignments Receiving</h4>
            <p className="text-xs text-blue-800 mt-0.5">
              When cargo arrives from NCERT, Oxford, or S. Chand, mark the purchase order as "Received" to automatically update book stock and log audit movements.
            </p>
          </div>

          <div className="space-y-3">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900 text-sm">{po.id}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="font-semibold text-neutral-800">{po.publisherName}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        po.status === 'Received'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {po.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Date: {po.date} · Items: {po.items.length} titles ({po.items.map((i) => `${i.bookName} x${i.quantity}`).join(', ')})
                  </p>
                  {po.stockReceivedAt && (
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      ✓ Consignment verified and added to warehouse on {po.stockReceivedAt}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block">Total PO Amount</span>
                    <span className="font-mono tabular-nums font-bold text-neutral-900 text-sm">
                      {businessProfile.currencySymbol}{po.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {po.status === 'Ordered' ? (
                    <button
                      onClick={() => receivePurchaseOrderStock(po.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Receive Stock Consignment</span>
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500 font-medium bg-neutral-100 px-3 py-1.5 rounded-lg">
                      Stock Ingested
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Stock Movement Audit Log */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Movement Type</th>
                  <th className="py-3 px-4 font-semibold">Item Affected</th>
                  <th className="py-3 px-4 font-semibold text-center">Change</th>
                  <th className="py-3 px-4 font-semibold text-center">New Balance</th>
                  <th className="py-3 px-4 font-semibold">Reference & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-neutral-600 text-[11px]">
                      {mov.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-900">{mov.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-900">{mov.itemName}</span>
                      <span className="text-[10px] text-neutral-400 block font-mono">{mov.itemId}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold">
                      <span className={mov.change > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {mov.change > 0 ? `+${mov.change}` : mov.change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-neutral-900">
                      {mov.newStock}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 text-[11px]">
                      {mov.referenceId && (
                        <span className="font-mono font-medium text-neutral-800 mr-1.5">
                          [{mov.referenceId}]
                        </span>
                      )}
                      <span>{mov.notes}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Stock Adjustment / Damage Entry</h3>
              <button onClick={() => setIsAdjustModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjustStockSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Item Category</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjItemType('book');
                      setAdjItemId('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium ${
                      adjItemType === 'book' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700'
                    }`}
                  >
                    Textbook
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjItemType('stationery');
                      setAdjItemId('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium ${
                      adjItemType === 'stationery' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700'
                    }`}
                  >
                    Stationery
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Select Item *</label>
                <select
                  value={adjItemId}
                  onChange={(e) => setAdjItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="">-- Choose Item --</option>
                  {adjItemType === 'book'
                    ? books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (Stock: {b.currentStock})
                        </option>
                      ))
                    : stationery.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Stock: {s.currentStock})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjChangeType}
                    onChange={(e) => setAdjChangeType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Damage">Damage (- Stock)</option>
                    <option value="Adjustment In">Adjustment In (+ Stock)</option>
                    <option value="Adjustment Out">Adjustment Out (- Stock)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjQty}
                    onChange={(e) => setAdjQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spine damaged in transit or shelf stock recount"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
