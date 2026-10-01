import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  Search,
  School,
  Globe,
  QrCode,
} from 'lucide-react';

export const PublicLinksView: React.FC = () => {
  const {
    schools,
    updateSchool,
    setPublicSelectedSchoolCode,
    setPublicPortalOpen,
  } = useApp();

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyLink = (code: string, id: string) => {
    const url = `${window.location.origin}/?school=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLaunchPublicPortal = (code?: string) => {
    setPublicSelectedSchoolCode(code || null);
    setPublicPortalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Public Parent Ordering Links
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Share school-specific links with parent WhatsApp groups and school websites (Section 16-21)
          </p>
        </div>
        <button
          onClick={() => handleLaunchPublicPortal()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          <Globe className="w-4 h-4" />
          <span>Open Main Public Directory</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-blue-950">How Public Links Work for Parents & Students</p>
          <p className="mt-0.5 text-blue-800 leading-relaxed">
            No login is required for parents. Opening a school link or searching the public directory allows parents to pick their child's grade, view official books and stationery bundles, fill their child's name, choose pickup or delivery, and place their order directly into your dealer back-office.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school name, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50"
          />
        </div>
        <span className="text-xs text-neutral-500 hidden sm:inline">
          {filteredSchools.length} School Portals Configured
        </span>
      </div>

      {/* School Public Link Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSchools.map((school) => {
          const isCopied = copiedId === school.id;
          const url = `${window.location.origin}/?school=${school.code}`;

          return (
            <div
              key={school.id}
              className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                      {school.code}
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 mt-1">{school.name}</h3>
                    <p className="text-xs text-neutral-500">{school.city} · {school.classes.length} Grades Listed</p>
                  </div>

                  <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={school.publicOrderingEnabled}
                      onChange={(e) =>
                        updateSchool(school.id, { publicOrderingEnabled: e.target.checked })
                      }
                      className="rounded text-neutral-900"
                    />
                    <span>{school.publicOrderingEnabled ? 'Active' : 'Disabled'}</span>
                  </label>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Direct Parent Order URL:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={url}
                      className="flex-1 px-2.5 py-1.5 text-[11px] font-mono bg-neutral-50 border border-neutral-200 rounded text-neutral-700"
                    />
                    <button
                      onClick={() => handleCopyLink(school.code, school.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors shrink-0 flex items-center gap-1"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  Assigned Partner: {school.assignedPartnerName || 'Main Store'}
                </span>
                <button
                  onClick={() => handleLaunchPublicPortal(school.code)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>Launch Parent Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
