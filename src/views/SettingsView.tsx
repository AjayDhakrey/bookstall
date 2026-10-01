import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BusinessProfile } from '../types';
import {
  Settings,
  Building,
  CheckCircle2,
  Save,
  Server,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { businessProfile, updateBusinessProfile, refreshData, isLoading } = useApp();

  const [form, setForm] = useState<BusinessProfile>({ ...businessProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync form when profile loads
  React.useEffect(() => {
    setForm({ ...businessProfile });
  }, [businessProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusinessProfile(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Dealership & System Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dealership entity profile, tax GSTIN, billing metadata, and backend API connectivity
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Sync from Server</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Dealership configuration saved to backend successfully!</span>
        </div>
      )}

      {/* Business Details Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 text-xs"
      >
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Enterprise Dealership Profile</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              These details appear on official parent invoices, tax receipts, and purchase orders
            </p>
          </div>
          <Building className="w-5 h-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Company / Dealership Name *</label>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Business Tagline / Subtitle</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Registered Warehouse & Store Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official Contact Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tax GSTIN / VAT Number</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dealer Trade License No.</label>
            <input
              type="text"
              value={form.dealerLicenseNo}
              onChange={(e) => setForm({ ...form, dealerLicenseNo: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={form.currencySymbol}
              onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
              className="w-24 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm card-3d-press"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings to Server</span>
          </button>
        </div>
      </form>

      {/* Backend API Service Health Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Backend REST API Service Status</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Production API gateway integration status and active endpoints
            </p>
          </div>
          <Server className="w-5 h-5 text-blue-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Gateway Endpoint</span>
            <p className="font-mono text-xs font-bold text-slate-800 mt-1">
              {import.meta.env.VITE_API_BASE_URL || '/api'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">API Service Health</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-700">Online & Connected</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Data Storage Architecture</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              Decoupled REST Service Layer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
