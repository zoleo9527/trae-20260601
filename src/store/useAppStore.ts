import { getInitialData, mockData, persistData } from '@/data/mock';
import type { AnomalyDetail, Bed, Note, Notification, NursingLevel, Resident, UserRole } from '@/types';
import { ANOMALY_TYPE_LABELS } from '@/types';
import { create } from 'zustand';

interface AppState {
  currentRole: UserRole;
  beds: Bed[];
  residents: Resident[];
  nursingLevels: NursingLevel[];
  notifications: Notification[];
  selectedBedId: string | null;
  selectedNursingLevelId: string | null;
  notePanelOpen: boolean;

  setRole: (role: UserRole) => void;
  selectBed: (bedId: string | null) => void;
  selectNursingLevel: (id: string | null) => void;
  setNotePanelOpen: (open: boolean) => void;

  addNoteToBed: (bedId: string, content: string) => void;
  transferNoteToNursingLevel: (noteId: string, bedId: string) => void;
  addNoteToNursingLevel: (nursingLevelId: string, content: string) => void;

  confirmNursingLevel: (id: string) => void;
  markAnomaly: (id: string, detail: AnomalyDetail) => void;
  returnNursingLevel: (id: string, detail: AnomalyDetail | string) => void;
  triggerAlert: (id: string) => void;

  admitResident: (bedId: string, resident: Omit<Resident, 'id' | 'notes'>, note?: string) => void;
  dischargeResident: (bedId: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;

  resetData: () => void;
}

let nextId = 1000;
function genId(prefix: string) {
  nextId++;
  return `${prefix}${nextId}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'nursing_supervisor',
  beds: [],
  residents: [],
  nursingLevels: [],
  notifications: [],
  selectedBedId: null,
  selectedNursingLevelId: null,
  notePanelOpen: false,

  setRole: (role) => set({ currentRole: role }),

  selectBed: (bedId) => set({ selectedBedId: bedId, notePanelOpen: bedId !== null }),
  selectNursingLevel: (id) => set({ selectedNursingLevelId: id }),
  setNotePanelOpen: (open) => set({ notePanelOpen: open }),

  addNoteToBed: (bedId, content) => {
    const note: Note = {
      id: genId('n'),
      content,
      source: 'bed_arrangement',
      transferredToNursingLevel: true,
      createdAt: new Date().toISOString(),
      createdBy: get().currentRole,
    };
    set((s) => {
      const beds = s.beds.map((b) => b.id === bedId ? { ...b, notes: [...b.notes, note] } : b);
      const bed = s.beds.find((b) => b.id === bedId);
      let nursingLevels = s.nursingLevels;
      if (bed?.residentId) {
        nursingLevels = s.nursingLevels.map((nl) =>
          nl.residentId === bed.residentId && (nl.status === 'pending' || nl.status === 'confirmed' || nl.status === 'anomaly' || nl.status === 'returned')
            ? { ...nl, notes: [...nl.notes, note] }
            : nl
        );
      }
      const state = { ...s, beds, nursingLevels };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  transferNoteToNursingLevel: (noteId, bedId) => {
    set((s) => {
      const bed = s.beds.find((b) => b.id === bedId);
      if (!bed || !bed.residentId) return s;

      const nursingLevel = s.nursingLevels.find((nl) => nl.residentId === bed.residentId && (nl.status === 'pending' || nl.status === 'confirmed' || nl.status === 'anomaly' || nl.status === 'returned'));
      if (!nursingLevel) return s;

      const note = bed.notes.find((n) => n.id === noteId);
      if (!note) return s;

      const transferredNote: Note = { ...note, transferredToNursingLevel: true };
      const beds = s.beds.map((b) =>
        b.id === bedId ? { ...b, notes: b.notes.map((n) => n.id === noteId ? transferredNote : n) } : b
      );
      const nursingLevels = s.nursingLevels.map((nl) =>
        nl.id === nursingLevel.id ? { ...nl, notes: [...nl.notes, transferredNote] } : nl
      );
      const state = { ...s, beds, nursingLevels };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  addNoteToNursingLevel: (nursingLevelId, content) => {
    const note: Note = {
      id: genId('n'),
      content,
      source: 'nursing_level',
      transferredToNursingLevel: true,
      createdAt: new Date().toISOString(),
      createdBy: get().currentRole,
    };
    set((s) => {
      const nursingLevels = s.nursingLevels.map((nl) =>
        nl.id === nursingLevelId ? { ...nl, notes: [...nl.notes, note] } : nl
      );
      const state = { ...s, nursingLevels };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  confirmNursingLevel: (id) => {
    set((s) => {
      const nursingLevels = s.nursingLevels.map((nl) =>
        nl.id === id ? { ...nl, status: 'confirmed' as const, confirmedAt: new Date().toISOString() } : nl
      );
      const nl = s.nursingLevels.find((n) => n.id === id);
      const residents = nl ? s.residents.map((r) => r.id === nl.residentId ? { ...r, nursingLevel: nl.level } : r) : s.residents;
      const state = { ...s, nursingLevels, residents };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  markAnomaly: (id, detail) => {
    if (detail.action === 'return') {
      const fullDetail: AnomalyDetail = {
        ...detail,
        occurredAt: detail.occurredAt || new Date().toISOString(),
      };
      get().returnNursingLevel(id, fullDetail);
      return;
    }
    set((s) => {
      const nl = s.nursingLevels.find((n) => n.id === id);
      const resident = nl ? s.residents.find((r) => r.id === nl.residentId) : null;
      const fullDetail: AnomalyDetail = {
        ...detail,
        occurredAt: detail.occurredAt || new Date().toISOString(),
      };
      const nursingLevels = s.nursingLevels.map((n) =>
        n.id === id ? { ...n, status: 'anomaly' as const, anomalyDetail: fullDetail } : n
      );
      const alertNote: Note = {
        id: genId('n'),
        content: `异常提醒：${ANOMALY_TYPE_LABELS[detail.type]} - ${detail.description}`,
        source: 'anomaly_return',
        transferredToNursingLevel: true,
        createdAt: new Date().toISOString(),
        createdBy: get().currentRole,
      };
      const updatedNursingLevels = nursingLevels.map((n) =>
        n.id === id ? { ...n, notes: [...n.notes, alertNote] } : n
      );
      const bed = s.beds.find((b) => b.residentId === nl?.residentId);
      const beds = bed ? s.beds.map((b) =>
        b.id === bed.id ? { ...b, notes: [...b.notes, alertNote] } : b
      ) : s.beds;
      const notification: Notification = {
        id: genId('nt'),
        type: 'anomaly',
        title: '异常提醒',
        description: `${resident?.name || '老人'} ${ANOMALY_TYPE_LABELS[detail.type]}：${detail.description}`,
        read: false,
        createdAt: new Date().toISOString(),
        relatedId: id,
        relatedType: 'nursing_level',
      };
      const state = { ...s, beds, nursingLevels: updatedNursingLevels, notifications: [notification, ...s.notifications] };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  returnNursingLevel: (id, detailOrReason) => {
    set((s) => {
      const currentNl = s.nursingLevels.find((n) => n.id === id);
      let anomalyDetail: AnomalyDetail;
      let returnReason: string;
      
      if (typeof detailOrReason === 'string') {
        returnReason = detailOrReason;
        anomalyDetail = currentNl?.anomalyDetail
          ? { ...currentNl.anomalyDetail, action: 'return' as const, returnReason, occurredAt: currentNl.anomalyDetail.occurredAt || new Date().toISOString() }
          : { type: 'other', description: returnReason, action: 'return' as const, returnReason, occurredAt: new Date().toISOString() };
      } else {
        anomalyDetail = {
          ...detailOrReason,
          action: 'return' as const,
          returnReason: detailOrReason.returnReason || detailOrReason.description,
          occurredAt: detailOrReason.occurredAt || new Date().toISOString(),
        };
        returnReason = anomalyDetail.returnReason;
      }

      const nursingLevels: NursingLevel[] = s.nursingLevels.map((nl) =>
        nl.id === id ? { ...nl, status: 'returned' as const, anomalyDetail } : nl
      );
      
      const returnNote: Note = {
        id: genId('n'),
        content: `退回 - ${ANOMALY_TYPE_LABELS[anomalyDetail.type]}：${returnReason}（发生时间：${new Date(anomalyDetail.occurredAt).toLocaleString('zh-CN')}）`,
        source: 'anomaly_return',
        transferredToNursingLevel: true,
        createdAt: new Date().toISOString(),
        createdBy: get().currentRole,
      };
      
      const targetNl = nursingLevels.find((n) => n.id === id);
      if (targetNl) {
        const resident = s.residents.find((r) => r.id === targetNl.residentId);
        if (resident) {
          const bed = s.beds.find((b) => b.residentId === resident.id);
          if (bed) {
            const beds = s.beds.map((b) => b.id === bed.id ? { ...b, notes: [...b.notes, returnNote], status: 'pending_adjustment' as const } : b);
            const notification: Notification = {
              id: genId('nt'),
              type: 'return',
              title: '退回通知',
              description: `${resident.name}护理等级评估已退回：${ANOMALY_TYPE_LABELS[anomalyDetail.type]} - ${returnReason}`,
              read: false,
              createdAt: new Date().toISOString(),
              relatedId: id,
              relatedType: 'nursing_level',
            };
            const updatedNursingLevels: NursingLevel[] = nursingLevels.map((n) => n.id === id ? { ...n, notes: [...n.notes, returnNote] } : n);
            const state = { ...s, beds, nursingLevels: updatedNursingLevels, notifications: [notification, ...s.notifications] };
            persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
            return state;
          }
        }
      }
      const state = { ...s, nursingLevels };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  triggerAlert: (id) => {
    const nl = get().nursingLevels.find((n) => n.id === id);
    if (!nl) return;
    const resident = get().residents.find((r) => r.id === nl.residentId);
    const alertNote: Note = {
      id: genId('n'),
      content: `触发异常提醒：${nl.anomalyDetail ? ANOMALY_TYPE_LABELS[nl.anomalyDetail.type] : '异常'} - ${nl.anomalyDetail?.description || '需及时处理'}`,
      source: 'anomaly_return',
      transferredToNursingLevel: true,
      createdAt: new Date().toISOString(),
      createdBy: get().currentRole,
    };
    set((s) => {
      const nursingLevels = s.nursingLevels.map((n) =>
        n.id === id ? { ...n, notes: [...n.notes, alertNote] } : n
      );
      const bed = s.beds.find((b) => b.residentId === nl.residentId);
      const beds = bed ? s.beds.map((b) =>
        b.id === bed.id ? { ...b, notes: [...b.notes, alertNote] } : b
      ) : s.beds;
      const state = { ...s, beds, nursingLevels };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: s.notifications });
      return state;
    });
    get().addNotification({
      type: 'anomaly',
      title: '异常提醒已触发',
      description: `${resident?.name || '老人'}护理等级异常，已通知相关人员处理`,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: id,
      relatedType: 'nursing_level',
    });
  },

  admitResident: (bedId, residentData, note) => {
    const resident: Resident = {
      ...residentData,
      id: genId('r'),
      notes: [],
    };
    const nursingLevel: NursingLevel = {
      id: genId('nl'),
      residentId: resident.id,
      level: resident.nursingLevel,
      source: 'bed_arrangement',
      status: 'pending',
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      anomalyDetail: null,
      notes: note ? [{
        id: genId('n'),
        content: note,
        source: 'bed_arrangement',
        transferredToNursingLevel: true,
        createdAt: new Date().toISOString(),
        createdBy: get().currentRole,
      }] : [],
      history: [],
    };
    set((s) => {
      const beds = s.beds.map((b) =>
        b.id === bedId ? {
          ...b,
          status: 'occupied' as const,
          residentId: resident.id,
          notes: note ? [...b.notes, {
            id: genId('n'),
            content: note,
            source: 'bed_arrangement' as const,
            transferredToNursingLevel: true,
            createdAt: new Date().toISOString(),
            createdBy: get().currentRole,
          }] : b.notes,
        } : b
      );
      const state = { ...s, beds, residents: [...s.residents, resident], nursingLevels: [...s.nursingLevels, nursingLevel] };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  dischargeResident: (bedId) => {
    set((s) => {
      const bed = s.beds.find((b) => b.id === bedId);
      if (!bed || !bed.residentId) return s;
      const residents = s.residents.map((r) =>
        r.id === bed.residentId ? { ...r, status: 'discharged' as const } : r
      );
      const beds = s.beds.map((b) =>
        b.id === bedId ? { ...b, status: 'available' as const, residentId: null, notes: [] } : b
      );
      const state = { ...s, beds, residents };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  markNotificationRead: (id) => {
    set((s) => {
      const notifications = s.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
      const state = { ...s, notifications };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  markAllNotificationsRead: () => {
    set((s) => {
      const notifications = s.notifications.map((n) => ({ ...n, read: true }));
      const state = { ...s, notifications };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  addNotification: (notification) => {
    set((s) => {
      const notifications = [{ ...notification, id: genId('nt') }, ...s.notifications];
      const state = { ...s, notifications };
      persistData({ beds: state.beds, residents: state.residents, nursingLevels: state.nursingLevels, notifications: state.notifications });
      return state;
    });
  },

  resetData: () => {
    localStorage.removeItem('nursing_home_data');
    set({
      beds: mockData.beds,
      residents: mockData.residents,
      nursingLevels: mockData.nursingLevels,
      notifications: mockData.notifications,
    });
  },
}));

export function initializeStore() {
  const data = getInitialData();
  useAppStore.setState({
    beds: data.beds,
    residents: data.residents,
    nursingLevels: data.nursingLevels,
    notifications: data.notifications,
  });
}
