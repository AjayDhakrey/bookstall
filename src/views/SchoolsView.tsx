import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { School, StaffPartner } from '../types';
import {
  Search,
  Plus,
  School as SchoolIcon,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Users,
  Copy,
  Check,
  LayoutGrid,
  List,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { SchoolDetailModal } from './SchoolDetailModal';

export const SchoolsView: React.FC = () => {
  const {
    schools,
    orders,
    addSchool,
    staff,
    selectedSchoolForDetail,
    setSelectedSchoolForDetail,
    businessProfile,
    setPublicSelectedSchoolCode,
    setPublicPortalOpen,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New School Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [classesInput, setClassesInput] = useState(
    'Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10'
  );
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [assignedPartnerId, setAssignedPartnerId] = useState('');
  const [publicOrderingEnabled, setPublicOrderingEnabled] = useState(true);

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(search.toLowerCase()) ||
      school.code.toLowerCase().includes(search.toLowerCase()) ||
      school.city.toLowerCase().includes(search.toLowerCase()) ||
      school.contactPerson.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || school.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalSchoolOrders = orders.length;
  const totalSchoolRevenue = orders.reduce((acc, o) => acc + o.total, 0);

  const handleCopyLink = (schoolCode: string) => {
    const url = `${window.location.origin}/?school=${schoolCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(schoolCode);
    showToast(`Parent order link for ${schoolCode} copied!`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const classList = classesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const emp = staff.find((s) => s.id === assignedEmployeeId);
    const ptr = staff.find((s) => s.id === assignedPartnerId);

    const created = await addSchool({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim(),
      city: city.trim() || 'Central City',
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      status: 'Active',
      classes:
        classList.length > 0
          ? classList
          : ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
      assignedEmployeeId: emp?.id,
      assignedEmployeeName: emp?.name,
      assignedPartnerId: ptr?.id,
      assignedPartnerName: ptr?.name,
      publicOrderingEnabled,
      expectedStudentsPerClass: {
        'Class 5': 100,
        'Class 6': 100,
      },
      bookMappings: [],
      stationeryMappings: [],
    });

    setIsAddModalOpen(false);
    showToast(`School ${created.name} added successfully`, 'success');

    // Reset form
    setName('');
    setCode('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setSelectedSchoolForDetail(created);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Schools Directory & Syllabus Portfolios
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescribed booklists, syllabus mappings, campus stall reps, and direct parent portal links
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-auto card-3d-press"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New School</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Affiliated Campuses</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {schools.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {schools.filter((s) => s.status === 'Active').length} active partnerships
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Parent Portal Active</span>
          <p className="text-2xl font-bold font-mono text-blue-600 mt-1 tabular-nums">
            {schools.filter((s) => s.publicOrderingEnabled).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">public ordering enabled</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Total Orders Fulfilled</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {totalSchoolOrders}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">student kit orders</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs card-lift">
          <span className="text-xs text-slate-500 font-medium">Gross School Sales</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {businessProfile.currencySymbol}{totalSchoolRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">across all dealer channels</p>
        </div>
      </div>

      {/* 3. Search, Filter Bar & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school name, code (e.g. ABC01), city..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-slate-50/60"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            {(['All', 'Active', 'Inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Grid vs Table Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Schools Display: Grid Cards Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No registered schools found matching "{search}".
            </div>
          ) : (
            filteredSchools.map((school) => {
              const schoolOrders = orders.filter((o) => o.schoolId === school.id);
              const sales = schoolOrders.reduce((acc, o) => acc + o.total, 0);
              const isCopied = copiedCode === school.code;

              return (
                <div
                  key={school.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-400 card-lift flex flex-col justify-between"
                >
                  <div>
                    {/* Top School Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 inline-block mb-1">
                          {school.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                          {school.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {school.city} · Contact: {school.contactPerson}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          school.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {school.status}
                      </span>
                    </div>

                    {/* School Metrics & Mapping Counts */}
                    <div className="grid grid-cols-3 gap-2 py-3.5 my-3.5 border-y border-slate-100 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Grades</p>
                        <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                          {school.classes.length}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Orders</p>
                        <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                          {schoolOrders.length}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Revenue</p>
                        <p className="font-mono font-bold text-blue-700 text-sm mt-0.5 tabular-nums">
                          {businessProfile.currencySymbol}{sales.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <p className="truncate">
                        <strong className="text-slate-700">Assigned Staff:</strong>{' '}
                        {school.assignedEmployeeName || 'Head Office'}
                      </p>
                      <p className="truncate">
                        <strong className="text-slate-700">Campus Stall:</strong>{' '}
                        {school.assignedPartnerName || 'Central Dealer Store'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyLink(school.code)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                      title="Copy Direct Parent URL"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedSchoolForDetail(school)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
                    >
                      <span>Manage Syllabus</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* 4. Schools Display: Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3 px-4">School & City</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Grades</th>
                  <th className="py-3 px-4">Assigned Partner / Staff</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Gross Sales</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((school) => {
                  const schoolOrders = orders.filter((o) => o.schoolId === school.id);
                  const sales = schoolOrders.reduce((acc, o) => acc + o.total, 0);

                  return (
                    <tr
                      key={school.id}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      onClick={() => setSelectedSchoolForDetail(school)}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{school.name}</p>
                        <p className="text-[11px] text-slate-500">{school.city}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {school.code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {school.classes.length} classes
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {school.assignedPartnerName || school.assignedEmployeeName || 'Main Store'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums text-slate-900">
                        {schoolOrders.length}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        {businessProfile.currencySymbol}{sales.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            school.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {school.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-blue-600 hover:text-blue-800 font-semibold text-xs">
                          Configure →
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

      {/* School Detail Modal */}
      {selectedSchoolForDetail && (
        <SchoolDetailModal
          school={selectedSchoolForDetail}
          onClose={() => setSelectedSchoolForDetail(null)}
        />
      )}

      {/* Add New School Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add New School Campus</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">
                    School Unique Code * (e.g. ABC01)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STX01"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">School Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. St. Xavier Senior Secondary School"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Campus Address</label>
                  <input
                    type="text"
                    placeholder="Street, Landmark, Postal Code"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Officer Name</label>
                  <input
                    type="text"
                    placeholder="Principal / Academic Coordinator"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Offered Classes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={classesInput}
                    onChange={(e) => setClassesInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs card-3d-press"
                >
                  Create School & Configure Books
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
