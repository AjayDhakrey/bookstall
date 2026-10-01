import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StaffPartner, UserRole } from '../types';
import {
  ShieldCheck,
  LogIn,
  X,
  User,
  Monitor,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, staff, currentUser, loginUser, isLoading } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentUser.id || 'STF-01');
  const [terminal, setTerminal] = useState<string>('Central Admin Workstation 01');
  const [password, setPassword] = useState<string>('••••••••');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAuthModalOpen(false);
      }
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const selectedStaffMember = staff.find((s) => s.id === selectedStaffId) || staff[0];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffMember) return;

    try {
      setIsSubmitting(true);
      await loginUser(selectedStaffMember.email, terminal, 'Password');
      setIsAuthModalOpen(false);
    } catch (err) {
      // error handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Store Manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Field Employee':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Campus Partner':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
      onClick={() => setIsAuthModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 cursor-default animate-fade-in p-6 sm:p-7 space-y-6 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">User Login & Role Switch</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Authenticate with an authorized role and log session access into the security audit ledger
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {/* Select User Role Profile Card */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Select Login Account / Role Profile:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {staff.map((member) => {
                const isSelected = selectedStaffId === member.id;
                const isCurrent = currentUser.id === member.id;

                return (
                  <div
                    key={member.id}
                    onClick={() => {
                      setSelectedStaffId(member.id);
                      if (member.role === 'Campus Partner') {
                        setTerminal('School Stall Counter DPS01');
                      } else if (member.role === 'Store Manager') {
                        setTerminal('Store Manager Terminal POS-01');
                      } else if (member.role === 'Field Employee') {
                        setTerminal('Field Dispatch Handheld-03');
                      } else {
                        setTerminal('Central Admin Workstation 01');
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(member.role)}`}>
                        {member.role}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Logged In
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 mt-2 text-xs">{member.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{member.email}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Access Station / Terminal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Access Station / Terminal *
              </label>
              <select
                value={terminal}
                onChange={(e) => setTerminal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="Central Admin Workstation 01">Central Admin Workstation 01 (HQ)</option>
                <option value="Store Manager Terminal POS-01">Store Manager Terminal POS-01 (Store)</option>
                <option value="School Stall Counter DPS01">School Stall Counter DPS01 (Campus)</option>
                <option value="Field Dispatch Handheld-03">Field Dispatch Handheld-03 (Mobile)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Security Password / PIN *
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  placeholder="Enter user password..."
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Each login is verified with session credentials and permanently written to the backend audit log (`/api/auth/logs`) with timestamp, station name, and network footprint.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all card-3d-press"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : `Log In as ${selectedStaffMember.name.split(' ')[0]}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
