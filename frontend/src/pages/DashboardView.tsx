import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  School as SchoolIcon,
  Package,
  CreditCard,
  CheckCircle2,
  Building2,
  ExternalLink,
  Workflow,
  ChevronRight,
  Sparkles,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { BusinessFlowDiagram } from '../components/BusinessFlowDiagram';

export const DashboardView: React.FC = () => {
  const {
    orders,
    books,
    schools,
    publishers,
    businessProfile,
    currentUser,
    setIsNewOrderOpen,
    setActiveTab,
    setSelectedOrderForReceipt,
    setPublicPortalOpen,
  } = useApp();

  const [showFlowDiagram, setShowFlowDiagram] = useState(false);

  // Metrics
  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const totalReceived = orders.reduce((acc, o) => acc + o.paidAmount, 0);
  const totalPendingAmount = orders.reduce((acc, o) => acc + o.remainingAmount, 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'Confirmed' || o.orderStatus === 'Preparing');
  const readyOrders = orders.filter((o) => o.orderStatus === 'Ready');
  const lowStockBooks = books.filter((b) => b.currentStock <= b.minStock);
  const duePublishers = publishers.filter((p) => p.pendingDue > 0);
  const totalPublisherDue = publishers.reduce((acc, p) => acc + p.pendingDue, 0);

  // Realization rate
  const realizationPct = totalSales > 0 ? Math.round((totalReceived / totalSales) * 100) : 0;

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* 1. Hero Welcome & Executive Action Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-7 text-white shadow-md border border-slate-700/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayFormatted}</span>
              <span className="text-slate-500">·</span>
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/20 font-mono text-[11px]">
                {currentUser.role} Mode
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Academic Season Operations Control
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Real-time synchronization across {schools.length} affiliated schools, {books.length} textbook titles, campus stalls, and direct parent portal links.
            </p>
          </div>

          {/* Quick Operations Button Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm card-3d-press"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>+ New Order</span>
            </button>

            <button
              onClick={() => setActiveTab('school-requirement')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-600 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>Requirement Planner</span>
            </button>

            <button
              onClick={() => setShowFlowDiagram(!showFlowDiagram)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-200 bg-blue-900/40 hover:bg-blue-900/60 rounded-xl border border-blue-500/30 transition-colors"
            >
              <Workflow className="w-3.5 h-3.5 text-blue-400" />
              <span>{showFlowDiagram ? 'Hide Flow' : 'App Pipeline'}</span>
            </button>

            <button
              onClick={() => setPublicPortalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-transparent hover:bg-slate-800 rounded-xl transition-colors"
              title="Open Parent Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Parent Portal</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative background gradient accent */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Interactive Operational Architecture Map (Collapsible) */}
      {showFlowDiagram && (
        <div className="animate-fade-in">
          <BusinessFlowDiagram />
        </div>
      )}

      {/* 3. Primary 3D KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Sales & Realization */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Gross Billed Sales</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
                {businessProfile.currencySymbol}{totalSales.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Realization Rate:</span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">
              {realizationPct}% ({businessProfile.currencySymbol}{totalReceived.toLocaleString()})
            </span>
          </div>
        </div>

        {/* KPI 2: Active Packing & Stall Queue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Active Orders In-Flight</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
                {pendingOrders.length + readyOrders.length}
              </span>
              <span className="text-xs text-slate-400 font-normal">active orders</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Ready at Stalls:</span>
            <span className="font-mono font-bold text-blue-700 tabular-nums">
              {readyOrders.length} sets packed
            </span>
          </div>
        </div>

        {/* KPI 3: Customer Receivables Due */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Parent Dues Outstanding</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 tracking-tight tabular-nums">
                {businessProfile.currencySymbol}{totalPendingAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Unsettled Invoices:</span>
            <span className="font-mono font-bold text-amber-800 tabular-nums">
              {orders.filter((o) => o.remainingAmount > 0).length} orders
            </span>
          </div>
        </div>

        {/* KPI 4: Low Stock Deficit & Publisher Dues */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Low Stock Alerts</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 tracking-tight tabular-nums">
                {lowStockBooks.length}
              </span>
              <span className="text-xs text-slate-400 font-normal">titles critical</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Publisher Due:</span>
            <span className="font-mono font-bold text-rose-700 tabular-nums">
              {businessProfile.currencySymbol}{totalPublisherDue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Priority Operations & Channel Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Attention Column (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Priority Operational Tasks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items requiring immediate action by store managers and dispatch staff
                </p>
              </div>
              <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                Action Queue
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Ready Orders Alert */}
              {readyOrders.length > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {readyOrders.length}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {readyOrders.length} Textbook Sets Ready for Stall Pickup
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Packed kits waiting for parent handover at school campus desks.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors shrink-0 ml-3"
                  >
                    <span>View Dispatches</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Low Stock Alert */}
              {lowStockBooks.length > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {lowStockBooks.length}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {lowStockBooks.length} Prescribed Titles Below Safety Stock Threshold
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {lowStockBooks.slice(0, 2).map((b) => b.name).join(', ')}
                        {lowStockBooks.length > 2 && ' and others'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('school-requirement')}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors shrink-0 ml-3"
                  >
                    <span>Generate PO</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Outstanding Parent Due Alert */}
              {totalPendingAmount > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {businessProfile.currencySymbol}{totalPendingAmount.toLocaleString()} Pending in Parent Dues
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Uncollected balance across {orders.filter((o) => o.remainingAmount > 0).length} partial orders.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors shrink-0 ml-3"
                  >
                    <span>Collect Dues</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>All systems nominal</span>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Executive Summary Report →
            </button>
          </div>
        </div>

        {/* Channel Contribution Column (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Sales Channel Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Revenue generated across fulfillment funnels
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              {(['Store', 'Stall', 'Public Link', 'Employee', 'Partner'] as const).map((channel) => {
                const channelOrders = orders.filter((o) => o.source === channel);
                const sales = channelOrders.reduce((acc, o) => acc + o.total, 0);
                const pct = totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0;

                return (
                  <div key={channel} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{channel}</span>
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {businessProfile.currencySymbol}{sales.toLocaleString()}{' '}
                        <span className="text-[11px] font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{orders.length} total orders recorded</span>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Order Ledger →
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Orders & Fast Fulfillment Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Dispatches & Parent Invoices
            </h3>
            <p className="text-xs text-slate-500">
              Live chronological feed of student book bundle orders
            </p>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>View All {orders.length} Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Student & School</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 6).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {order.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{order.studentName}</p>
                    <p className="text-[11px] text-slate-500">{order.schoolName}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{order.classId}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-slate-600 font-medium">{order.source}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.orderStatus === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.orderStatus === 'Ready'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : order.orderStatus === 'Preparing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.orderStatus}
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
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrderForReceipt(order)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Print Tax Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
