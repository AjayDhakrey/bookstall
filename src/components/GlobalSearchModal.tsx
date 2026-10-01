import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Search, School, BookOpen, User, ShoppingCart, Building2, ArrowRight, X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    schools,
    books,
    orders,
    publishers,
    students,
    setActiveTab,
    setSelectedOrderForReceipt,
    setSelectedSchoolForDetail,
    businessProfile,
  } = useApp();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedSchools = schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );

    const matchedBooks = books.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        b.applicableClass.toLowerCase().includes(q) ||
        b.publisherName.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
    );

    const matchedOrders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.studentName.toLowerCase().includes(q) ||
        o.schoolName.toLowerCase().includes(q) ||
        o.phone.includes(q)
    );

    const matchedPublishers = publishers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );

    const matchedStudents = students.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.phone.includes(q) ||
        (st.schoolName && st.schoolName.toLowerCase().includes(q))
    );

    const count =
      matchedSchools.length +
      matchedBooks.length +
      matchedOrders.length +
      matchedPublishers.length +
      matchedStudents.length;

    return {
      count,
      schools: matchedSchools.slice(0, 3),
      books: matchedBooks.slice(0, 4),
      orders: matchedOrders.slice(0, 4),
      publishers: matchedPublishers.slice(0, 3),
      students: matchedStudents.slice(0, 3),
    };
  }, [query, schools, books, orders, publishers, students]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-neutral-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 bg-white">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything (School name or code, Order ID, Book, Publisher, Student)..."
            className="w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-neutral-100 text-neutral-500 rounded border border-neutral-200">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-neutral-100">
          {!query && (
            <div className="p-6 text-center text-xs text-neutral-400 space-y-1">
              <p>Type to search across schools, book catalogue, active orders, and publishers.</p>
              <p className="font-mono text-[11px] text-neutral-500">
                Try: "ABC01", "Maths 5", "ORD-10254", "NCERT", or "Rahul"
              </p>
            </div>
          )}

          {results && results.count === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500">
              No matching records found for "{query}".
            </div>
          )}

          {results && (
            <>
              {/* Schools */}
              {results.schools.length > 0 && (
                <div className="py-2.5">
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <School className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Schools</span>
                  </div>
                  {results.schools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => {
                        setSelectedSchoolForDetail(school);
                        setActiveTab('schools');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 text-left transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900 group-hover:text-blue-600">
                          {school.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Code: {school.code} · {school.classes.length} Classes · {school.city}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Books */}
              {results.books.length > 0 && (
                <div className="py-2.5">
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Books & Products</span>
                  </div>
                  {results.books.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setActiveTab('products');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 text-left transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900 group-hover:text-blue-600">
                          {book.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {book.applicableClass} · {book.publisherName} · Stock: {book.currentStock}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-semibold text-neutral-900 tabular-nums">
                          {businessProfile.currencySymbol}{book.sellingPrice}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders */}
              {results.orders.length > 0 && (
                <div className="py-2.5">
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <ShoppingCart className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Orders</span>
                  </div>
                  {results.orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => {
                        setSelectedOrderForReceipt(order);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 text-left transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-900 group-hover:text-blue-600">
                            {order.id}
                          </span>
                          <span className="text-xs text-neutral-600">· {order.studentName}</span>
                          <span className="text-[11px] text-neutral-400">({order.schoolName})</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Status: {order.orderStatus} · Payment: {order.paymentStatus} · Source: {order.source}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-semibold text-neutral-900 tabular-nums">
                          {businessProfile.currencySymbol}{order.total}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Publishers */}
              {results.publishers.length > 0 && (
                <div className="py-2.5">
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Publishers</span>
                  </div>
                  {results.publishers.map((pub) => (
                    <button
                      key={pub.id}
                      onClick={() => {
                        setActiveTab('products');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 text-left transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900 group-hover:text-blue-600">
                          {pub.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Contact: {pub.contactPerson} · {pub.phone} · Terms: {pub.paymentTerms}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-neutral-400">Due</p>
                        <span className="font-mono text-xs font-semibold text-rose-600 tabular-nums">
                          {businessProfile.currencySymbol}{pub.pendingDue}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Students */}
              {results.students.length > 0 && (
                <div className="py-2.5">
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Students</span>
                  </div>
                  {results.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 rounded-lg text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {student.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {student.schoolName} · {student.classId} · Ph: {student.phone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Global Search indexed across 5 system entities</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
