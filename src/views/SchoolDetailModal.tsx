import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { School, Book, Stationery, SchoolBookMapping, SchoolStationeryMapping } from '../types';
import {
  X,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Package,
  ShoppingCart,
  CreditCard,
  School as SchoolIcon,
  Users,
} from 'lucide-react';

interface SchoolDetailModalProps {
  school: School | null;
  onClose: () => void;
}

export const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({ school, onClose }) => {
  const {
    books,
    stationery,
    orders,
    staff,
    updateSchool,
    updateSchoolBookMappings,
    updateSchoolStationeryMappings,
    businessProfile,
    setPublicPortalOpen,
    setPublicSelectedSchoolCode,
    setSelectedOrderForReceipt,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'classes' | 'books' | 'stationery' | 'orders' | 'payments' | 'public-link'
  >('overview');

  const [selectedClass, setSelectedClass] = useState<string>(
    school?.classes[0] || 'Class 5'
  );

  const [newClassName, setNewClassName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Add Book to Class modal state
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [bookToAddId, setBookToAddId] = useState('');
  const [isBookMandatory, setIsBookMandatory] = useState(true);

  // Add Stationery to Class modal state
  const [isAddStationeryModalOpen, setIsAddStationeryModalOpen] = useState(false);
  const [stationeryToAddId, setStationeryToAddId] = useState('');
  const [stationeryQty, setStationeryQty] = useState(1);
  const [isStationeryMandatory, setIsStationeryMandatory] = useState(true);

  if (!school) return null;

  // School specific calculations
  const schoolOrders = orders.filter((o) => o.schoolId === school.id);
  const totalSales = schoolOrders.reduce((acc, o) => acc + o.total, 0);
  const totalPaid = schoolOrders.reduce((acc, o) => acc + o.paidAmount, 0);
  const totalPending = schoolOrders.reduce((acc, o) => acc + o.remainingAmount, 0);

  // Class books
  const classBookMappings = school.bookMappings.filter((m) => m.classId === selectedClass);
  const classBooks = classBookMappings
    .map((m) => {
      const b = books.find((book) => book.id === m.bookId);
      return b ? { ...b, isMandatory: m.isMandatory } : null;
    })
    .filter(Boolean) as (Book & { isMandatory: boolean })[];

  // Class stationery
  const classStationeryMappings = school.stationeryMappings.filter(
    (m) => m.classId === selectedClass
  );
  const classStationery = classStationeryMappings
    .map((m) => {
      const s = stationery.find((item) => item.id === m.stationeryId);
      return s
        ? { ...s, defaultQuantity: m.defaultQuantity, isMandatory: m.isMandatory }
        : null;
    })
    .filter(Boolean) as (Stationery & { defaultQuantity: number; isMandatory: boolean })[];

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const name = newClassName.trim();
    if (school.classes.includes(name)) return;
    const updated = [...school.classes, name];
    updateSchool(school.id, { classes: updated });
    setNewClassName('');
    setSelectedClass(name);
  };

  const handleRemoveClass = (cls: string) => {
    if (school.classes.length <= 1) return;
    const updated = school.classes.filter((c) => c !== cls);
    const updatedBookMappings = school.bookMappings.filter((m) => m.classId !== cls);
    const updatedStationeryMappings = school.stationeryMappings.filter((m) => m.classId !== cls);
    updateSchool(school.id, {
      classes: updated,
      bookMappings: updatedBookMappings,
      stationeryMappings: updatedStationeryMappings,
    });
    if (selectedClass === cls) {
      setSelectedClass(updated[0]);
    }
  };

  const handleAddBookToClass = () => {
    if (!bookToAddId) return;
    const exists = school.bookMappings.some(
      (m) => m.classId === selectedClass && m.bookId === bookToAddId
    );
    if (exists) return;

    const newMappings: SchoolBookMapping[] = [
      ...school.bookMappings,
      { bookId: bookToAddId, classId: selectedClass, isMandatory: isBookMandatory },
    ];
    updateSchoolBookMappings(school.id, newMappings);
    setIsAddBookModalOpen(false);
    setBookToAddId('');
  };

  const handleRemoveBookFromClass = (bookId: string) => {
    const newMappings = school.bookMappings.filter(
      (m) => !(m.classId === selectedClass && m.bookId === bookId)
    );
    updateSchoolBookMappings(school.id, newMappings);
  };

  const handleAddStationeryToClass = () => {
    if (!stationeryToAddId) return;
    const exists = school.stationeryMappings.some(
      (m) => m.classId === selectedClass && m.stationeryId === stationeryToAddId
    );
    if (exists) return;

    const newMappings: SchoolStationeryMapping[] = [
      ...school.stationeryMappings,
      {
        stationeryId: stationeryToAddId,
        classId: selectedClass,
        defaultQuantity: Number(stationeryQty) || 1,
        isMandatory: isStationeryMandatory,
      },
    ];
    updateSchoolStationeryMappings(school.id, newMappings);
    setIsAddStationeryModalOpen(false);
    setStationeryToAddId('');
  };

  const handleRemoveStationeryFromClass = (stationeryId: string) => {
    const newMappings = school.stationeryMappings.filter(
      (m) => !(m.classId === selectedClass && m.stationeryId === stationeryId)
    );
    updateSchoolStationeryMappings(school.id, newMappings);
  };

  const publicUrl = `${window.location.origin}/?school=${school.code}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">{school.name}</h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                {school.code}
              </span>
              <span className="text-xs text-neutral-500">· {school.city}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Contact: {school.contactPerson} · Ph: {school.phone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-neutral-200 bg-white overflow-x-auto shrink-0 text-xs font-medium">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'classes', label: `Classes (${school.classes.length})` },
            { id: 'books', label: 'School Book List' },
            { id: 'stationery', label: 'Stationery List' },
            { id: 'orders', label: `Orders (${schoolOrders.length})` },
            { id: 'payments', label: 'Payments' },
            { id: 'public-link', label: 'Public Link' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-950 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-500 font-medium">Configured Classes</p>
                  <p className="text-xl font-bold font-mono text-neutral-900 mt-1">
                    {school.classes.length}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-500 font-medium">Total Orders Placed</p>
                  <p className="text-xl font-bold font-mono text-neutral-900 mt-1">
                    {schoolOrders.length}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-500 font-medium">Total Sales</p>
                  <p className="text-xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
                    {businessProfile.currencySymbol}{totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-500 font-medium">Pending Dues</p>
                  <p className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                    {businessProfile.currencySymbol}{totalPending.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* School Details & Assignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="p-4 bg-white rounded-lg border border-neutral-200 space-y-2.5">
                  <h4 className="font-semibold text-neutral-900 text-sm border-b border-neutral-100 pb-2">
                    Institution Details
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Contact Person</span>
                    <span className="font-medium text-neutral-800">{school.contactPerson}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Official Phone</span>
                    <span className="font-mono text-neutral-800">{school.phone}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Email Address</span>
                    <span className="text-neutral-800">{school.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Campus Address</span>
                    <span className="text-neutral-800 text-right max-w-56">{school.address}, {school.city}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Public Ordering</span>
                    <span className="font-semibold text-emerald-700">
                      {school.publicOrderingEnabled ? 'Enabled for Parents' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-neutral-200 space-y-2.5">
                  <h4 className="font-semibold text-neutral-900 text-sm border-b border-neutral-100 pb-2">
                    Staff & Partner Assignments
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Assigned Dealer Employee</span>
                    <span className="font-medium text-neutral-800">
                      {school.assignedEmployeeName || 'Not Assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Assigned Book Stall / Partner</span>
                    <span className="font-medium text-neutral-800">
                      {school.assignedPartnerName || 'Direct Store Fulfillment'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <p className="font-semibold text-neutral-800 mb-1.5">Class Enrollment Forecast</p>
                    <div className="space-y-1">
                      {Object.entries(school.expectedStudentsPerClass || {}).map(([cls, count]) => (
                        <div key={cls} className="flex justify-between text-neutral-600">
                          <span>{cls} Expected Students</span>
                          <span className="font-mono font-medium text-neutral-900 tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Classes */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">Configured School Grades / Classes</h4>
                  <p className="text-xs text-neutral-500">
                    Each class has an independent textbook and stationery catalogue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Class 11 (Commerce)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-neutral-900"
                  />
                  <button
                    onClick={handleAddClass}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Class</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {school.classes.map((cls) => {
                  const bookCount = school.bookMappings.filter((m) => m.classId === cls).length;
                  const statCount = school.stationeryMappings.filter((m) => m.classId === cls).length;
                  return (
                    <div
                      key={cls}
                      className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 text-sm">{cls}</span>
                        {school.classes.length > 1 && (
                          <button
                            onClick={() => handleRemoveClass(cls)}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                            title="Remove class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="mt-2 text-[11px] text-neutral-500 space-y-0.5">
                        <p>{bookCount} Textbooks prescribed</p>
                        <p>{statCount} Stationery items</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClass(cls);
                          setActiveTab('books');
                        }}
                        className="mt-3 text-xs font-semibold text-neutral-900 hover:underline text-left"
                      >
                        Edit Catalogue →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: School Book List (Section 6) */}
          {activeTab === 'books' && (
            <div className="space-y-4">
              {/* Class Selector & Add button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-700">Select Grade:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium border border-neutral-300 rounded-md bg-white focus:outline-neutral-900"
                  >
                    {school.classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-neutral-400 font-mono">
                    ({classBooks.length} books prescribed)
                  </span>
                </div>

                <button
                  onClick={() => setIsAddBookModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Map Master Book to {selectedClass}</span>
                </button>
              </div>

              {/* Book List Table */}
              <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Subject</th>
                      <th className="py-2.5 px-3 font-semibold">Book Name</th>
                      <th className="py-2.5 px-3 font-semibold">Publisher</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Type</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Selling Price</th>
                      <th className="py-2.5 px-3 font-semibold text-center">In Stock</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {classBooks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-neutral-400">
                          No textbooks mapped to {selectedClass} yet. Click "+ Map Master Book" to assign.
                        </td>
                      </tr>
                    ) : (
                      classBooks.map((b) => (
                        <tr key={b.id} className="hover:bg-neutral-50/70">
                          <td className="py-2.5 px-3 font-medium text-neutral-900">{b.subject}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-neutral-900">{b.name}</p>
                            {b.isbn && <p className="text-[10px] text-neutral-400 font-mono">ISBN: {b.isbn}</p>}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-600">{b.publisherName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                b.isMandatory
                                  ? 'bg-neutral-100 text-neutral-800'
                                  : 'bg-neutral-50 text-neutral-500'
                              }`}
                            >
                              {b.isMandatory ? 'Mandatory' : 'Optional'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-neutral-900">
                            {businessProfile.currencySymbol}{b.sellingPrice}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                            <span className={b.currentStock <= b.minStock ? 'text-rose-600 font-bold' : 'text-neutral-700'}>
                              {b.currentStock}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveBookFromClass(b.id)}
                              className="text-neutral-400 hover:text-rose-600 p-1 transition-colors"
                              title="Remove from this school class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Master Book sub-modal */}
              {isAddBookModalOpen && (
                <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-neutral-900 text-xs">
                      Prescribe Master Book for {selectedClass}
                    </h5>
                    <button
                      onClick={() => setIsAddBookModalOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Select Book from Master Product Repository
                      </label>
                      <select
                        value={bookToAddId}
                        onChange={(e) => setBookToAddId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-neutral-900"
                      >
                        <option value="">-- Choose Book --</option>
                        {books
                          .filter(
                            (b) =>
                              !classBookMappings.some((m) => m.bookId === b.id)
                          )
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.subject} · {b.publisherName} · {businessProfile.currencySymbol}{b.sellingPrice})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Requirement Type
                      </label>
                      <select
                        value={isBookMandatory ? 'true' : 'false'}
                        onChange={(e) => setIsBookMandatory(e.target.value === 'true')}
                        className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md bg-white"
                      >
                        <option value="true">Mandatory Core Subject</option>
                        <option value="false">Optional / Reference</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddBookModalOpen(false)}
                      className="px-3 py-1 text-xs text-neutral-600 bg-white border border-neutral-300 rounded-md hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBookToClass}
                      disabled={!bookToAddId}
                      className="px-3 py-1 text-xs font-semibold text-white bg-neutral-900 disabled:bg-neutral-300 rounded-md hover:bg-neutral-800"
                    >
                      Confirm Mapping
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Stationery List (Section 8) */}
          {activeTab === 'stationery' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-700">Select Grade:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium border border-neutral-300 rounded-md bg-white focus:outline-neutral-900"
                  >
                    {school.classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-neutral-400 font-mono">
                    ({classStationery.length} items configured)
                  </span>
                </div>

                <button
                  onClick={() => setIsAddStationeryModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Map Stationery to {selectedClass}</span>
                </button>
              </div>

              {/* Stationery table */}
              <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Product Name</th>
                      <th className="py-2.5 px-3 font-semibold">Category</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Default Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Set Total</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {classStationery.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-neutral-400">
                          No stationery items mapped to {selectedClass} yet.
                        </td>
                      </tr>
                    ) : (
                      classStationery.map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-50/70">
                          <td className="py-2.5 px-3 font-medium text-neutral-900">{s.name}</td>
                          <td className="py-2.5 px-3 text-neutral-500">{s.category}</td>
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums font-semibold">
                            {s.defaultQuantity} {s.unit}s
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {businessProfile.currencySymbol}{s.sellingPrice}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-neutral-900">
                            {businessProfile.currencySymbol}{s.sellingPrice * s.defaultQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveStationeryFromClass(s.id)}
                              className="text-neutral-400 hover:text-rose-600 p-1 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Stationery sub-modal */}
              {isAddStationeryModalOpen && (
                <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-lg space-y-3">
                  <h5 className="font-semibold text-neutral-900 text-xs">
                    Prescribe Stationery for {selectedClass}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Select Stationery Product
                      </label>
                      <select
                        value={stationeryToAddId}
                        onChange={(e) => setStationeryToAddId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-neutral-900"
                      >
                        <option value="">-- Choose Product --</option>
                        {stationery
                          .filter(
                            (s) =>
                              !classStationeryMappings.some((m) => m.stationeryId === s.id)
                          )
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({businessProfile.currencySymbol}{s.sellingPrice})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Default Recommended Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={stationeryQty}
                        onChange={(e) => setStationeryQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                        Mandatory / Optional
                      </label>
                      <select
                        value={isStationeryMandatory ? 'true' : 'false'}
                        onChange={(e) => setIsStationeryMandatory(e.target.value === 'true')}
                        className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md bg-white"
                      >
                        <option value="true">Mandatory Kit Item</option>
                        <option value="false">Optional Add-on</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddStationeryModalOpen(false)}
                      className="px-3 py-1 text-xs text-neutral-600 bg-white border border-neutral-300 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddStationeryToClass}
                      disabled={!stationeryToAddId}
                      className="px-3 py-1 text-xs font-semibold text-white bg-neutral-900 disabled:bg-neutral-300 rounded-md"
                    >
                      Save to {selectedClass} Kit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: School Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs font-medium text-neutral-600">
                  Showing {schoolOrders.length} orders billed for {school.name}
                </span>
              </div>
              <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Order ID</th>
                      <th className="py-2.5 px-3 font-semibold">Class</th>
                      <th className="py-2.5 px-3 font-semibold">Student</th>
                      <th className="py-2.5 px-3 font-semibold">Source</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {schoolOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{o.id}</td>
                        <td className="py-2.5 px-3">{o.classId}</td>
                        <td className="py-2.5 px-3 font-medium text-neutral-900">{o.studentName}</td>
                        <td className="py-2.5 px-3 text-neutral-600">{o.source}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                          {businessProfile.currencySymbol}{o.total}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[11px] text-neutral-800">{o.orderStatus}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrderForReceipt(o)}
                            className="px-2 py-1 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Payments & Ledger */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <p className="text-xs text-neutral-500">Gross School Orders</p>
                  <p className="text-xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
                    {businessProfile.currencySymbol}{totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-800">Collected Funds</p>
                  <p className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                    {businessProfile.currencySymbol}{totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">Pending Parent Balances</p>
                  <p className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                    {businessProfile.currencySymbol}{totalPending.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Unsettled Customer Balances for {school.name}
                </h4>
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Order</th>
                        <th className="py-2 px-3">Student</th>
                        <th className="py-2 px-3">Grade</th>
                        <th className="py-2 px-3 text-right">Order Total</th>
                        <th className="py-2 px-3 text-right">Paid</th>
                        <th className="py-2 px-3 text-right">Pending Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {schoolOrders
                        .filter((o) => o.remainingAmount > 0)
                        .map((o) => (
                          <tr key={o.id}>
                            <td className="py-2 px-3 font-mono font-medium">{o.id}</td>
                            <td className="py-2 px-3">{o.studentName} ({o.phone})</td>
                            <td className="py-2 px-3">{o.classId}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">{businessProfile.currencySymbol}{o.total}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700">{businessProfile.currencySymbol}{o.paidAmount}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-amber-700">
                              {businessProfile.currencySymbol}{o.remainingAmount}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Public Link (Section 16-18) */}
          {activeTab === 'public-link' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-blue-950">
                    Public Parent Order Link for {school.name}
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    Live & Active
                  </span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Parents and students can open this direct link to view this school's official syllabus, select their class, choose books & stationery, and place orders without logging in.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-blue-300 rounded-lg text-neutral-800"
                  />
                  <button
                    onClick={copyPublicLink}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-100 border border-blue-300 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPublicSelectedSchoolCode(school.code);
                      setPublicPortalOpen(true);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Parent Portal</span>
                  </button>
                </div>
              </div>

              {/* Public settings */}
              <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-3 text-xs">
                <h5 className="font-semibold text-neutral-900">Public Page Settings</h5>
                <label className="flex items-center gap-2 text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={school.publicOrderingEnabled}
                    onChange={(e) =>
                      updateSchool(school.id, { publicOrderingEnabled: e.target.checked })
                    }
                    className="rounded text-neutral-900 focus:ring-0"
                  />
                  <span>Allow public parent ordering for this school</span>
                </label>
                <p className="text-[11px] text-neutral-500">
                  When enabled, this school appears in the Public School Directory with its code ({school.code}).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-neutral-500 font-mono">School ID: {school.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors"
          >
            Close School Details
          </button>
        </div>
      </div>
    </div>
  );
};
