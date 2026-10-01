import { getStore, updateStore } from '../data/store.js';
import { StaffPartner, LoginLogRecord, UserRole } from '../types.js';

export const authService = {
  getCurrentUser(authHeader?: string): StaffPartner {
    const store = getStore();
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = store.staff.find((s) => s.token === token);
      if (user) return user;
    }
    return store.staff[0];
  },

  listStaff(): StaffPartner[] {
    return getStore().staff;
  },

  login(
    emailOrId: string,
    options?: {
      terminal?: string;
      device?: string;
      ipAddress?: string;
      loginMethod?: 'Password' | 'PIN Badge' | 'Quick Role Switch' | 'Session Token';
    }
  ): { user: StaffPartner; log: LoginLogRecord } {
    const store = getStore();
    const user = store.staff.find(
      (s) =>
        s.email.toLowerCase() === emailOrId.toLowerCase() ||
        s.id.toLowerCase() === emailOrId.toLowerCase() ||
        s.name.toLowerCase() === emailOrId.toLowerCase()
    );

    if (!user) {
      throw new Error(`Invalid credentials or user "${emailOrId}" not found`);
    }

    const sessionToken = user.token || `token-${user.id.toLowerCase()}-${Date.now()}`;
    const terminal = options?.terminal || 'Central Admin Workstation 01';
    const device = options?.device || 'Chrome 122 (Desktop Web)';
    const ipAddress = options?.ipAddress || '192.168.1.100';
    const loginMethod = options?.loginMethod || 'Password';

    // Derive realistic campus or office location based on terminal
    let location = 'Central Head Office (HQ)';
    if (terminal.toLowerCase().includes('stall') || terminal.toLowerCase().includes('dps')) {
      location = 'DPS Sector 45 School Stall';
    } else if (terminal.toLowerCase().includes('store') || terminal.toLowerCase().includes('pos')) {
      location = 'Main Retail Book Depot';
    } else if (terminal.toLowerCase().includes('handheld') || terminal.toLowerCase().includes('mobile')) {
      location = 'Field Campus Network';
    }

    const newLog: LoginLogRecord = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      timestamp: new Date().toISOString(),
      ipAddress,
      location,
      device,
      terminal,
      status: 'Active',
      loginMethod,
      sessionToken,
    };

    updateStore((prev) => ({
      ...prev,
      loginLogs: [newLog, ...prev.loginLogs],
    }));

    return { user, log: newLog };
  },

  logout(userIdOrToken?: string): boolean {
    if (!userIdOrToken) return true;

    updateStore((prev) => ({
      ...prev,
      loginLogs: prev.loginLogs.map((log) => {
        if (
          (log.userId === userIdOrToken || log.sessionToken === userIdOrToken) &&
          log.status === 'Active'
        ) {
          return { ...log, status: 'Logged Out' };
        }
        return log;
      }),
    }));

    return true;
  },

  getLoginLogs(query?: {
    search?: string;
    role?: string;
    userId?: string;
    status?: string;
    limit?: number;
  }): LoginLogRecord[] {
    let logs = getStore().loginLogs || [];

    if (!query) return logs;

    if (query.search) {
      const q = query.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.terminal.toLowerCase().includes(q) ||
          l.ipAddress.includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }

    if (query.role && query.role !== 'All') {
      logs = logs.filter((l) => l.role === query.role);
    }

    if (query.userId && query.userId !== 'All') {
      logs = logs.filter((l) => l.userId === query.userId);
    }

    if (query.status && query.status !== 'All') {
      logs = logs.filter((l) => l.status === query.status);
    }

    if (query.limit) {
      logs = logs.slice(0, query.limit);
    }

    return logs;
  },

  addStaff(data: Omit<StaffPartner, 'id' | 'token'>): StaffPartner {
    const newStaff: StaffPartner = {
      ...data,
      id: `STF-0${getStore().staff.length + 1}`,
      token: `token-${Date.now()}`,
    };

    updateStore((prev) => ({
      ...prev,
      staff: [...prev.staff, newStaff],
    }));

    return newStaff;
  },

  updateStaff(id: string, updates: Partial<StaffPartner>): StaffPartner {
    let updated: StaffPartner | undefined;

    updateStore((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => {
        if (s.id === id) {
          updated = { ...s, ...updates };
          return updated;
        }
        return s;
      }),
    }));

    if (!updated) {
      throw new Error(`Staff with id ${id} not found`);
    }

    return updated;
  },
};
