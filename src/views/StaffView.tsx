import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StaffPartner, UserRole } from '../types';
import {
  Users,
  Shield,
  Plus,
  UserCheck,
  Check,
  X as CloseIcon,
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { staff, addStaff, currentUser, setCurrentUser, schools, businessProfile } = useApp();

  const [activeTab, setActiveTab] = useState<'staff' | 'permissions'>('staff');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'Employee' | 'Partner'>('Employee');
  const [role, setRole] = useState<UserRole>('Employee');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [assignedCodes, setAssignedCodes] = useState<string[]>([]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    await addStaff({
      name: name.trim(),
      type,
      role: type === 'Partner' ? 'Partner' : role,
      phone: phone.trim(),
      email: email.trim(),
      assignedSchoolCodes: assignedCodes,
      status: 'Active',
      ordersCount: 0,
      totalSales: 0,
    });

    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setAssignedCodes([]);
  };

  // Permission Table (Section 27 Matrix)
  const permissionsData = [
    { feature: 'Dashboard Overview', admin: 'Full', manager: 'Full', employee: 'Full', partner: 'Full' },
    { feature: 'Schools Management', admin: 'Full CRUD', manager: 'Full CRUD', employee: 'View / Edit', partner: 'Assigned Only' },
    { feature: 'Books & Stationery Master', admin: 'Full CRUD', manager: 'Full CRUD', employee: 'Full CRUD', partner: 'Read-Only' },
    { feature: 'Inventory Control', admin: 'Full CRUD', manager: 'Full CRUD', employee: 'Adjustments', partner: 'Stock View' },
    { feature: 'Order Processing', admin: 'Full Control', manager: 'Full Control', employee: 'Create / Dispatch', partner: 'Assigned Counter' },
    { feature: 'Payment Collection', admin: 'Full Access', manager: 'Full Access', employee: 'Counter POS', partner: 'Stall Dues Only' },
    { feature: 'Publishers & PO Procurement', admin: 'Full CRUD', manager: 'Full CRUD', employee: 'No Access', partner: 'No Access' },
    { feature: 'Business Analytics & Reports', admin: 'All Reports', manager: 'All Reports', employee: 'Sales Only', partner: 'Performance Only' },
    { feature: 'Staff & Role Assignment', admin: 'Full Admin', manager: 'No Access', employee: 'No Access', partner: 'No Access' },
    { feature: 'System & Profile Settings', admin: 'Full Admin', manager: 'No Access', employee: 'No Access', partner: 'No Access' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Staff & Partner Network
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage store employees, stall vendors, and role-based permissions (Section 27)
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Staff or Partner</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 w-fit text-xs font-medium">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3.5 py-1.5 rounded-md transition-colors ${
            activeTab === 'staff'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Team Directory ({staff.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-3.5 py-1.5 rounded-md transition-colors ${
            activeTab === 'permissions'
              ? 'bg-white text-neutral-900 shadow-xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Role Permission Matrix
        </button>
      </div>

      {/* TAB 1: Team Directory */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map((member) => {
            const isCurrent = currentUser.id === member.id;
            return (
              <div
                key={member.id}
                className={`p-5 bg-white rounded-xl border shadow-xs transition-colors flex flex-col justify-between ${
                  isCurrent ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-neutral-400 block">{member.id}</span>
                      <h3 className="text-base font-bold text-neutral-900 mt-0.5">{member.name}</h3>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">
                        {member.type} · {member.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentUser(member)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          isCurrent
                            ? 'bg-neutral-900 text-white font-semibold'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Active User</span>
                          </>
                        ) : (
                          <span>Switch to User</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-600 space-y-1">
                    <p>Phone: <span className="font-mono">{member.phone}</span></p>
                    <p>Email: {member.email}</p>
                    <div>
                      <span className="text-neutral-500 block text-[11px] mt-2 mb-1 font-semibold uppercase">
                        Assigned Schools:
                      </span>
                      {member.assignedSchoolCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.assignedSchoolCodes.map((code) => {
                            const sc = schools.find((s) => s.code === code);
                            return (
                              <span
                                key={code}
                                className="px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded font-mono text-[11px]"
                              >
                                {code} ({sc?.name.split(' ')[0] || 'School'})
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">All dealership branches</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500">Orders Handled</span>
                    <span className="font-mono font-bold text-neutral-900 ml-1.5">{member.ordersCount}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Sales Volume</span>
                    <span className="font-mono font-bold text-neutral-900 ml-1.5">
                      {businessProfile.currencySymbol}{(member.totalSales || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Permission Matrix (Section 27) */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900">Role-Based Access Control (RBAC) Governance</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enforced permissions across Super Admin, Store Manager, Field Employee, and School Stall Partners
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/75 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Functional Feature</th>
                  <th className="py-3 px-4 font-semibold text-center">Super Admin</th>
                  <th className="py-3 px-4 font-semibold text-center">Manager</th>
                  <th className="py-3 px-4 font-semibold text-center">Employee</th>
                  <th className="py-3 px-4 font-semibold text-center">Partner (Stall)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {permissionsData.map((perm) => (
                  <tr key={perm.feature} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-4 font-medium text-neutral-900">{perm.feature}</td>
                    <td className="py-3 px-4 text-center font-medium text-emerald-700 bg-emerald-50/30">
                      ✓ {perm.admin}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-neutral-800">
                      {perm.manager.includes('No') ? <span className="text-rose-600">✗ {perm.manager}</span> : `✓ ${perm.manager}`}
                    </td>
                    <td className="py-3 px-4 text-center text-neutral-700">
                      {perm.employee.includes('No') ? <span className="text-rose-600">✗ {perm.employee}</span> : perm.employee}
                    </td>
                    <td className="py-3 px-4 text-center text-neutral-700">
                      {perm.partner.includes('No') ? <span className="text-rose-600">✗ {perm.partner}</span> : perm.partner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">Add Staff Member or Partner</h3>
              <button onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStaff} className="p-6 space-y-3.5">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Affiliation</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const t = e.target.value as 'Employee' | 'Partner';
                      setType(t);
                      if (t === 'Partner') setRole('Partner');
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Employee">Internal Employee</option>
                    <option value="Partner">External Stall Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Access Role</label>
                  <select
                    value={role}
                    disabled={type === 'Partner'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white disabled:bg-neutral-100"
                  >
                    <option value="Employee">Staff Employee</option>
                    <option value="Manager">Store Manager</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone *</label>
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
                  <label className="block font-semibold text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staff@dealer.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Assign to School Codes (Hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  multiple
                  value={assignedCodes}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setAssignedCodes(selected);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg h-24 bg-white font-mono"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
