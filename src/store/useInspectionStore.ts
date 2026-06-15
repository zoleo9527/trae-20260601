import { create } from 'zustand';
import { Inspection, InspectionStatus, InspectionItemResult, FilterOptions, UserRole } from '@/types';
import { inspections as initialInspections } from '@/data/inspections';
import { equipments } from '@/data/equipments';
import { contracts } from '@/data/contracts';

interface InspectionState {
  inspections: Inspection[];
  filters: FilterOptions;
  selectedInspection: Inspection | null;
  setFilters: (filters: Partial<FilterOptions>) => void;
  getInspectionById: (id: string) => Inspection | undefined;
  getEquipmentById: (id: string) => typeof equipments[0] | undefined;
  getContractById: (id: string) => typeof contracts[0] | undefined;
  getFilteredInspections: (currentRole?: UserRole) => Inspection[];
  getTodoCount: (role: string) => number;
  getExceptionCount: () => number;
  getCompletedCount: () => number;
  updateInspectionStatus: (id: string, status: InspectionStatus, role: string, handlerId: string, handler: string, action: string, remark?: string) => void;
  updateInspectionItem: (inspectionId: string, itemId: string, result: InspectionItemResult, remark?: string) => void;
  setSelectedInspection: (inspection: Inspection | null) => void;
  addSignature: (inspectionId: string, signatureData: string, driverName: string, driverId: string, photos: string[], remark?: string) => void;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  inspections: initialInspections,
  filters: {},
  selectedInspection: null,

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  getInspectionById: (id) => get().inspections.find((i) => i.id === id),

  getEquipmentById: (id) => equipments.find((e) => e.id === id),

  getContractById: (id) => contracts.find((c) => c.id === id),

  getFilteredInspections: (currentRole) => {
    const { inspections, filters } = get();
    let result = [...inspections];

    if (filters.onlyMine && currentRole) {
      result = result.filter((i) => i.currentRole === currentRole && i.status !== 'completed');
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter((i) => filters.status!.includes(i.status));
    }

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter((i) => {
        const equipment = equipments.find((e) => e.id === i.equipmentId);
        const contract = contracts.find((c) => c.id === i.contractId);
        return (
          i.inspectionNo.toLowerCase().includes(keyword) ||
          equipment?.name.toLowerCase().includes(keyword) ||
          equipment?.plateNumber.toLowerCase().includes(keyword) ||
          contract?.contractNo.toLowerCase().includes(keyword) ||
          contract?.lessee.toLowerCase().includes(keyword)
        );
      });
    }

    if (filters.equipmentType) {
      result = result.filter((i) => {
        const equipment = equipments.find((e) => e.id === i.equipmentId);
        return equipment?.type === filters.equipmentType;
      });
    }

    if (filters.priority && filters.priority.length > 0) {
      result = result.filter((i) => filters.priority!.includes(i.priority));
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getTodoCount: (role) => {
    const { inspections } = get();
    return inspections.filter((i) => i.currentRole === role && i.status !== 'completed').length;
  },

  getExceptionCount: () => {
    const { inspections } = get();
    return inspections.filter((i) => i.status === 'disputed' || i.status === 'pending_repair' || i.priority === 'urgent').length;
  },

  getCompletedCount: () => {
    const { inspections } = get();
    return inspections.filter((i) => i.status === 'completed').length;
  },

  updateInspectionStatus: (id, status, role, handlerId, handler, action, remark) => {
    set((state) => {
      const newTimelineNode = {
        id: `tl-${Date.now()}`,
        role: role as any,
        handler,
        handlerId,
        action,
        remark,
        timestamp: new Date().toISOString(),
      };

      return {
        inspections: state.inspections.map((i) => {
          if (i.id === id) {
            let currentRole = role as any;
            let currentHandlerId = handlerId;

            if (status === 'pending_dispatch') {
              currentRole = 'dispatcher';
              currentHandlerId = 'u002';
            } else if (status === 'pending_inspection') {
              currentRole = 'technician';
              currentHandlerId = 'u003';
            } else if (status === 'pending_sign') {
              currentRole = 'driver';
              currentHandlerId = i.driverId || 'u005';
            } else if (status === 'completed') {
              currentRole = 'manager';
              currentHandlerId = 'u001';
            }

            return {
              ...i,
              status,
              currentRole,
              currentHandlerId,
              updatedAt: new Date().toISOString(),
              timeline: [...i.timeline, newTimelineNode],
            };
          }
          return i;
        }),
      };
    });
  },

  updateInspectionItem: (inspectionId, itemId, result, remark) => {
    set((state) => ({
      inspections: state.inspections.map((i) => {
        if (i.id === inspectionId) {
          return {
            ...i,
            items: i.items.map((item) => {
              if (item.id === itemId) {
                return { ...item, result, remark };
              }
              return item;
            }),
          };
        }
        return i;
      }),
    }));
  },

  setSelectedInspection: (inspection) => set({ selectedInspection: inspection }),

  addSignature: (inspectionId, signatureData, driverName, driverId, photos, remark) => {
    set((state) => ({
      inspections: state.inspections.map((i) => {
        if (i.id === inspectionId) {
          const signatureNode = {
            id: `tl-${Date.now()}`,
            role: 'driver' as const,
            handler: driverName,
            handlerId: driverId,
            action: '司机签收确认',
            remark: remark || '已确认设备状态，签字接收',
            timestamp: new Date().toISOString(),
          };
          return {
            ...i,
            status: 'completed' as const,
            currentRole: 'manager' as const,
            currentHandlerId: 'u001',
            signature: {
              id: `sig-${Date.now()}`,
              driverName,
              driverId,
              signatureData,
              signedAt: new Date().toISOString(),
              photos,
              remark,
            },
            timeline: [...i.timeline, signatureNode],
            updatedAt: new Date().toISOString(),
          };
        }
        return i;
      }),
    }));
  },
}));
