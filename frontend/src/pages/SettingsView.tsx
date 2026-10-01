import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useDatabaseStatus } from '../hooks/useDatabaseStatus';
import { BusinessProfile } from '../types';
import {
  Settings,
  Building,
  CheckCircle2,
  Save,
  Server,
  RefreshCw,
  Database,
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { status: databaseStatus, error: databaseError } = useDatabaseStatus();
  const {
    businessProfile,
    updateBusinessProfile,
    refreshData,
    isLoading,
    backupDatabase,
    restoreDatabase,
    resetDatabaseDefaults,
    exportToCSV,
    books,
    orders,
    schools,
  } = useApp();

  const [form, setForm] = useState<BusinessProfile>({ ...businessProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'database' | 'exports'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await restoreDatabase(file);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Dealership & System Settings
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              Market Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dealership entity, tax GSTIN, printable billing profile, and database backup/migration utilities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Dealership configuration saved to backend successfully!</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Dealership Profile & Tax</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'database'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Backup</span>
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'exports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Data Exporters (CSV)</span>
        </button>
      </div>

      {/* TAB 1: DEALERSHIP PROFILE & TAX */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 text-xs"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Enterprise Dealership Profile</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  These details appear on official parent invoices, thermal receipts, and purchase orders
                </p>
              </div>
              <Building className="w-5 h-5 text-slate-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Company / Dealership Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Business Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Warehouse & Store Address
                </label>
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
                <input
                  type="text"
                  value={form.receiptFooter || ''}
                  placeholder="e.g. Please preserve receipt for exchange within 7 days."
                  onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm card-3d-press"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile to Server</span>
              </button>
            </div>
          </form>

          {/* Printable Invoice Header Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-600" />
                <span>Printable Receipt Header Preview</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Live Template</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center max-w-sm mx-auto shadow-2xs font-mono text-[11px]">
              <p className="font-bold text-sm text-slate-900">{form.businessName || 'Dealership Name'}</p>
              <p className="text-[10px] text-slate-500">{form.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1">{form.address}</p>
              <p className="text-[10px] text-slate-500">Ph: {form.phone} | GSTIN: {form.gstin}</p>
              <div className="border-t border-dashed border-slate-300 my-2" />
              <p className="text-[10px] text-slate-400">TAX INVOICE / RETAIL RECEIPT</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATABASE READY & BACKUP */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Architecture Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Data Storage</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Check where your business data is saved and manage backups below
                </p>
              </div>
              <Database className="w-5 h-5 text-blue-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80">
                <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Current Storage Engine</span>
                <p className="text-xs font-bold text-blue-950 mt-1">{databaseError ? 'Unavailable' : databaseStatus ? (databaseStatus.persistent ? 'Supabase PostgreSQL' : 'Memory (demo)') : 'Checking...'}</p>
                <p className="text-[10px] text-blue-700/80 mt-0.5">{databaseError ? 'Unable to check database connection' : databaseStatus?.persistent ? 'Changes stay saved when the server restarts' : databaseStatus ? 'Changes reset when the server restarts' : 'Loading storage status'}</p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">Save Protection</span>
                <p className="text-xs font-bold text-emerald-950 mt-1">Complete updates</p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">Orders and their stock changes save together</p>
              </div>

              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80">
                <span className="text-[10px] uppercase tracking-wider text-purple-600 font-bold">Backup Format</span>
                <p className="text-xs font-bold text-purple-950 mt-1">JSON backup</p>
                <p className="text-[10px] text-purple-700/80 mt-0.5">Export and restore your business data below</p>
              </div>
            </div>
          </div>

          {/* Backup & Restore Tools */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Database Backup & Disaster Recovery</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Export and import complete snapshots of all schools, book catalogues, inventory records, sales orders, and audit logs
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Export Full Backup */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-900">Download Complete JSON Backup</h4>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Saves an exact snapshot of the entire ERP state to a secure JSON file for local backup or database migration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={backupDatabase}
                  disabled={isLoading}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup File (.json)</span>
                </button>
              </div>

              {/* Restore From Backup */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900">Restore / Import Database</h4>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Upload a previously exported JSON backup file to restore the entire catalog, stock, and orders.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-all shadow-xs"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload & Restore Backup (.json)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reset to Factory Showroom Demo Data */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">Factory Showroom Benchmark Reset</p>
                <p className="text-slate-500 text-[11px]">
                  Resets all stores, schools, prescribed booksets, and realistic orders back to clean demo benchmark data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Factory Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CSV DATA EXPORTERS */}
      {activeTab === 'exports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Master Data Spreadsheets (CSV)</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Export structured, spreadsheet-compatible CSV files for accounting, inventory audits, and school reporting
                </p>
              </div>
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* 1. Inventory Register */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-amber-100 text-amber-900 uppercase">
                    Warehouse Master
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Inventory Stock Ledger</h4>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Complete list of books and stationery with ISBNs, current stock levels, safety thresholds, purchase costs, and MRP.
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 mt-2">
                    {books.length} Books · Valuation calculated
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportToCSV('inventory')}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-all shadow-xs"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Download Inventory CSV</span>
                </button>
              </div>

              {/* 2. Sales Orders Register */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-900 uppercase">
                    Sales Register
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Orders & Revenue Ledger</h4>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Detailed record of all sales orders, student names, phone numbers, school codes, GST tax amounts, and payment statuses.
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 mt-2">
                    {orders.length} Orders recorded
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportToCSV('orders')}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-all shadow-xs"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Orders CSV</span>
                </button>
              </div>

              {/* 3. School Catalogues */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-sky-100 text-sky-900 uppercase">
                    Curriculum Master
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">School Catalogues</h4>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Directory of partner schools, affiliation boards, student enrollments, and prescribed book and stationery lists.
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 mt-2">
                    {schools.length} Schools registered
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportToCSV('schools')}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-all shadow-xs"
                >
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>Download Schools CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Demo Data */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Reset to Factory Demo Data?</h3>
            </div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              This will reset all schools, books, inventory quantities, and orders back to the default benchmark showroom data.
              Any custom records added during testing will be replaced.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsResetConfirmOpen(false);
                  await resetDatabaseDefaults();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
