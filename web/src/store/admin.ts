import { create } from 'zustand';
import { api } from './auth';

interface AdminState {
  stats: any | null;
  usersData: any | null;
  userDetail: any | null;
  pendingNurses: any[];
  nursesList: any[];
  pendingDoctors: any[];
  doctorsList: any[];
  offers: any[];
  configs: any[];
  auditLogsData: any | null;
  isLoading: boolean;

  fetchStats: () => Promise<void>;
  fetchUsers: (query: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => Promise<void>;
  fetchUserDetail: (id: string) => Promise<void>;
  updateUserStatus: (id: string, status: string, reason: string) => Promise<void>;
  deleteUser: (id: string, reason: string) => Promise<void>;
  fetchPendingNurses: () => Promise<void>;
  fetchAllNurses: (status?: string) => Promise<void>;
  approveNurse: (id: string) => Promise<void>;
  rejectNurse: (id: string, reason: string) => Promise<void>;
  revokeNurse: (id: string, reason: string) => Promise<void>;
  fetchPendingDoctors: () => Promise<void>;
  fetchAllDoctors: (status?: string) => Promise<void>;
  approveDoctor: (id: string) => Promise<void>;
  rejectDoctor: (id: string, reason: string) => Promise<void>;
  revokeDoctor: (id: string, reason: string) => Promise<void>;
  fetchOffers: (status?: string) => Promise<void>;
  removeOffer: (id: string, reason: string) => Promise<void>;
  fetchConfigs: () => Promise<void>;
  updateConfig: (key: string, value: string, changeReason?: string) => Promise<void>;
  fetchAuditLogs: (query: any) => Promise<void>;
  fetchClinicalCases: (status?: string) => Promise<any[]>;
  overrideAssignment: (caseId: string, doctorId: string, reason: string) => Promise<any>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  usersData: null,
  userDetail: null,
  pendingNurses: [],
  nursesList: [],
  pendingDoctors: [],
  doctorsList: [],
  offers: [],
  configs: [],
  auditLogsData: null,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await api('GET', '/admin/stats');
      set({ stats, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  fetchUsers: async (query) => {
    set({ isLoading: true });
    try {
      const usersData = await api(
        'GET',
        `/admin/users?search=${query.search || ''}&role=${query.role || ''}&status=${query.status || ''}&page=${query.page || 1}&limit=${query.limit || 20}`
      );
      set({ usersData, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  fetchUserDetail: async (id) => {
    set({ isLoading: true });
    try {
      const userDetail = await api('GET', `/admin/users/${id}`);
      set({ userDetail, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  updateUserStatus: async (id, status, reason) => {
    await api('PUT', `/admin/users/${id}/status`, { status, reason });
    if (get().userDetail?.id === id) {
      await get().fetchUserDetail(id);
    }
  },

  deleteUser: async (id, reason) => {
    await api('DELETE', `/admin/users/${id}`, { reason });
  },

  fetchPendingNurses: async () => {
    const pendingNurses = await api('GET', '/admin/nurses/pending');
    set({ pendingNurses });
  },

  fetchAllNurses: async (status) => {
    const nursesList = await api('GET', `/admin/nurses?status=${status || ''}`);
    set({ nursesList });
  },

  approveNurse: async (id) => {
    await api('PUT', `/admin/nurses/${id}/approve`);
  },

  rejectNurse: async (id, reason) => {
    await api('PUT', `/admin/nurses/${id}/reject`, { reason });
  },

  revokeNurse: async (id, reason) => {
    await api('PUT', `/admin/nurses/${id}/revoke`, { reason });
  },

  fetchPendingDoctors: async () => {
    const pendingDoctors = await api('GET', '/admin/doctors/pending');
    set({ pendingDoctors });
  },

  fetchAllDoctors: async (status) => {
    const doctorsList = await api('GET', `/admin/doctors?status=${status || ''}`);
    set({ doctorsList });
  },

  approveDoctor: async (id) => {
    await api('PUT', `/admin/doctors/${id}/approve`);
  },

  rejectDoctor: async (id, reason) => {
    await api('PUT', `/admin/doctors/${id}/reject`, { reason });
  },

  revokeDoctor: async (id, reason) => {
    await api('PUT', `/admin/doctors/${id}/revoke`, { reason });
  },

  fetchOffers: async (status) => {
    const offers = await api('GET', `/admin/marketplace/offers?status=${status || ''}`);
    set({ offers });
  },

  removeOffer: async (id, reason) => {
    await api('PUT', `/admin/marketplace/offers/${id}/remove`, { reason });
  },

  fetchConfigs: async () => {
    const configs = await api('GET', '/admin/config');
    set({ configs });
  },

  updateConfig: async (key, value, changeReason) => {
    await api('PUT', `/admin/config/${encodeURIComponent(key)}`, { value, changeReason });
    await get().fetchConfigs();
  },

  fetchAuditLogs: async (query) => {
    set({ isLoading: true });
    try {
      const q = new URLSearchParams(query).toString();
      const auditLogsData = await api('GET', `/admin/audit-logs?${q}`);
      set({ auditLogsData, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  fetchClinicalCases: async (status) => {
    return await api('GET', `/admin/cases${status ? `?status=${status}` : ''}`);
  },

  overrideAssignment: async (caseId, doctorId, reason) => {
    return await api('PUT', `/admin/cases/override-assignment`, { caseId, doctorId, reason });
  }
}));
