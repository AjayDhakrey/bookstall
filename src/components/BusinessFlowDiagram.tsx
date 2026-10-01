import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Package,
  School,
  Store,
  Globe,
  ShoppingCart,
  CheckCircle2,
  BarChart3,
  ArrowDown,
  ArrowRight,
  CreditCard,
  Layers,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface BusinessFlowDiagramProps {
  compact?: boolean;
}

export const BusinessFlowDiagram: React.FC<BusinessFlowDiagramProps> = ({ compact = false }) => {
  const {
    publishers,
    books,
    stationery,
    schools,
    orders,
    setActiveTab,
    setPublicPortalOpen,
    businessProfile,
  } = useApp();

  const totalStockCount =
    books.reduce((acc, b) => acc + b.currentStock, 0) +
    stationery.reduce((acc, s) => acc + s.currentStock, 0);

  const completedOrders = orders.filter((o) => o.orderStatus === 'Completed');
  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
              Interactive Blueprint
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Single Source of Truth System</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1 tracking-tight">
            End-to-End Dealership Pipeline
          </h3>
        </div>
        <p className="text-xs text-slate-500 max-w-sm text-left sm:text-right">
          Click any block to instantly navigate to that operational workspace
        </p>
      </div>

      {/* Visual Pipeline Layout */}
      <div className="mt-6 space-y-4">
        {/* LEVEL 1: PUBLISHERS */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setActiveTab('products')}
            className="w-full max-w-md p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-400 transition-all text-left group shadow-xs card-lift"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    1. PUBLISHERS & VENDORS
                  </p>
                  <p className="text-[11px] text-slate-500">
                    NCERT, Oxford, S. Chand, Pearson ({publishers.length} active houses)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs tabular-nums">
                {publishers.filter((p) => p.pendingDue > 0).length} Unsettled
              </span>
            </div>
          </button>

          {/* Connector Down with Purchase Flow */}
          <div className="flex flex-col items-center my-1 text-slate-400">
            <div className="h-3 w-px bg-slate-300" />
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
              Purchase Textbooks & Stationery ↓
            </span>
            <div className="h-3 w-px bg-slate-300" />
          </div>
        </div>

        {/* LEVEL 2: CENTRAL INVENTORY */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setActiveTab('inventory')}
            className="w-full max-w-md p-4 rounded-2xl border border-slate-800 bg-slate-900 text-white hover:bg-slate-800 transition-all text-left group shadow-sm card-lift"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white tracking-tight">
                    2. CENTRAL INVENTORY REPOSITORY
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Single Source of Truth · Available:{' '}
                    <span className="font-mono tabular-nums font-bold text-blue-300">
                      {totalStockCount.toLocaleString()} units
                    </span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {books.length} Titles
              </span>
            </div>
          </button>

          {/* 3-Way Branch Connector */}
          <div className="w-full max-w-2xl flex flex-col items-center my-2 text-slate-400">
            <div className="h-3 w-px bg-slate-300" />
            <div className="w-full border-t border-slate-300 relative">
              <div className="absolute left-0 top-0 h-3 w-px bg-slate-300" />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 h-3 w-px bg-slate-300" />
              <div className="absolute right-0 top-0 h-3 w-px bg-slate-300" />
            </div>
          </div>
        </div>

        {/* LEVEL 3: THE 3 INBOUND CHANNELS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-3xl mx-auto pt-1">
          {/* Channel A: School Needs -> School Catalogue */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3 card-lift">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <School className="w-4 h-4 text-blue-600 shrink-0" />
                <span>School Needs & Syllabi</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Expected enrollments mapped directly to prescribed syllabi.
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                onClick={() => setActiveTab('school-requirement')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Requirement Planner →
              </button>
              <button
                onClick={() => setActiveTab('schools')}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                Catalogues ({schools.length})
              </button>
            </div>
          </div>

          {/* Channel B: Store / Stall Counters */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3 card-lift">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Store / Campus Stalls</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Direct in-person counter POS sales with instant stock deduction.
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-emerald-700 font-medium">POS Terminal</span>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Counter POS →
              </button>
            </div>
          </div>

          {/* Channel C: Public Link -> Customer Online Orders */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3 card-lift">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Parent Public Links</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Direct school URLs for parents; zero login required.
              </p>
            </div>
            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
              <button
                onClick={() => setActiveTab('public-links')}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                Manage Links
              </button>
              <button
                onClick={() => setPublicPortalOpen(true)}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900"
              >
                Launch Portal →
              </button>
            </div>
          </div>
        </div>

        {/* 3 Converge into ORDERS */}
        <div className="flex flex-col items-center my-1 text-slate-400">
          <div className="w-full max-w-2xl relative">
            <div className="border-t border-slate-300">
              <div className="absolute left-0 -top-3 h-3 w-px bg-slate-300" />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 h-4 w-px bg-slate-300" />
              <div className="absolute right-0 -top-3 h-3 w-px bg-slate-300" />
            </div>
          </div>
          <div className="h-2 w-px bg-slate-300" />
        </div>

        {/* LEVEL 4: THE UNIFIED ORDER ENGINE (Products, Payments, Status) */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xl p-5 rounded-2xl border-2 border-slate-900 bg-white shadow-md space-y-3.5 card-lift">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  <ShoppingCart className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                    4. UNIFIED ORDERS REPOSITORY
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    All sales funnels converge into a single transaction engine ({orders.length} total orders)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Open Ledger →
              </button>
            </div>

            {/* The 3 Pillars of an Order */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Layers className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                <p className="font-bold text-slate-900 text-[11px]">PRODUCTS</p>
                <p className="text-[10px] text-slate-500">Books & Stationery</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <CreditCard className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                <p className="font-bold text-slate-900 text-[11px]">PAYMENTS</p>
                <p className="text-[10px] text-slate-500">Full / Partial / Due</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Clock className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <p className="font-bold text-slate-900 text-[11px]">STATUS</p>
                <p className="text-[10px] text-slate-500">Prep / Ready / Handover</p>
              </div>
            </div>
          </div>

          {/* Connector Down */}
          <div className="h-4 w-px bg-slate-300" />
        </div>

        {/* LEVEL 5: COMPLETED DISPATCHES */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between shadow-xs card-lift">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  5. COMPLETED & DELIVERED
                </p>
                <p className="text-[11px] text-slate-600">
                  Verified receipt, student handover, returns restocked
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs tabular-nums">
              {completedOrders.length} Fulfilled
            </span>
          </div>

          {/* Connector Down */}
          <div className="h-4 w-px bg-slate-300" />
        </div>

        {/* LEVEL 6: REPORTS & VALUATION */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setActiveTab('reports')}
            className="w-full max-w-md p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 transition-all text-left group shadow-xs card-lift"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    6. REPORTS & VALUATION
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bestseller rankings, school outstanding balances, warehouse valuation
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 tabular-nums">
                {businessProfile.currencySymbol}{totalSales.toLocaleString()}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
