import { create } from 'zustand';
import { complaints as initialComplaints } from '../data/complaints';
import { hotspots as initialHotspots } from '../data/hotspots';
import type { Complaint, Hotspot, UserRole } from '../types';

interface AppState {
  complaints: Complaint[];
  hotspots: Hotspot[];
  selectedComplaintId: string | null;
  selectedHotspotId: string | null;
  activeTab: 'list' | 'hotspots';
  userRole: UserRole;
  statusFilter: string;
  searchQuery: string;

  setSelectedComplaint: (id: string | null) => void;
  setSelectedHotspot: (id: string | null) => void;
  setActiveTab: (tab: 'list' | 'hotspots') => void;
  setUserRole: (role: UserRole) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;
  closeComplaint: (id: string, reason: string) => void;
  getFilteredComplaints: () => Complaint[];
}

export const useAppStore = create<AppState>((set, get) => ({
  complaints: initialComplaints,
  hotspots: initialHotspots,
  selectedComplaintId: null,
  selectedHotspotId: null,
  activeTab: 'list',
  userRole: 'dispatcher',
  statusFilter: 'all',
  searchQuery: '',

  setSelectedComplaint: (id) => set({ selectedComplaintId: id }),
  setSelectedHotspot: (id) => set({ selectedHotspotId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setUserRole: (role) => set({ userRole: role }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  closeComplaint: (id, reason) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'closed',
              closeTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
              closeReason: reason
            }
          : c
      )
    })),

  getFilteredComplaints: () => {
    const { complaints, statusFilter, searchQuery, selectedHotspotId, hotspots } = get();
    let filtered = [...complaints];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query) ||
          c.location.address.toLowerCase().includes(query) ||
          c.bikeId.toLowerCase().includes(query)
      );
    }

    if (selectedHotspotId) {
      const hotspot = hotspots.find((h) => h.id === selectedHotspotId);
      if (hotspot) {
        filtered = filtered.filter((c) => c.hotspotId === selectedHotspotId);
      }
    }

    filtered.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

    return filtered;
  }
}));
