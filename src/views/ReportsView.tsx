import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  School,
  BookOpen,
  Package,
  CreditCard,
  Users,
  Download,
  Printer,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    orders,
    schools,
    books,
    publishers,
    staff,
    businessProfile,
  } = useApp();

  const [reportType, setReportType] = useState<
    'sales' | 'school-wise' | 'product-wise' | 'inventory' | 'staff-performance'
  >('sales');

  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const totalReceived = orders.reduce((acc, o) => acc + o.paidAmount, 0);
  const totalPending = orders.reduce((acc, o) => acc + o.remainingAmount, 0);

  // School-wise breakdown
  const schoolPerformance = schools.map((school) => {
    const schoolOrders = orders.filter((o) => o.schoolId === school.id);
    const sales = schoolOrders.reduce((acc, o) => acc + o.total, 0);
    const paid = schoolOrders.reduce((acc, o) => acc + o.paidAmount, 0);
    const due = schoolOrders.reduce((acc, o) => acc + o.remainingAmount, 0);
    return {
      school,
      orderCount: schoolOrders.length,
      sales,
      paid,
      due,
    };
  }).sort((a, b) => b.sales - a.sales);

  // Book-wise bestseller sales
  const bookSalesMap: Record<string, { book: any; unitsSold: number; revenue: number }> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (item.type === 'book') {
        if (!bookSalesMap[item.itemId]) {
          const b = books.find((x) => x.id === item.itemId);
          bookSalesMap[item.itemId] = {
            book: b || { name: item.name, publisherName: item.publisherOrCategory, applicableClass: item.classOrSpec },
            unitsSold: 0,
            revenue: 0,
          };
        }
        bookSalesMap[item.itemId].unitsSold += item.quantity;
        bookSalesMap[item.itemId].revenue += item.total;
      }
    });
  });

  const bestSellingBooks = Object.values(bookSalesMap).sort((a, b) => b.unitsSold - a.unitsSold);

  // Total inventory valuation
  const inventoryAssetValue = books.reduce((acc, b) => acc + b.currentStock * b.purchasePrice, 0);
  const inventoryRetailValue = books.reduce((acc, b) => acc + b.currentStock * b.sellingPrice, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Business Intelligence & Reports
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time performance analytics across schools, book titles, sales channels, and staff (Section 26)
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Summary</span>
        </button>
      </div>

      {/* Report Segmented Tabs */}
      <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 overflow-x-auto text-xs font-medium">
        {[
          { id: 'sales', label: 'Sales & Revenue Overview', icon: TrendingUp },
          { id: 'school-wise', label: 'School-wise Breakdown', icon: School },
          { id: 'product-wise', label: 'Book-wise Bestsellers', icon: BookOpen },
          { id: 'inventory', label: 'Inventory Valuation', icon: Package },
          { id: 'staff-performance', label: 'Partner / Staff Performance', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                reportType === tab.id
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT 1: Sales Overview */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <span className="text-xs text-neutral-500 font-medium">Gross Billed Sales</span>
              <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
                {businessProfile.currencySymbol}{totalSales.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">{orders.length} total orders recorded</p>
            </div>
            <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <span className="text-xs text-neutral-500 font-medium">Cash / Online Inflow</span>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {businessProfile.currencySymbol}{totalReceived.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {Math.round((totalReceived / (totalSales || 1)) * 100)}% realization rate
              </p>
            </div>
            <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <span className="text-xs text-neutral-500 font-medium">Outstanding Customer Receivables</span>
              <p className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                {businessProfile.currencySymbol}{totalPending.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Due on delivery / stall pickup</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-4">Channel Contribution Matrix</h3>
            <div className="space-y-4">
              {(['Public Link', 'Store', 'Stall', 'Employee', 'Partner'] as const).map((channel) => {
                const channelOrders = orders.filter((o) => o.source === channel);
                const sales = channelOrders.reduce((acc, o) => acc + o.total, 0);
                const pct = totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0;
                return (
                  <div key={channel} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-800">{channel}</span>
                      <span className="font-mono tabular-nums text-neutral-900 font-bold">
                        {businessProfile.currencySymbol}{sales.toLocaleString()} ({pct}% of total)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: School-wise Breakdown */}
      {reportType === 'school-wise' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900">School Sales & Outstanding Ledger</h3>
            <p className="text-xs text-neutral-500">Revenue generated and unpaid parent balances by school</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">School Name</th>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold text-center">Orders</th>
                  <th className="py-3 px-4 font-semibold text-right">Gross Sales</th>
                  <th className="py-3 px-4 font-semibold text-right">Collected</th>
                  <th className="py-3 px-4 font-semibold text-right">Pending Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {schoolPerformance.map(({ school, orderCount, sales, paid, due }) => (
                  <tr key={school.id} className="hover:bg-neutral-50/80">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-neutral-900">{school.name}</p>
                      <p className="text-[11px] text-neutral-500">{school.city}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-800">{school.code}</td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums font-medium">{orderCount}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                      {businessProfile.currencySymbol}{sales.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700">
                      {businessProfile.currencySymbol}{paid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-amber-700">
                      {businessProfile.currencySymbol}{due.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: Product-wise Bestsellers */}
      {reportType === 'product-wise' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900">Top Prescribed Textbook Titles</h3>
            <p className="text-xs text-neutral-500">Volume and revenue by individual book title</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Rank & Title</th>
                  <th className="py-3 px-4 font-semibold">Publisher</th>
                  <th className="py-3 px-4 font-semibold">Class</th>
                  <th className="py-3 px-4 font-semibold text-center">Units Sold</th>
                  <th className="py-3 px-4 font-semibold text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {bestSellingBooks.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-400 font-bold text-[11px] w-5">#{idx + 1}</span>
                        <span className="font-semibold text-neutral-900">{item.book.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600">{item.book.publisherName}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-700">{item.book.applicableClass}</td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-neutral-900">
                      {item.unitsSold} copies
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                      {businessProfile.currencySymbol}{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: Inventory Valuation */}
      {reportType === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <span className="text-xs text-neutral-500 font-medium">Warehouse Inventory (At Dealer Cost)</span>
              <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
                {businessProfile.currencySymbol}{inventoryAssetValue.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Total invested capital currently in stock</p>
            </div>
            <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <span className="text-xs text-neutral-500 font-medium">Projected Retail Value (At MRP)</span>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {businessProfile.currencySymbol}{inventoryRetailValue.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Potential gross margin: {businessProfile.currencySymbol}{(inventoryRetailValue - inventoryAssetValue).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 5: Staff Performance */}
      {reportType === 'staff-performance' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900">Team & Partner Productivity</h3>
            <p className="text-xs text-neutral-500">Order count and volume fulfilled by personnel</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Staff / Partner</th>
                  <th className="py-3 px-4 font-semibold">Role & Affiliation</th>
                  <th className="py-3 px-4 font-semibold">Assigned Schools</th>
                  <th className="py-3 px-4 font-semibold text-center">Orders Handled</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Sales Fulfilled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50/80">
                    <td className="py-3.5 px-4 font-semibold text-neutral-900">{member.name}</td>
                    <td className="py-3.5 px-4 text-neutral-600">{member.type} ({member.role})</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      {member.assignedSchoolCodes.join(', ') || 'All Dealers'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-neutral-900">
                      {member.ordersCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                      {businessProfile.currencySymbol}{(member.totalSales || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
