import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OrderSource, PaymentMethod, PaymentStatus, OrderItem } from '../types';
import {
  X,
  Check,
  Plus,
  ShoppingCart,
  School as SchoolIcon,
  User,
  CreditCard,
  Printer,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export const NewOrderModal: React.FC = () => {
  const {
    isNewOrderOpen,
    setIsNewOrderOpen,
    schools,
    books,
    stationery,
    students,
    currentUser,
    createOrder,
    businessProfile,
    setSelectedOrderForReceipt,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Context & Student
  const [source, setSource] = useState<OrderSource>('Store');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('new');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pickupOrDelivery, setPickupOrDelivery] = useState<
    'Stall Pickup' | 'Store Pickup' | 'Home Delivery' | 'School Desk'
  >('Store Pickup');

  // Step 2: Items Selection
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedStationeryItems, setSelectedStationeryItems] = useState<
    Record<string, number>
  >({}); // id -> qty
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Step 3: Payment
  const [paymentChoice, setPaymentChoice] = useState<'full' | 'partial' | 'pending'>('full');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Pre-fill school when opening
  useEffect(() => {
    if (isNewOrderOpen && schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(schools[0].id);
      setSelectedClassId(schools[0].classes[0] || 'Class 5');
    }
  }, [isNewOrderOpen, schools, selectedSchoolId]);

  // Update selected class if school changes
  const currentSchool = schools.find((s) => s.id === selectedSchoolId);

  useEffect(() => {
    if (currentSchool && !currentSchool.classes.includes(selectedClassId)) {
      setSelectedClassId(currentSchool.classes[0] || '');
    }
  }, [currentSchool, selectedClassId]);

  // Load mapped books and stationery when school and class are selected
  useEffect(() => {
    if (!currentSchool || !selectedClassId) return;

    // Prescribed books for this school & class
    const mappedBooks = currentSchool.bookMappings
      .filter((m) => m.classId === selectedClassId)
      .map((m) => m.bookId);
    setSelectedBookIds(mappedBooks);

    // Prescribed stationery
    const initialStat: Record<string, number> = {};
    currentSchool.stationeryMappings
      .filter((m) => m.classId === selectedClassId)
      .forEach((m) => {
        initialStat[m.stationeryId] = m.defaultQuantity;
      });
    setSelectedStationeryItems(initialStat);
  }, [currentSchool, selectedClassId]);

  if (!isNewOrderOpen) return null;

  // Existing students filtered by school
  const schoolStudents = students.filter((st) => st.schoolId === selectedSchoolId);

  const handleSelectExistingStudent = (stuId: string) => {
    setSelectedStudentId(stuId);
    const stu = students.find((s) => s.id === stuId);
    if (stu) {
      setStudentName(stu.name);
      setParentName(stu.parentName || '');
      setPhone(stu.phone);
      setEmail(stu.email || '');
      setAddress(stu.address || '');
      if (stu.classId && currentSchool?.classes.includes(stu.classId)) {
        setSelectedClassId(stu.classId);
      }
    }
  };

  // Calculate items and totals
  const orderItems: OrderItem[] = [];

  // Books
  selectedBookIds.forEach((bId) => {
    const book = books.find((b) => b.id === bId);
    if (book) {
      orderItems.push({
        id: `ord-item-${book.id}`,
        type: 'book',
        itemId: book.id,
        name: book.name,
        publisherOrCategory: book.publisherName,
        classOrSpec: book.applicableClass,
        unitPrice: book.sellingPrice,
        quantity: 1,
        total: book.sellingPrice,
      });
    }
  });

  // Stationery
  Object.entries(selectedStationeryItems).forEach(([sId, qty]) => {
    if (qty > 0) {
      const item = stationery.find((s) => s.id === sId);
      if (item) {
        orderItems.push({
          id: `ord-item-${item.id}`,
          type: 'stationery',
          itemId: item.id,
          name: item.name,
          publisherOrCategory: item.category,
          unitPrice: item.sellingPrice,
          quantity: qty,
          total: item.sellingPrice * qty,
        });
      }
    }
  });

  const subtotal = orderItems.reduce((acc, i) => acc + i.total, 0);
  const total = Math.max(0, subtotal - discountAmount);

  // Payment amounts
  let paidAmount = 0;
  if (paymentChoice === 'full') {
    paidAmount = total;
  } else if (paymentChoice === 'partial') {
    paidAmount = Math.min(total, Number(partialAmount) || 0);
  } else {
    paidAmount = 0;
  }
  const remainingAmount = Math.max(0, total - paidAmount);
  const paymentStatus: PaymentStatus =
    paidAmount >= total ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';

  const handleCompleteOrder = async () => {
    if (!studentName || !phone || !currentSchool) return;

    const initialPayments = paidAmount > 0 ? [
      {
        id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        amount: paidAmount,
        method: paymentMethod,
        note: paymentNote || `Initial payment via ${paymentMethod} (${source})`,
        collectedBy: currentUser.name,
      }
    ] : [];

    const created = await createOrder({
      schoolId: currentSchool.id,
      schoolName: currentSchool.name,
      classId: selectedClassId,
      studentId: selectedStudentId || undefined,
      studentName: studentName.trim(),
      parentName: parentName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      source,
      createdBy: currentUser.name,
      items: orderItems,
      subtotal,
      discount: discountAmount,
      total,
      paidAmount,
      remainingAmount,
      paymentStatus,
      orderStatus: 'Confirmed',
      payments: initialPayments,
      pickupOrDelivery,
      notes: `Order created at ${source} by ${currentUser.name}`,
    });

    setIsNewOrderOpen(false);
    setSelectedOrderForReceipt(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80 shrink-0">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Create New Order (POS & Dispatch)
            </h3>
            <p className="text-xs text-neutral-500">
              Step {step} of 3 · Unified sales terminal for Store, Stall, and Staff
            </p>
          </div>
          <button
            onClick={() => setIsNewOrderOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center border-b border-neutral-200 bg-white px-6 py-2.5 text-xs font-medium shrink-0">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 ${
              step >= 1 ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>1</span>
            <span>School & Student</span>
          </button>
          <ChevronRight className="w-4 h-4 text-neutral-300 mx-3" />
          <button
            onClick={() => {
              if (studentName && phone) setStep(2);
            }}
            className={`flex items-center gap-1.5 ${
              step >= 2 ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>2</span>
            <span>Books & Stationery ({orderItems.length})</span>
          </button>
          <ChevronRight className="w-4 h-4 text-neutral-300 mx-3" />
          <button
            onClick={() => {
              if (studentName && phone && orderItems.length > 0) setStep(3);
            }}
            className={`flex items-center gap-1.5 ${
              step >= 3 ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}>3</span>
            <span>Payment & Confirmation</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Context & Student Info */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              {/* Channel Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1.5">
                  Order Sales Channel *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Store', 'Stall', 'Employee', 'Partner'] as OrderSource[]).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSource(src)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        source === src
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {src} Counter
                    </button>
                  ))}
                </div>
              </div>

              {/* School and Class Selector */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Select School *
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-neutral-900"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Select Grade / Class *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-neutral-900"
                  >
                    {currentSchool?.classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Lookup Mode */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <span className="font-semibold text-neutral-800">Student & Parent Details</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentMode('new')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                        studentMode === 'new' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      New Student
                    </button>
                    {schoolStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setStudentMode('existing')}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                          studentMode === 'existing' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        Pick Existing ({schoolStudents.length})
                      </button>
                    )}
                  </div>
                </div>

                {studentMode === 'existing' && schoolStudents.length > 0 && (
                  <div className="mt-3">
                    <label className="block font-medium text-neutral-600 mb-1">
                      Choose from Registered Students
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleSelectExistingStudent(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="">-- Select Student --</option>
                      {schoolStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} (Parent: {st.parentName || 'N/A'} · Ph: {st.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alok Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Delivery / Pickup Preference</label>
                    <select
                      value={pickupOrDelivery}
                      onChange={(e) => setPickupOrDelivery(e.target.value as any)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="Store Pickup">Store Pickup</option>
                      <option value="Stall Pickup">School Stall Pickup</option>
                      <option value="School Desk">Direct Classroom Handover</option>
                      <option value="Home Delivery">Courier / Home Delivery</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Books and Stationery Selection */}
          {step === 2 && (
            <div className="space-y-5 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{currentSchool?.name} — {selectedClassId}</p>
                  <p className="text-[11px] text-neutral-500">Student: {studentName} ({phone})</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-500 block">Subtotal</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-neutral-900">
                    {businessProfile.currencySymbol}{subtotal}
                  </span>
                </div>
              </div>

              {/* Books Selection */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <h4 className="font-bold text-neutral-900">Prescribed School Textbooks</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const classBooks = currentSchool?.bookMappings
                        .filter((m) => m.classId === selectedClassId)
                        .map((m) => m.bookId) || [];
                      setSelectedBookIds(classBooks);
                    }}
                    className="text-xs font-semibold text-neutral-900 hover:underline"
                  >
                    Select All Books
                  </button>
                </div>

                <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {currentSchool?.bookMappings
                    .filter((m) => m.classId === selectedClassId)
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
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isSelected ? 'bg-white text-neutral-900 border-white' : 'border-neutral-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <p className="font-semibold">{book.name}</p>
                              <p className={`text-[11px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                {book.subject} · {book.publisherName} (Stock: {book.currentStock})
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold tabular-nums">
                            {businessProfile.currencySymbol}{book.sellingPrice}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Stationery Selection */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <h4 className="font-bold text-neutral-900">Stationery Supplies & Notebooks</h4>
                </div>

                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentSchool?.stationeryMappings
                    .filter((m) => m.classId === selectedClassId)
                    .map((m) => {
                      const item = stationery.find((s) => s.id === m.stationeryId);
                      if (!item) return null;
                      const currentQty = selectedStationeryItems[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-white"
                        >
                          <div>
                            <p className="font-semibold text-neutral-900">{item.name}</p>
                            <p className="text-[11px] text-neutral-500">
                              {item.category} · {businessProfile.currencySymbol}{item.sellingPrice} per {item.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-neutral-300 rounded-md overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedStationeryItems((prev) => ({
                                    ...prev,
                                    [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                                  }))
                                }
                                className="px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                              >
                                -
                              </button>
                              <span className="px-2 py-1 font-mono font-semibold text-xs tabular-nums min-w-6 text-center">
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
                                className="px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-mono font-bold text-neutral-900 tabular-nums min-w-14 text-right">
                              {businessProfile.currencySymbol}{item.sellingPrice * currentQty}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Discount Input */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-200">
                <span className="font-medium text-neutral-700">Special Concession / Discount ({businessProfile.currencySymbol})</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  placeholder="0"
                  onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-28 px-3 py-1 text-xs border border-neutral-300 rounded-md font-mono text-right"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Payment & Summary */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              {/* Order Bill Summary */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex justify-between text-neutral-600">
                  <span>Gross Items Subtotal ({orderItems.length} items)</span>
                  <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied</span>
                    <span className="font-mono tabular-nums">-{businessProfile.currencySymbol}{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-neutral-950 pt-2 border-t border-neutral-200">
                  <span>Total Payable</span>
                  <span className="font-mono tabular-nums">{businessProfile.currencySymbol}{total}</span>
                </div>
              </div>

              {/* Payment Mode Options (Section 12 & 15) */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1.5">
                  Payment Collection Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('full')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      paymentChoice === 'full'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="font-bold">Full Payment</p>
                    <p className={`text-[10px] ${paymentChoice === 'full' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Pay {businessProfile.currencySymbol}{total} upfront
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentChoice('partial');
                      if (!partialAmount) setPartialAmount(String(Math.floor(total / 2)));
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      paymentChoice === 'partial'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="font-bold">Partial Deposit</p>
                    <p className={`text-[10px] ${paymentChoice === 'partial' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Advance now, balance later
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('pending')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      paymentChoice === 'pending'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="font-bold">Payment Pending</p>
                    <p className={`text-[10px] ${paymentChoice === 'pending' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Collect on pickup / stall
                    </p>
                  </button>
                </div>
              </div>

              {/* Partial Amount Input if selected */}
              {paymentChoice === 'partial' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div>
                    <label className="block font-semibold text-amber-950 mb-0.5">
                      Advance Amount Paid Now ({businessProfile.currencySymbol})
                    </label>
                    <p className="text-[11px] text-amber-800">
                      Remaining balance due: <strong className="font-mono">{businessProfile.currencySymbol}{remainingAmount}</strong>
                    </p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={total}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="w-32 px-3 py-1.5 border border-amber-300 rounded-lg bg-white font-mono font-bold text-sm text-right"
                  />
                </div>
              )}

              {/* Payment Method Selector if paying money */}
              {paidAmount > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="Cash">Cash at Counter</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Card">Card Swipe (POS)</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Other">Other Mode</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Payment Reference / Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI Ref # or cash received"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-100"
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={() => setIsNewOrderOpen(false)}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-100"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              disabled={step === 1 ? !studentName || !phone : orderItems.length === 0}
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 px-5 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteOrder}
              className="flex items-center gap-1.5 px-5 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Order & Generate Invoice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
