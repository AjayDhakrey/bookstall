import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { School, Book, Stationery, Order, OrderItem } from '../types';
import {
  Search,
  School as SchoolIcon,
  ShoppingCart,
  CheckCircle2,
  ArrowLeft,
  Printer,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building,
  Check,
  Sparkles,
} from 'lucide-react';

export const PublicPortalView: React.FC = () => {
  const {
    schools,
    books,
    stationery,
    orders,
    createOrder,
    businessProfile,
    publicSelectedSchoolCode,
    setPublicSelectedSchoolCode,
    setPublicPortalOpen,
    setSelectedOrderForReceipt,
  } = useApp();

  // Active sub-page in Public Portal
  const [currentView, setCurrentView] = useState<'directory' | 'school-catalog' | 'order-confirmed' | 'track-order'>(
    publicSelectedSchoolCode ? 'school-catalog' : 'directory'
  );

  // Directory Search & Filters (Section 17)
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Selected School & Class
  const [selectedSchool, setSelectedSchool] = useState<School | null>(() => {
    if (publicSelectedSchoolCode) {
      return schools.find((s) => s.code === publicSelectedSchoolCode) || null;
    }
    return null;
  });

  const [selectedClass, setSelectedClass] = useState<string>('');

  // Cart / Selections
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedStationeryItems, setSelectedStationeryItems] = useState<Record<string, number>>({});

  // Checkout Form Details
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'Stall Pickup' | 'Store Pickup' | 'Home Delivery'>('Stall Pickup');
  const [paymentChoice, setPaymentChoice] = useState<'Cash on Pickup' | 'Online Payment'>('Cash on Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Confirmation state
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Track Order Input
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState(false);

  // If publicSelectedSchoolCode changed externally
  useEffect(() => {
    if (publicSelectedSchoolCode) {
      const found = schools.find((s) => s.code === publicSelectedSchoolCode);
      if (found) {
        setSelectedSchool(found);
        setSelectedClass(found.classes[0] || 'Class 5');
        setCurrentView('school-catalog');
      }
    }
  }, [publicSelectedSchoolCode, schools]);

  // When class changes, reload default syllabus books & stationery
  useEffect(() => {
    if (selectedSchool && selectedClass) {
      const prescribedBooks = selectedSchool.bookMappings
        .filter((m) => m.classId === selectedClass)
        .map((m) => m.bookId);
      setSelectedBookIds(prescribedBooks);

      const prescribedStat: Record<string, number> = {};
      selectedSchool.stationeryMappings
        .filter((m) => m.classId === selectedClass)
        .forEach((m) => {
          prescribedStat[m.stationeryId] = m.defaultQuantity;
        });
      setSelectedStationeryItems(prescribedStat);
    }
  }, [selectedSchool, selectedClass]);

  // Public schools list (only publicOrderingEnabled = true)
  const activePublicSchools = schools.filter((s) => {
    if (!s.publicOrderingEnabled) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q);
    const matchesCity = !cityFilter || s.city.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setSelectedClass(school.classes[0] || 'Class 5');
    setCurrentView('school-catalog');
  };

  // Cart calculations
  const cartItems: OrderItem[] = [];

  selectedBookIds.forEach((bId) => {
    const b = books.find((x) => x.id === bId);
    if (b) {
      cartItems.push({
        id: `pub-book-${b.id}`,
        type: 'book',
        itemId: b.id,
        name: b.name,
        publisherOrCategory: b.publisherName,
        classOrSpec: b.applicableClass,
        unitPrice: b.sellingPrice,
        quantity: 1,
        total: b.sellingPrice,
      });
    }
  });

  Object.entries(selectedStationeryItems).forEach(([sId, qty]) => {
    if (qty > 0) {
      const st = stationery.find((x) => x.id === sId);
      if (st) {
        cartItems.push({
          id: `pub-stat-${st.id}`,
          type: 'stationery',
          itemId: st.id,
          name: st.name,
          publisherOrCategory: st.category,
          unitPrice: st.sellingPrice,
          quantity: qty,
          total: st.sellingPrice * qty,
        });
      }
    }
  });

  const cartSubtotal = cartItems.reduce((acc, i) => acc + i.total, 0);
  const cartDiscount = cartSubtotal >= 1000 ? 50 : 0; // Courtesy parent online discount
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  // Place Order
  const handlePlacePublicOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !studentName || !phone || cartItems.length === 0) return;

    const isPaidOnline = paymentChoice === 'Online Payment';
    const paidAmount = isPaidOnline ? cartTotal : 0;
    const remainingAmount = cartTotal - paidAmount;
    const paymentStatus = isPaidOnline ? 'Paid' : 'Pending';

    const payments = isPaidOnline
      ? [
          {
            id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            amount: paidAmount,
            method: 'UPI' as const,
            note: 'Parent online gateway payment',
            collectedBy: 'Online Portal',
          },
        ]
      : [];

    const order = await createOrder({
      schoolId: selectedSchool.id,
      schoolName: selectedSchool.name,
      classId: selectedClass,
      studentName: studentName.trim(),
      parentName: parentName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: deliveryAddress.trim() || undefined,
      source: 'Public Link',
      createdBy: 'System (Public Order)',
      items: cartItems,
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartTotal,
      paidAmount,
      remainingAmount,
      paymentStatus,
      orderStatus: 'Confirmed',
      payments,
      pickupOrDelivery: deliveryMethod,
      notes: `Public order placed via school link. Payment: ${paymentChoice}`,
    });

    setConfirmedOrder(order);
    setCurrentView('order-confirmed');
  };

  const handleTrackOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(false);
    const cleanId = trackOrderId.trim().toUpperCase();
    const found = orders.find((o) => o.id.toUpperCase() === cleanId);
    if (found) {
      setTrackedOrder(found);
    } else {
      setTrackedOrder(null);
      setTrackError(true);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Public Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            V
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">
              {businessProfile.businessName}
            </h1>
            <p className="text-[11px] text-neutral-500">Official School Curriculum Order Desk</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => {
              setCurrentView('directory');
              setSelectedSchool(null);
              setPublicSelectedSchoolCode(null);
            }}
            className={`font-medium transition-colors ${
              currentView === 'directory' ? 'text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Schools Directory
          </button>
          <span className="text-neutral-300">·</span>
          <button
            onClick={() => {
              setCurrentView('track-order');
              setTrackedOrder(null);
            }}
            className={`font-medium transition-colors ${
              currentView === 'track-order' ? 'text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Track Order
          </button>
          <span className="text-neutral-300">·</span>
          <button
            onClick={() => setPublicPortalOpen(false)}
            className="px-3 py-1.5 font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            ← Exit to Dealer Back-Office
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: Public School Directory (Section 17) */}
        {currentView === 'directory' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2 py-4">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                School Textbook & Stationery Orders
              </h2>
              <p className="text-xs text-neutral-600">
                Find your school below or enter the school code provided on your school circular to view approved class book lists.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by school name, code (e.g. ABC01), or address..."
                  className="w-full pl-10 pr-4 py-2 text-xs border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-neutral-900"
                />
              </div>
              <input
                type="text"
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-neutral-50"
              />
            </div>

            {/* School Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePublicSchools.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-neutral-200 text-neutral-500 text-xs">
                  No registered schools found matching your search. Please check the school code.
                </div>
              ) : (
                activePublicSchools.map((school) => (
                  <div
                    key={school.id}
                    className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs hover:border-neutral-400 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded">
                            {school.code}
                          </span>
                          <h3 className="text-base font-bold text-neutral-900 mt-1">{school.name}</h3>
                          <p className="text-xs text-neutral-500">{school.city}</p>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          Orders Open
                        </span>
                      </div>

                      <div className="mt-4 text-xs text-neutral-600 space-y-1">
                        <p>Address: {school.address}</p>
                        <p>Official Contact: {school.phone}</p>
                        <p className="font-medium text-neutral-800">
                          Grades Covered: {school.classes.length} classes ({school.classes.slice(0, 4).join(', ')}...)
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400">Authorized Dealer Catalog</span>
                      <button
                        onClick={() => handleSelectSchool(school)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <span>Select School & Order</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: School Public Page & Order Form (Sections 18 & 19) */}
        {currentView === 'school-catalog' && selectedSchool && (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentView('directory')}
              className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Schools Directory</span>
            </button>

            {/* School Public Banner */}
            <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                  School Code: {selectedSchool.code}
                </span>
                <h2 className="text-xl font-bold text-neutral-900 mt-1">{selectedSchool.name}</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedSchool.address}, {selectedSchool.city} · Ph: {selectedSchool.phone}
                </p>
              </div>

              {/* Class Selector Dropdown */}
              <div className="self-stretch sm:self-auto bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Select Student Grade / Class:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full sm:w-48 px-3 py-1.5 text-xs font-bold text-neutral-900 border border-neutral-300 rounded-md bg-white focus:outline-neutral-900"
                >
                  {selectedSchool.classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dual Grid: Catalog Selection + Order Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Book & Stationery Selection (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Prescribed Books Section (Section 18) */}
                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        Prescribed Textbooks for {selectedClass}
                      </h3>
                      <p className="text-xs text-neutral-500">Official syllabus approved by school faculty</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const classBooks = selectedSchool.bookMappings
                          .filter((m) => m.classId === selectedClass)
                          .map((m) => m.bookId);
                        setSelectedBookIds(classBooks);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Select All
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedSchool.bookMappings.filter((m) => m.classId === selectedClass).length === 0 ? (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        No textbooks currently listed for {selectedClass}.
                      </p>
                    ) : (
                      selectedSchool.bookMappings
                        .filter((m) => m.classId === selectedClass)
                        .map((m) => {
                          const book = books.find((b) => b.id === m.bookId);
                          if (!book) return null;
                          const isSelected = selectedBookIds.includes(book.id);
                          return (
                            <div
                              key={book.id}
                              onClick={() => {
                                setSelectedBookIds((prev) =>
                                  prev.includes(book.id)
                                    ? prev.filter((id) => id !== book.id)
                                    : [...prev, book.id]
                                );
                              }}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                  : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                                    isSelected
                                      ? 'bg-white text-neutral-900 border-white'
                                      : 'border-neutral-300'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-xs">{book.name}</p>
                                  <p className={`text-[11px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {book.subject} · {book.publisherName}
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono font-bold tabular-nums text-xs">
                                {businessProfile.currencySymbol}{book.sellingPrice}
                              </span>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Prescribed Stationery Section */}
                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        Recommended School Stationery & Notebooks
                      </h3>
                      <p className="text-xs text-neutral-500">Official specification notebooks and tools</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedSchool.stationeryMappings.filter((m) => m.classId === selectedClass).length === 0 ? (
                      <p className="text-xs text-neutral-400 py-6 text-center">
                        No stationery packages specified for {selectedClass}.
                      </p>
                    ) : (
                      selectedSchool.stationeryMappings
                        .filter((m) => m.classId === selectedClass)
                        .map((m) => {
                          const item = stationery.find((s) => s.id === m.stationeryId);
                          if (!item) return null;
                          const currentQty = selectedStationeryItems[item.id] || 0;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white"
                            >
                              <div>
                                <p className="font-semibold text-neutral-900 text-xs">{item.name}</p>
                                <p className="text-[11px] text-neutral-500">
                                  {item.category} · {businessProfile.currencySymbol}{item.sellingPrice} per {item.unit}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center border border-neutral-300 rounded-md overflow-hidden bg-white">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedStationeryItems((prev) => ({
                                        ...prev,
                                        [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                                      }))
                                    }
                                    className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 py-1 font-mono font-bold text-xs tabular-nums min-w-6 text-center">
                                    {currentQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedStationeryItems((prev) => ({
                                        ...prev,
                                        [item.id]: (prev[item.id] || 0) + 1,
                                      }))
                                    }
                                    className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="font-mono font-bold text-neutral-900 tabular-nums text-xs min-w-16 text-right">
                                  {businessProfile.currencySymbol}{item.sellingPrice * currentQty}
                                </span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Order Form (Section 19) */}
              <div className="space-y-6">
                <form
                  onSubmit={handlePlacePublicOrder}
                  className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4 text-xs"
                >
                  <div className="pb-3 border-b border-neutral-200">
                    <h3 className="text-sm font-bold text-neutral-900">Student & Delivery Information</h3>
                    <p className="text-neutral-500 text-[11px]">Direct dealer dispatch into classroom or stall</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alok Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Mobile Phone (for SMS updates) *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Delivery / Pickup Point *</label>
                    <select
                      value={deliveryMethod}
                      onChange={(e) => setDeliveryMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    >
                      <option value="Stall Pickup">Pick up at School Stall Counter</option>
                      <option value="Store Pickup">Pick up at Central Dealer Store</option>
                      <option value="Home Delivery">Doorstep Home Delivery</option>
                    </select>
                  </div>

                  {deliveryMethod === 'Home Delivery' && (
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Delivery Address *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="House no, Street, Landmark..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1.5">Payment Option *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentChoice('Cash on Pickup')}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          paymentChoice === 'Cash on Pickup'
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-white text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <p className="font-semibold text-xs">Cash on Stall</p>
                        <p className={`text-[10px] ${paymentChoice === 'Cash on Pickup' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          Pay when receiving
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentChoice('Online Payment')}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          paymentChoice === 'Online Payment'
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-white text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <p className="font-semibold text-xs">Online UPI / Card</p>
                        <p className={`text-[10px] ${paymentChoice === 'Online Payment' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          Instant receipt
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Order Summary Box */}
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
                    <div className="flex justify-between text-neutral-600">
                      <span>Items Selected ({cartItems.length})</span>
                      <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{cartSubtotal}</span>
                    </div>
                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Direct Parent Concession</span>
                        <span className="font-mono tabular-nums">-{businessProfile.currencySymbol}{cartDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                      <span>Total Payable</span>
                      <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{cartTotal}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cartItems.length === 0}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Place Confirmed Order ({businessProfile.currencySymbol}{cartTotal})
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Public Order Confirmation (Section 20) */}
        {currentView === 'order-confirmed' && confirmedOrder && (
          <div className="max-w-lg mx-auto bg-white rounded-xl border border-neutral-200 shadow-lg p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-700 font-bold">
                Order Successfully Placed
              </span>
              <h2 className="text-2xl font-bold font-mono text-neutral-900 mt-1">
                {confirmedOrder.id}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Keep this Order ID for picking up books at the school stall.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">School:</span>
                <span className="font-semibold text-neutral-900">{confirmedOrder.schoolName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Grade / Class:</span>
                <span className="font-semibold text-neutral-900">{confirmedOrder.classId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Student Name:</span>
                <span className="font-semibold text-neutral-900">{confirmedOrder.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Delivery Point:</span>
                <span className="font-semibold text-neutral-900">{confirmedOrder.pickupOrDelivery}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold">
                <span className="text-neutral-800">Total Amount:</span>
                <span className="font-mono tabular-nums text-neutral-900">
                  {businessProfile.currencySymbol}{confirmedOrder.total}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Payment Status:</span>
                <span className={confirmedOrder.paymentStatus === 'Paid' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {confirmedOrder.paymentStatus === 'Paid' ? 'Paid Online' : 'Pay Cash on Pickup'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setSelectedOrderForReceipt(confirmedOrder)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Tax Receipt</span>
              </button>
              <button
                onClick={() => {
                  setTrackOrderId(confirmedOrder.id);
                  setTrackedOrder(confirmedOrder);
                  setCurrentView('track-order');
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Track Fulfillment Status
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  setCurrentView('directory');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                ← Done / Back to Schools Directory
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: Public Order Tracking (Section 20 & 21) */}
        {currentView === 'track-order' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-neutral-900">Public Order Tracking</h2>
              <p className="text-xs text-neutral-500">
                Check whether your school textbook set is ready for pickup or being packed
              </p>
            </div>

            <form onSubmit={handleTrackOrderSubmit} className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs flex gap-2">
              <input
                type="text"
                required
                placeholder="Enter Order ID (e.g. ORD-10254)..."
                value={trackOrderId}
                onChange={(e) => setTrackOrderId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-lg font-mono uppercase focus:outline-neutral-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
              >
                Track Order
              </button>
            </form>

            {trackError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-center">
                Order not found. Please verify the ID on your invoice or receipt.
              </div>
            )}

            {trackedOrder && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div>
                    <span className="font-mono text-xs font-bold text-neutral-900 block">{trackedOrder.id}</span>
                    <span className="text-neutral-500 text-[11px]">{trackedOrder.schoolName} — {trackedOrder.classId}</span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold bg-neutral-900 text-white rounded-md">
                    {trackedOrder.orderStatus}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <p className="font-semibold text-neutral-700 mb-2">Fulfillment Progress:</p>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-neutral-600">
                    <div className={`p-1.5 rounded ${['Confirmed', 'Preparing', 'Ready', 'Delivered', 'Completed'].includes(trackedOrder.orderStatus) ? 'bg-emerald-100 text-emerald-900' : 'bg-neutral-100'}`}>
                      1. Confirmed
                    </div>
                    <div className={`p-1.5 rounded ${['Preparing', 'Ready', 'Delivered', 'Completed'].includes(trackedOrder.orderStatus) ? 'bg-emerald-100 text-emerald-900' : 'bg-neutral-100'}`}>
                      2. Packing Books
                    </div>
                    <div className={`p-1.5 rounded ${['Ready', 'Delivered', 'Completed'].includes(trackedOrder.orderStatus) ? 'bg-emerald-100 text-emerald-900' : 'bg-neutral-100'}`}>
                      3. Ready at Stall
                    </div>
                    <div className={`p-1.5 rounded ${['Delivered', 'Completed'].includes(trackedOrder.orderStatus) ? 'bg-emerald-100 text-emerald-900' : 'bg-neutral-100'}`}>
                      4. Completed
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg space-y-1">
                  <p>Student: <strong className="text-neutral-900">{trackedOrder.studentName}</strong></p>
                  <p>Handover Point: <strong className="text-neutral-900">{trackedOrder.pickupOrDelivery}</strong></p>
                  <p>Payment: <strong className="text-neutral-900">{trackedOrder.paymentStatus} ({businessProfile.currencySymbol}{trackedOrder.paidAmount} Paid / {businessProfile.currencySymbol}{trackedOrder.remainingAmount} Due)</strong></p>
                </div>

                <button
                  onClick={() => setSelectedOrderForReceipt(trackedOrder)}
                  className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-semibold text-xs"
                >
                  Download / View Receipt
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-4 px-6 text-center text-xs text-neutral-500">
        <p>{businessProfile.businessName} · Authorized Academic Distributor</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">Need help? Contact {businessProfile.phone} or visit our campus stalls</p>
      </footer>
    </div>
  );
};
