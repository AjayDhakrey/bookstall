import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { School, Book, PurchaseOrder } from '../types';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  Building2,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const SchoolRequirementView: React.FC = () => {
  const {
    schools,
    books,
    publishers,
    purchaseOrders,
    createPurchaseOrder,
    receivePurchaseOrderStock,
    payPurchaseOrder,
    businessProfile,
  } = useApp();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const currentSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];
  const [selectedClass, setSelectedClass] = useState<string>(
    currentSchool?.classes[0] || 'Class 5'
  );

  const [expectedCountOverride, setExpectedCountOverride] = useState<number | null>(null);
  const [generatedPoAlert, setGeneratedPoAlert] = useState<string | null>(null);

  // Expected student count
  const baseExpected = currentSchool?.expectedStudentsPerClass?.[selectedClass] || 100;
  const expectedStudents = expectedCountOverride !== null ? expectedCountOverride : baseExpected;

  // Prescribed books for this school & class
  const classBookMappings = currentSchool?.bookMappings.filter((m) => m.classId === selectedClass) || [];
  const requirementRows = classBookMappings
    .map((m) => {
      const book = books.find((b) => b.id === m.bookId);
      if (!book) return null;
      const required = expectedStudents;
      const stock = book.currentStock;
      const shortage = Math.max(0, required - stock);
      const publisher = publishers.find((p) => p.id === book.publisherId);
      return {
        book,
        publisher,
        required,
        stock,
        shortage,
        isMandatory: m.isMandatory,
        estPurchaseCost: shortage * book.purchasePrice,
      };
    })
    .filter(Boolean) as Array<{
      book: Book;
      publisher: any;
      required: number;
      stock: number;
      shortage: number;
      isMandatory: boolean;
      estPurchaseCost: number;
    }>;

  const totalShortageQty = requirementRows.reduce((acc, r) => acc + r.shortage, 0);
  const totalEstCost = requirementRows.reduce((acc, r) => acc + r.estPurchaseCost, 0);

  // Group shortages by publisher to generate POs
  const handleAutoGeneratePOs = async () => {
    if (!currentSchool) return;
    const publisherShortages: Record<
      string,
      Array<{ book: Book; shortage: number; unitCost: number }>
    > = {};

    requirementRows.forEach((r) => {
      if (r.shortage > 0) {
        if (!publisherShortages[r.book.publisherId]) {
          publisherShortages[r.book.publisherId] = [];
        }
        publisherShortages[r.book.publisherId].push({
          book: r.book,
          shortage: r.shortage,
          unitCost: r.book.purchasePrice,
        });
      }
    });

    const generatedIds: string[] = [];

    for (const [pubId, items] of Object.entries(publisherShortages)) {
      const pub = publishers.find((p) => p.id === pubId);
      if (!pub) continue;

      const poItems = items.map((i) => ({
        bookId: i.book.id,
        bookName: i.book.name,
        publisherId: pub.id,
        quantity: i.shortage,
        unitCost: i.unitCost,
        total: i.shortage * i.unitCost,
      }));

      const totalAmount = poItems.reduce((acc, curr) => acc + curr.total, 0);

      const created = await createPurchaseOrder({
        publisherId: pub.id,
        publisherName: pub.name,
        items: poItems,
        totalAmount,
        notes: `Auto-generated requirement for ${currentSchool.name} (${selectedClass})`,
      });

      generatedIds.push(created.id);
    }

    if (generatedIds.length > 0) {
      setGeneratedPoAlert(`Successfully created Purchase Orders: ${generatedIds.join(', ')}`);
      setTimeout(() => setGeneratedPoAlert(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">
          School Requirement & Purchase Order Planner
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Forecast curriculum inventory requirements against enrolled student counts and automate publisher procurement (Section 22 & 23)
        </p>
      </div>

      {generatedPoAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between">
          <span>✓ {generatedPoAlert}</span>
          <button onClick={() => setGeneratedPoAlert(null)}>✕</button>
        </div>
      )}

      {!currentSchool ? (
        <div className="p-8 bg-white rounded-xl border border-neutral-200 text-center">
          <Building2 className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-900">No schools added yet</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Add a school and its prescribed book list in Schools to plan requirements.
          </p>
        </div>
      ) : (
      <>
      {/* Selector Controls */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Target School *
          </label>
          <select
            value={selectedSchoolId}
            onChange={(e) => {
              setSelectedSchoolId(e.target.value);
              setExpectedCountOverride(null);
            }}
            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Grade / Class *
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setExpectedCountOverride(null);
            }}
            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
          >
            {currentSchool?.classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Expected Student Count
          </label>
          <input
            type="number"
            min="1"
            value={expectedStudents}
            onChange={(e) => setExpectedCountOverride(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg font-mono font-bold"
          />
        </div>
      </div>

      {/* Comparison Matrix (Section 22 Prototype) */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-neutral-200 gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              {currentSchool.name} — {selectedClass} Book Inventory Analysis
            </h3>
            <p className="text-xs text-neutral-500">
              Comparing curriculum needs ({expectedStudents} students) against current warehouse stock
            </p>
          </div>

          {totalShortageQty > 0 ? (
            <button
              onClick={handleAutoGeneratePOs}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Generate POs for Shortage ({totalShortageQty} books)</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              ✓ Sufficient Stock in Warehouse
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Prescribed Book</th>
                <th className="py-3 px-4 font-semibold">Publisher</th>
                <th className="py-3 px-4 font-semibold text-center">Required Qty</th>
                <th className="py-3 px-4 font-semibold text-center">In Stock</th>
                <th className="py-3 px-4 font-semibold text-center">Shortage</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Dealer Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Purchase Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {requirementRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    No textbooks prescribed for {selectedClass}. Go to Schools → School Book List to configure.
                  </td>
                </tr>
              ) : (
                requirementRows.map((row) => (
                  <tr key={row.book.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-neutral-900">{row.book.name}</p>
                      <p className="text-[11px] text-neutral-500">{row.book.subject} · {row.book.applicableClass}</p>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{row.book.publisherName}</td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-neutral-900">
                      {row.required}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-neutral-700">
                      {row.stock}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.shortage > 0 ? (
                        <span className="font-mono tabular-nums font-bold text-rose-600">
                          {row.shortage} units
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums text-emerald-700 font-medium">
                          0 (Covered)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600">
                      {businessProfile.currencySymbol}{row.book.purchasePrice}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                      {row.estPurchaseCost > 0
                        ? `${businessProfile.currencySymbol}${row.estPurchaseCost.toLocaleString()}`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-neutral-500">Total Purchase Outlay Needed:</span>
            <span className="font-mono font-bold text-base text-neutral-900 ml-2">
              {businessProfile.currencySymbol}{totalEstCost.toLocaleString()}
            </span>
          </div>
          <p className="text-neutral-500">
            {totalShortageQty > 0
              ? `Need to order ${totalShortageQty} copies across publishers.`
              : 'All students can be serviced with current stock.'}
          </p>
        </div>
      </div>

      </>
      )}

      {/* Active Purchase Orders List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-sm font-bold text-neutral-900">Publisher Purchase Orders Log</h3>
          <p className="text-xs text-neutral-500">Active and received purchase consignments</p>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {purchaseOrders.map((po) => (
            <div key={po.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-900">{po.id}</span>
                  <span className="text-neutral-400">·</span>
                  <span className="font-semibold text-neutral-800">{po.publisherName}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    po.status === 'Received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {po.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Ordered on {po.date} · Items: {po.items.map((i) => `${i.bookName} (${i.quantity})`).join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">Total</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900">
                    {businessProfile.currencySymbol}{po.totalAmount.toLocaleString()}
                  </span>
                </div>
                {po.status === 'Ordered' && (
                  <button
                    onClick={() => receivePurchaseOrderStock(po.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    Receive Stock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
