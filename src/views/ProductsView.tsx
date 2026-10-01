import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Book, Stationery, Publisher } from '../types';
import {
  BookOpen,
  Package,
  Building2,
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    books,
    stationery,
    publishers,
    addBook,
    updateBook,
    addStationery,
    updateStationery,
    addPublisher,
    updatePublisher,
    recordPublisherPayment,
    businessProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'books' | 'stationery' | 'publishers'>('books');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isAddStationeryModalOpen, setIsAddStationeryModalOpen] = useState(false);
  const [isAddPublisherModalOpen, setIsAddPublisherModalOpen] = useState(false);
  const [publisherToPay, setPublisherToPay] = useState<Publisher | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Book Form State
  const [bookName, setBookName] = useState('');
  const [bookPublisherId, setBookPublisherId] = useState('');
  const [bookSubject, setBookSubject] = useState('');
  const [bookClass, setBookClass] = useState('Class 5');
  const [bookIsbn, setBookIsbn] = useState('');
  const [bookPurchasePrice, setBookPurchasePrice] = useState(250);
  const [bookSellingPrice, setBookSellingPrice] = useState(320);
  const [bookStock, setBookStock] = useState(50);
  const [bookMinStock, setBookMinStock] = useState(20);

  // Stationery Form State
  const [statName, setStatName] = useState('');
  const [statCategory, setStatCategory] = useState('Notebooks');
  const [statUnit, setStatUnit] = useState('Pcs');
  const [statPurchasePrice, setStatPurchasePrice] = useState(40);
  const [statSellingPrice, setStatSellingPrice] = useState(55);
  const [statStock, setStatStock] = useState(100);
  const [statMinStock, setStatMinStock] = useState(30);

  // Publisher Form State
  const [pubName, setPubName] = useState('');
  const [pubContact, setPubContact] = useState('');
  const [pubPhone, setPubPhone] = useState('');
  const [pubEmail, setPubEmail] = useState('');
  const [pubAddress, setPubAddress] = useState('');
  const [pubPaymentTerms, setPubPaymentTerms] = useState('Net 30 Days');

  // Handle Book Creation
  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName || !bookPublisherId) return;

    const publisher = publishers.find((p) => p.id === bookPublisherId);
    addBook({
      name: bookName.trim(),
      publisherId: bookPublisherId,
      publisherName: publisher?.name || 'Publisher',
      subject: bookSubject.trim() || 'General',
      applicableClass: bookClass.trim(),
      isbn: bookIsbn.trim() || undefined,
      purchasePrice: Number(bookPurchasePrice) || 0,
      sellingPrice: Number(bookSellingPrice) || 0,
      currentStock: Number(bookStock) || 0,
      minStock: Number(bookMinStock) || 0,
      status: 'Active',
    });

    setIsAddBookModalOpen(false);
    setBookName('');
    setBookIsbn('');
  };

  // Handle Stationery Creation
  const handleCreateStationery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statName) return;

    addStationery({
      name: statName.trim(),
      category: statCategory.trim(),
      unit: statUnit.trim(),
      purchasePrice: Number(statPurchasePrice) || 0,
      sellingPrice: Number(statSellingPrice) || 0,
      currentStock: Number(statStock) || 0,
      minStock: Number(statMinStock) || 0,
      status: 'Active',
    });

    setIsAddStationeryModalOpen(false);
    setStatName('');
  };

  // Handle Publisher Creation
  const handleCreatePublisher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubName) return;

    addPublisher({
      name: pubName.trim(),
      contactPerson: pubContact.trim(),
      phone: pubPhone.trim(),
      email: pubEmail.trim(),
      address: pubAddress.trim(),
      paymentTerms: pubPaymentTerms.trim(),
      status: 'Active',
    });

    setIsAddPublisherModalOpen(false);
    setPubName('');
    setPubContact('');
    setPubPhone('');
    setPubEmail('');
    setPubAddress('');
  };

  // Handle Publisher Payment
  const handleSettlePublisherPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherToPay || !payAmount) return;
    const amount = Number(payAmount);
    if (amount <= 0) return;

    recordPublisherPayment(publisherToPay.id, amount, payNote);
    setPublisherToPay(null);
    setPayAmount('');
    setPayNote('');
  };

  const filteredBooks = books.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.subject.toLowerCase().includes(search.toLowerCase()) ||
      b.publisherName.toLowerCase().includes(search.toLowerCase()) ||
      b.applicableClass.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStationery = stationery.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPublishers = publishers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Products & Publishers</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Single master repository for Textbooks, Stationery supplies, and Publishing houses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'books' && (
            <button
              onClick={() => setIsAddBookModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Master Book</span>
            </button>
          )}
          {activeTab === 'stationery' && (
            <button
              onClick={() => setIsAddStationeryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Stationery Product</span>
            </button>
          )}
          {activeTab === 'publishers' && (
            <button
              onClick={() => setIsAddPublisherModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Publisher</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200">
          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'books'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Master Books ({books.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stationery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'stationery'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stationery Products ({stationery.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('publishers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'publishers'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Publishers ({publishers.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-neutral-900 bg-neutral-50"
          />
        </div>
      </div>

      {/* TAB 1: Books Table */}
      {activeTab === 'books' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Book ID & Title</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Publisher</th>
                  <th className="py-3 px-4 font-semibold">Class</th>
                  <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Selling MRP</th>
                  <th className="py-3 px-4 font-semibold text-center">Stock</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredBooks.map((book) => {
                  const isLow = book.currentStock <= book.minStock;
                  return (
                    <tr key={book.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-neutral-400 block">{book.id}</span>
                        <p className="font-semibold text-neutral-900">{book.name}</p>
                        {book.isbn && <p className="text-[10px] text-neutral-400 font-mono">ISBN: {book.isbn}</p>}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-800">{book.subject}</td>
                      <td className="py-3.5 px-4 text-neutral-600">{book.publisherName}</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-neutral-700">{book.applicableClass}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-600">
                        {businessProfile.currencySymbol}{book.purchasePrice}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {businessProfile.currencySymbol}{book.sellingPrice}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono tabular-nums font-bold ${isLow ? 'text-rose-600' : 'text-neutral-800'}`}>
                          {book.currentStock}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-rose-500 font-normal">
                            Min: {book.minStock}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] font-medium text-emerald-700">
                          {book.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Stationery Table */}
      {activeTab === 'stationery' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Item ID & Product</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Unit Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                  <th className="py-3 px-4 font-semibold text-center">Current Stock</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStationery.map((item) => {
                  const isLow = item.currentStock <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-neutral-400 block">{item.id}</span>
                        <p className="font-semibold text-neutral-900">{item.name}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-700">{item.category}</td>
                      <td className="py-3.5 px-4 text-neutral-500 font-mono">{item.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-600">
                        {businessProfile.currencySymbol}{item.purchasePrice}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {businessProfile.currencySymbol}{item.sellingPrice}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono tabular-nums font-bold ${isLow ? 'text-rose-600' : 'text-neutral-800'}`}>
                          {item.currentStock}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-rose-500 font-normal">
                            Min: {item.minStock}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] font-medium text-emerald-700">{item.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Publishers Table */}
      {activeTab === 'publishers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPublishers.map((pub) => {
              const suppliedBooks = books.filter((b) => b.publisherId === pub.id);
              return (
                <div
                  key={pub.id}
                  className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                          {pub.id}
                        </span>
                        <h3 className="text-base font-bold text-neutral-900 mt-0.5">{pub.name}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Contact: {pub.contactPerson} · Ph: {pub.phone}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-neutral-700 px-2 py-0.5 bg-neutral-100 rounded">
                        {pub.paymentTerms}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-600 space-y-1">
                      <p className="truncate">Email: {pub.email}</p>
                      <p className="truncate">Office: {pub.address}</p>
                    </div>

                    {/* Books Supplied List */}
                    <div className="mt-3 pt-2 border-t border-neutral-100">
                      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Titles Catalogued ({suppliedBooks.length}):
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {suppliedBooks.map((b) => (
                          <span
                            key={b.id}
                            className="text-[11px] px-2 py-0.5 bg-neutral-50 text-neutral-700 rounded border border-neutral-200/60"
                          >
                            {b.name} ({b.applicableClass})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financials Breakdown */}
                  <div className="mt-5 pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Total Purchased / Paid</span>
                      <span className="text-xs font-mono tabular-nums text-neutral-800">
                        {businessProfile.currencySymbol}{pub.totalPurchased.toLocaleString()} / {businessProfile.currencySymbol}{pub.totalPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-neutral-500 block">Pending Due</span>
                      <span className={`text-sm font-bold font-mono tabular-nums ${pub.pendingDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {businessProfile.currencySymbol}{pub.pendingDue.toLocaleString()}
                      </span>
                    </div>
                    {pub.pendingDue > 0 && (
                      <button
                        onClick={() => {
                          setPublisherToPay(pub);
                          setPayAmount(String(pub.pendingDue));
                        }}
                        className="ml-3 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                      >
                        Settle Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settle Publisher Payment Modal */}
      {publisherToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Record Publisher Payment</h3>
              <button onClick={() => setPublisherToPay(null)} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>
            <form onSubmit={handleSettlePublisherPayment} className="p-6 space-y-4 text-xs">
              <div>
                <p className="text-xs text-neutral-500">Publisher</p>
                <p className="font-semibold text-sm text-neutral-900">{publisherToPay.name}</p>
                <p className="text-[11px] text-neutral-500">Current Outstanding: <strong className="text-rose-600 font-mono">{businessProfile.currencySymbol}{publisherToPay.pendingDue.toLocaleString()}</strong></p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Payment Amount to Pay ({businessProfile.currencySymbol}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={publisherToPay.pendingDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Reference Note (Cheque / NEFT / RTGS)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank NEFT ref #884192"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setPublisherToPay(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium"
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

      {/* Add Master Book Modal */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-base font-bold text-neutral-900">Add Master Book</h3>
              <button onClick={() => setIsAddBookModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateBook} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Explorer 6"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Publisher *</label>
                  <select
                    value={bookPublisherId}
                    onChange={(e) => setBookPublisherId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="">-- Choose Publisher --</option>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Science"
                    value={bookSubject}
                    onChange={(e) => setBookSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Target Class / Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. Class 5"
                    value={bookClass}
                    onChange={(e) => setBookClass(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">ISBN Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="978-..."
                    value={bookIsbn}
                    onChange={(e) => setBookIsbn(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Purchase / Dealer Cost ({businessProfile.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={bookPurchasePrice}
                    onChange={(e) => setBookPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Selling MRP ({businessProfile.currencySymbol}) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bookSellingPrice}
                    onChange={(e) => setBookSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Opening Stock (In Hand)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookStock}
                    onChange={(e) => setBookStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={bookMinStock}
                    onChange={(e) => setBookMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Save Master Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stationery Modal */}
      {isAddStationeryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-base font-bold text-neutral-900">Add Stationery Product</h3>
              <button onClick={() => setIsAddStationeryModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStationery} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classmate 4-Line Notebook"
                  value={statName}
                  onChange={(e) => setStatName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Notebooks, Instruments..."
                    value={statCategory}
                    onChange={(e) => setStatCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit (e.g. Book, Box, Pack)</label>
                  <input
                    type="text"
                    placeholder="Book, Pack..."
                    value={statUnit}
                    onChange={(e) => setStatUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Purchase Cost ({businessProfile.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={statPurchasePrice}
                    onChange={(e) => setStatPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Selling Price ({businessProfile.currencySymbol}) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={statSellingPrice}
                    onChange={(e) => setStatSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={statStock}
                    onChange={(e) => setStatStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Min Safety Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={statMinStock}
                    onChange={(e) => setStatMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddStationeryModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Save Stationery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Publisher Modal */}
      {isAddPublisherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-base font-bold text-neutral-900">Add Publisher</h3>
              <button onClick={() => setIsAddPublisherModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePublisher} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Publisher Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cambridge University Press"
                  value={pubName}
                  onChange={(e) => setPubName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Contact Representative</label>
                  <input
                    type="text"
                    placeholder="e.g. Vikas Goel"
                    value={pubContact}
                    onChange={(e) => setPubContact(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={pubPhone}
                    onChange={(e) => setPubPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Orders Email</label>
                <input
                  type="email"
                  placeholder="sales@publisher.com"
                  value={pubEmail}
                  onChange={(e) => setPubEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Office Address</label>
                  <input
                    type="text"
                    placeholder="New Delhi, India"
                    value={pubAddress}
                    onChange={(e) => setPubAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Payment Credit Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. Net 30 Days"
                    value={pubPaymentTerms}
                    onChange={(e) => setPubPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddPublisherModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Save Publisher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
