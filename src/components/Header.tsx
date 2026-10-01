import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Plus,
  ExternalLink,
  Shield,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Workflow,
  X,
  Menu,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { BusinessFlowDiagram } from './BusinessFlowDiagram';

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    staff,
    setIsNewOrderOpen,
    setPublicPortalOpen,
    setPublicSelectedSchoolCode,
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    setIsAuthModalOpen,
    setIsLoginPageOpen,
    logoutUser,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview';
      case 'schools':
        return 'Schools Directory';
      case 'products':
        return 'Product Catalog';
      case 'inventory':
        return 'Inventory & Stock';
      case 'orders':
        return 'Orders & Dispatches';
      case 'school-requirement':
        return 'Requirement & POs';
      case 'payments':
        return 'Financials & Dues';
      case 'staff':
        return 'Staff & Partners';
      case 'reports':
        return 'Analytics & Reports';
      case 'login-logs':
        return 'Login & Audit Logs';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white border-b border-neutral-200 shadow-xs">
        {/* Zone 1: Mobile Hamburger + Brand Name & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Hamburger toggle button for Mobile/Tablet */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-neutral-700" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 truncate">
              Vanguard
            </span>
            <span className="text-neutral-300 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-blue-600 hidden sm:inline truncate">
              {getBreadcrumbTitle()}
            </span>
          </div>
        </div>

        {/* Zone 2: Global Search Trigger Bar */}
        <div className="hidden xl:flex items-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 text-xs text-neutral-500 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg border border-neutral-200/80 transition-colors w-72"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-left flex-1 truncate">Search schools, books, orders...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-neutral-400 rounded border border-neutral-200">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Zone 3: Actions (Mobile Search, Flow Map, Public Portal, New Order, Role) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="xl:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Business Flow Pipeline Map */}
          <button
            onClick={() => setIsFlowModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-300 transition-colors whitespace-nowrap min-h-[38px]"
            title="Inspect Application Architecture & Pipeline Flow"
          >
            <Workflow className="w-3.5 h-3.5 text-blue-600" />
            <span>App Flow Map</span>
          </button>

          {/* Public Portal Switcher */}
          <button
            onClick={() => {
              setPublicSelectedSchoolCode(null);
              setPublicPortalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors whitespace-nowrap min-h-[38px]"
            title="Open Parent Public Order Portal"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Public Portal</span>
          </button>

          {/* Quick Create Order Button (Blue High-Intent CTA) */}
          <button
            onClick={() => setIsNewOrderOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>

          {/* Role simulation dropdown (Super Admin, Manager, Employee, Partner) */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 p-1.5 sm:pr-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-xs text-left min-h-[38px]"
              title="Current User Profile & Role Simulation"
            >
              <div className="w-6 h-6 rounded-md bg-neutral-900 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block">
                <p className="font-semibold text-neutral-900 leading-none truncate max-w-24">
                  {currentUser.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-blue-600 font-mono mt-0.5">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
            </button>

            {isRoleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 animate-fade-in text-xs"
                onClick={() => setIsRoleDropdownOpen(false)}
              >
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active User Session
                    </p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                  <span className="inline-block px-2 py-0.5 mt-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                    {currentUser.role}
                  </span>
                </div>

                <div className="p-1.5 border-b border-slate-100 space-y-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRoleDropdownOpen(false);
                      setIsLoginPageOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 text-blue-700 rounded-xl transition-colors font-semibold"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Neumorphic Login Page</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRoleDropdownOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 rounded-xl transition-colors font-semibold text-slate-700 hover:text-slate-900"
                  >
                    <LogIn className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Quick Account / Terminal Switch</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRoleDropdownOpen(false);
                      setActiveTab('login-logs');
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 rounded-xl transition-colors font-semibold text-slate-700 hover:text-slate-900"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>View Login Logs & Audit Trail</span>
                  </button>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRoleDropdownOpen(false);
                      logoutUser();
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>End Session & Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Business Flow Architecture Modal */}
      {isFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50 shrink-0">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-neutral-900">
                  Dealer Operational Architecture & Flow Map
                </h3>
              </div>
              <button
                onClick={() => setIsFlowModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <BusinessFlowDiagram />
            </div>
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsFlowModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
