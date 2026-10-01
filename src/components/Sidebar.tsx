import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  School,
  BookOpen,
  Package,
  ShoppingCart,
  Calculator,
  CreditCard,
  Users,
  BarChart3,
  Link2,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

/**
 * Premium Vector Brand Emblem for Vanguard
 * Combines open academic book pages with a dynamic aerodynamic V crest
 */
export const VanguardLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 38,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-0.5 shadow-md shadow-blue-600/30 ring-1 ring-white/20 select-none group-hover:scale-105 transition-transform duration-300 ${className}`}
  >
    {/* Inner subtle glow gradient layer */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-white/25 pointer-events-none" />

    <svg
      width={size * 0.72}
      height={size * 0.72}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative drop-shadow-sm"
    >
      {/* Left Academic Book Page */}
      <path
        d="M5 6.5C8 5.8 11.5 6.5 13.5 8V22C11.5 20.5 8 19.8 5 20.5V6.5Z"
        fill="url(#vg-book-l)"
        opacity="0.9"
      />
      {/* Right Academic Book Page */}
      <path
        d="M23 6.5C20 5.8 16.5 6.5 14.5 8V22C16.5 20.5 20 19.8 23 20.5V6.5Z"
        fill="url(#vg-book-r)"
        opacity="0.9"
      />
      {/* Center Dynamic V Chevron */}
      <path
        d="M8.5 7.5L14 18.5L19.5 7.5H23L14 24.5L5 7.5H8.5Z"
        fill="#FFFFFF"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(15, 23, 42, 0.45))' }}
      />
      {/* Crest Accent Sparkle */}
      <circle cx="14" cy="5.5" r="1.5" fill="#38BDF8" />

      <defs>
        <linearGradient id="vg-book-l" x1="5" y1="6" x2="14" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="vg-book-r" x1="23" y1="6" x2="14" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93C5FD" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    orders,
    books,
    currentUser,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    setIsLoginPageOpen,
  } = useApp();

  // Badges calculation
  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === 'Confirmed' || o.orderStatus === 'Preparing'
  ).length;
  const lowStockCount = books.filter((b) => b.currentStock <= b.minStock).length;
  const pendingPaymentsCount = orders.filter((o) => o.paymentStatus !== 'Paid').length;

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Operations KPI',
      gradient: 'from-blue-600 via-blue-700 to-indigo-700',
      shadow: 'shadow-blue-500/25',
      accentColor: 'text-blue-600',
      hoverBg: 'group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200',
    },
    {
      id: 'schools',
      label: 'Schools',
      icon: School,
      description: 'Catalogues & Prescribed Lists',
      gradient: 'from-sky-500 via-blue-600 to-indigo-600',
      shadow: 'shadow-sky-500/25',
      accentColor: 'text-sky-600',
      hoverBg: 'group-hover:bg-sky-50 group-hover:text-sky-600 group-hover:border-sky-200',
    },
    {
      id: 'products',
      label: 'Products',
      icon: BookOpen,
      description: 'Books, Stationery & Publishers',
      gradient: 'from-indigo-600 via-purple-600 to-violet-700',
      shadow: 'shadow-indigo-500/25',
      accentColor: 'text-indigo-600',
      hoverBg: 'group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      alertCount: lowStockCount > 0 ? lowStockCount : undefined,
      description: 'Warehouse Stock & Receiving',
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
      shadow: 'shadow-amber-500/25',
      accentColor: 'text-amber-600',
      hoverBg: 'group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-200',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      badgeCount: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      description: 'All Sales & Dispatches',
      gradient: 'from-emerald-600 via-teal-600 to-emerald-700',
      shadow: 'shadow-emerald-500/25',
      accentColor: 'text-emerald-600',
      hoverBg: 'group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200',
    },
    {
      id: 'school-requirement',
      label: 'Requirements & POs',
      icon: Calculator,
      description: 'Enrollment Shortage Planner',
      gradient: 'from-blue-600 via-indigo-600 to-blue-800',
      shadow: 'shadow-blue-500/25',
      accentColor: 'text-blue-600',
      hoverBg: 'group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badgeCount: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      description: 'Customer Dues & Payables',
      gradient: 'from-teal-600 via-emerald-600 to-teal-700',
      shadow: 'shadow-teal-500/25',
      accentColor: 'text-teal-600',
      hoverBg: 'group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-200',
    },
    {
      id: 'staff',
      label: 'Staff & Partners',
      icon: Users,
      description: 'Team & Stall Accounts',
      gradient: 'from-violet-600 via-fuchsia-600 to-purple-700',
      shadow: 'shadow-violet-500/25',
      accentColor: 'text-violet-600',
      hoverBg: 'group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-200',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      description: 'Sales & Inventory Analytics',
      gradient: 'from-rose-500 via-red-500 to-rose-700',
      shadow: 'shadow-rose-500/25',
      accentColor: 'text-rose-600',
      hoverBg: 'group-hover:bg-rose-50 group-hover:text-rose-600 group-hover:border-rose-200',
    },
    {
      id: 'public-links',
      label: 'Public Links',
      icon: Link2,
      description: 'Parent Ordering Direct URLs',
      gradient: 'from-cyan-600 via-sky-600 to-blue-600',
      shadow: 'shadow-cyan-500/25',
      accentColor: 'text-cyan-600',
      hoverBg: 'group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-200',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Dealership & Tax Profile',
      gradient: 'from-slate-700 via-slate-800 to-zinc-900',
      shadow: 'shadow-slate-500/25',
      accentColor: 'text-slate-600',
      hoverBg: 'group-hover:bg-slate-100 group-hover:text-slate-700 group-hover:border-slate-300',
    },
    {
      id: 'login-logs',
      label: 'Login & Audit Logs',
      icon: ShieldCheck,
      description: 'Session History & Terminals',
      gradient: 'from-indigo-600 via-blue-700 to-indigo-900',
      shadow: 'shadow-indigo-500/25',
      accentColor: 'text-indigo-600',
      hoverBg: 'group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200',
    },
    {
      id: 'login',
      label: 'Login Portal',
      icon: Sparkles,
      description: 'Neumorphic Auth Screen',
      gradient: 'from-blue-500 via-indigo-600 to-blue-700',
      shadow: 'shadow-blue-500/25',
      accentColor: 'text-blue-600',
      hoverBg: 'group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200',
    },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'login') {
      setIsLoginPageOpen(true);
    } else {
      setActiveTab(id);
    }
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-label="Close navigation overlay"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out lg:static shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'w-72 sm:w-64'}`}
      >
        {/* Brand Header with Close & Collapse Controls */}
        <div
          className={`border-b border-slate-100 shrink-0 transition-all ${
            sidebarCollapsed
              ? 'py-3.5 px-2 flex flex-col items-center gap-2'
              : 'p-3.5 sm:p-4 flex items-center justify-between'
          }`}
        >
          {/* Logo & Brand text */}
          <div
            onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
            className={`flex items-center gap-3 cursor-pointer ${
              sidebarCollapsed ? 'justify-center' : 'min-w-0'
            }`}
            title={sidebarCollapsed ? 'Vanguard ERP - Click to expand (Ctrl+B)' : undefined}
          >
            <VanguardLogo size={sidebarCollapsed ? 40 : 38} />

            {!sidebarCollapsed && (
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900 tracking-tight truncate">
                    Vanguard ERP
                  </p>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                    Core
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Book & School Distribution
                </p>
              </div>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop Collapse Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl border border-transparent hover:border-blue-200 transition-all shadow-2xs hover:shadow-xs"
              title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4 text-blue-600" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="p-2.5 sm:p-3 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center min-h-[44px] px-2.5 py-1.5 rounded-2xl text-xs font-semibold transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-900 border border-blue-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                  } ${sidebarCollapsed ? 'justify-center p-1.5' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Bespoke Squircle Icon Container */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isActive
                            ? `bg-gradient-to-br ${item.gradient} text-white ${item.shadow} shadow-md ring-2 ring-white/60 scale-102`
                            : `bg-slate-100/90 text-slate-500 border border-slate-200/60 ${item.hoverBg}`
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                      </div>

                      {/* Micro Pill Badge Counter (Positioned directly on top-right corner of the icon) */}
                      {item.alertCount && (
                        <span
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-neutral-950 font-mono font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse"
                          title="Critical inventory alert"
                        >
                          {item.alertCount}
                        </span>
                      )}

                      {!item.alertCount && item.badgeCount && (
                        <span
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white shadow-xs"
                          title="Pending action items"
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </div>

                    {/* Text Label & Description in Expanded View */}
                    {!sidebarCollapsed && (
                      <div className="min-w-0 truncate">
                        <p
                          className={`font-semibold text-xs tracking-tight truncate ${
                            isActive ? 'text-blue-950 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate font-normal">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Expanded View Right Badges */}
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {item.alertCount && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-200/80">
                          {item.alertCount}
                        </span>
                      )}
                      {!item.alertCount && item.badgeCount && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-lg bg-blue-100 text-blue-800 border border-blue-200/80">
                          {item.badgeCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Modern Floating Hover Tooltip in Collapsed State */}
                {sidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-2 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 whitespace-nowrap border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{item.label}</span>
                      {item.alertCount && (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full font-mono">
                          {item.alertCount}
                        </span>
                      )}
                      {!item.alertCount && item.badgeCount && (
                        <span className="px-1.5 py-0.2 bg-blue-500 text-white text-[10px] font-bold rounded-full font-mono">
                          {item.badgeCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-normal">{item.description}</p>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700/50" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Identity / Role Badge */}
        {!sidebarCollapsed ? (
          <div className="p-3.5 border-t border-slate-200/70 bg-slate-50/80 shrink-0">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Logged in Role:</span>
              <span className="font-bold text-blue-700 font-mono text-[10px] px-2 py-0.5 bg-blue-100/70 rounded-md border border-blue-200/60">
                {currentUser.role}
              </span>
            </div>
            {currentUser.type === 'Partner' ? (
              <p className="text-[10px] text-amber-800 mt-1 font-mono truncate font-medium">
                Stall: {currentUser.assignedSchoolCodes.join(', ') || 'All'}
              </p>
            ) : (
              <p className="text-[11px] font-bold text-slate-800 mt-1 truncate">
                {currentUser.name}
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 border-t border-slate-200/70 flex justify-center shrink-0 group relative">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-mono text-xs font-bold flex items-center justify-center shadow-xs ring-1 ring-slate-700/50 cursor-pointer hover:scale-105 transition-transform"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {currentUser.name.charAt(0)}
            </div>

            {/* Hover Tooltip for Profile */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-2 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 whitespace-nowrap border border-slate-700/50">
              <p className="font-bold text-xs">{currentUser.name}</p>
              <p className="text-[10px] text-blue-400 font-mono">{currentUser.role}</p>
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700/50" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
