import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './layouts/Sidebar';
import { Header } from './layouts/Header';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { NewOrderModal } from './components/NewOrderModal';
import { DashboardView } from './pages/DashboardView';
import { SchoolsView } from './pages/SchoolsView';
import { ProductsView } from './pages/ProductsView';
import { InventoryView } from './pages/InventoryView';
import { OrdersView } from './pages/OrdersView';
import { SchoolRequirementView } from './pages/SchoolRequirementView';
import { PaymentsView } from './pages/PaymentsView';
import { StaffView } from './pages/StaffView';
import { ReportsView } from './pages/ReportsView';
import { PublicLinksView } from './pages/PublicLinksView';
import { SettingsView } from './pages/SettingsView';
import { LoginLogsView } from './pages/LoginLogsView';
import { PublicPortalView } from './pages/PublicPortalView';
import { LoginModal } from './components/LoginModal';
import { NeumorphicLoginView } from './pages/NeumorphicLoginView';
import { ToastContainer } from './components/ToastContainer';
import { AlertCircle, RefreshCw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    publicPortalOpen,
    setPublicPortalOpen,
    setPublicSelectedSchoolCode,
    isLoginPageOpen,
    setIsLoginPageOpen,
    isLoading,
    error,
    refreshData,
  } = useApp();

  // Listen to query params (e.g. ?school=ABC01 or ?login=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const schoolParam = params.get('school');
    if (schoolParam) {
      setPublicSelectedSchoolCode(schoolParam.toUpperCase());
      setPublicPortalOpen(true);
    }
    const loginParam = params.get('login');
    if (loginParam === 'true') {
      setIsLoginPageOpen(true);
    }
  }, [setPublicPortalOpen, setPublicSelectedSchoolCode, setIsLoginPageOpen]);

  // If in Neumorphic Login Page mode
  if (isLoginPageOpen) {
    return (
      <>
        <NeumorphicLoginView />
        <ToastContainer />
      </>
    );
  }

  // If in public parent portal mode
  if (publicPortalOpen) {
    return (
      <>
        <PublicPortalView />
        <PrintReceiptModal />
        <ToastContainer />
      </>
    );
  }

  const renderActiveView = () => {
    if (isLoading) {
      return (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-slate-200/70 rounded-2xl w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 bg-slate-200/70 rounded-2xl" />
            <div className="h-28 bg-slate-200/70 rounded-2xl" />
            <div className="h-28 bg-slate-200/70 rounded-2xl" />
            <div className="h-28 bg-slate-200/70 rounded-2xl" />
          </div>
          <div className="h-80 bg-slate-200/70 rounded-2xl w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 max-w-lg mx-auto my-12 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Backend Communication Error</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => refreshData()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'schools':
        return <SchoolsView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'orders':
        return <OrdersView />;
      case 'school-requirement':
        return <SchoolRequirementView />;
      case 'payments':
        return <PaymentsView />;
      case 'staff':
        return <StaffView />;
      case 'reports':
        return <ReportsView />;
      case 'public-links':
        return <PublicLinksView />;
      case 'settings':
        return <SettingsView />;
      case 'login-logs':
        return <LoginLogsView />;
      case 'login':
        return <NeumorphicLoginView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      {/* Sidebar Navigation with Mobile Slide-out & Desktop Collapsible */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <NewOrderModal />
      <PrintReceiptModal />
      <LoginModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
