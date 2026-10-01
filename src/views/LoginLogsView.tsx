import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LoginLogRecord, UserRole } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Monitor,
  Smartphone,
  Laptop,
  Clock,
  MapPin,
  LogIn,
  LogOut,
  RefreshCw,
  User,
  KeyRound,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Info,
  X,
} from 'lucide-react';

export const LoginLogsView: React.FC = () => {
  const { loginLogs, fetchLoginLogs, currentUser, setIsAuthModalOpen, logoutUser, isLoading } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<LoginLogRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLoginLogs();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredLogs = useMemo(() => {
    return loginLogs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        log.userName.toLowerCase().includes(q) ||
        log.userEmail.toLowerCase().includes(q) ||
        log.terminal.toLowerCase().includes(q) ||
        log.ipAddress.includes(q) ||
        log.location.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'All' || log.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [loginLogs, search, roleFilter, statusFilter]);

  // Statistics
  const activeSessionsCount = loginLogs.filter((l) => l.status === 'Active').length;
  const uniqueTerminalsCount = new Set(loginLogs.map((l) => l.terminal)).size;
  const adminLoginsCount = loginLogs.filter((l) => l.role === 'Super Admin').length;

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

  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) {
      return <Smartphone className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (d.includes('ipad') || d.includes('tablet')) {
      return <Laptop className="w-3.5 h-3.5 text-slate-500" />;
    }
    return <Monitor className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              System Login Logs & Access History
            </h2>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time authentication records for each login session across Central Depot, Campus Stalls, and Field terminals
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Logs</span>
          </button>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all card-3d-press"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Switch / New Login</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Logins Recorded</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{loginLogs.length}</p>
            <span className="text-[10px] text-slate-400">All historical access attempts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Sessions</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-2xl font-bold font-mono text-slate-900">{activeSessionsCount}</p>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Currently online terminals</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Unique Access Terminals</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{uniqueTerminalsCount}</p>
            <span className="text-[10px] text-slate-400">Stalls, warehouse, & mobile</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Monitor className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Active Session</p>
            <p className="text-sm font-bold text-slate-900 truncate mt-1">{currentUser.name}</p>
            <span className="text-[10px] font-semibold text-blue-600">{currentUser.role}</span>
          </div>
          <button
            onClick={() => logoutUser()}
            title="Terminate current session"
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email, terminal name, location, or IP..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 text-[11px]">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Store Manager">Store Manager</option>
              <option value="Field Employee">Field Employee</option>
              <option value="Campus Partner">Campus Partner</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Sessions</option>
              <option value="Logged Out">Logged Out</option>
              <option value="Success">Success</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Log Entries Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Authentication Audit Trail</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Showing {filteredLogs.length} of {loginLogs.length} login log entries
            </p>
          </div>

          {(search || roleFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('All');
                setStatusFilter('All');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No login logs match the selected filter criteria</p>
            <p className="text-slate-400 text-[11px]">
              Try clearing your search query or switching roles.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3 px-4">Log ID & Time</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Terminal & Campus Location</th>
                  <th className="py-3 px-4">Device & IP</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-center">Session Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const logDate = new Date(log.timestamp);
                  const isCurrent = currentUser.id === log.userId && log.status === 'Active';

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Log ID & Time */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{log.id}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-700 rounded-md">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {logDate.toLocaleDateString()} {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* User & Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {log.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{log.userName}</p>
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border mt-0.5 ${getRoleBadge(
                                log.role
                              )}`}
                            >
                              {log.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Terminal & Location */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{log.terminal}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{log.location}</span>
                        </div>
                      </td>

                      {/* Device & IP */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          {getDeviceIcon(log.device)}
                          <span className="truncate max-w-[140px] text-[11px] font-medium">{log.device}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{log.ipAddress}</p>
                      </td>

                      {/* Login Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <KeyRound className="w-3 h-3 text-slate-400" />
                          {log.loginMethod}
                        </span>
                      </td>

                      {/* Session Status */}
                      <td className="py-3.5 px-4 text-center">
                        {log.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : log.status === 'Logged Out' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Logged Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Success
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Inspection Modal / Drawer */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 cursor-default animate-fade-in p-6 space-y-5 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Login Session Audit</h3>
                  <p className="font-mono text-xs text-slate-500 font-bold">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">User Identity:</span>
                <span className="font-bold text-slate-900">{selectedLog.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">User Role:</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(selectedLog.role)}`}>
                  {selectedLog.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Official Email:</span>
                <span className="font-mono text-slate-800">{selectedLog.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Terminal Station:</span>
                <span className="font-semibold text-slate-900">{selectedLog.terminal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="text-slate-800">{selectedLog.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Client Device:</span>
                <span className="text-slate-800">{selectedLog.device}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Remote IP Address:</span>
                <span className="font-mono font-bold text-slate-800">{selectedLog.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Timestamp:</span>
                <span className="font-mono text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Authentication Method:</span>
                <span className="font-semibold text-slate-800">{selectedLog.loginMethod}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Session Status:</span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                    selectedLog.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {selectedLog.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
