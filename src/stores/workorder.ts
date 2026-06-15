import { create } from 'zustand';
import type { WorkOrder, WorkOrderStatus, PartRequest, SignOffData } from '@/types';
import { mockWorkOrders, mockParts } from '@/data/mockData';

interface WorkOrderStore {
  workorders: WorkOrder[];
  currentWorkOrder: WorkOrder | null;
  statusFilter: string;
  selectedIds: string[];
  
  fetchWorkOrders: () => void;
  getWorkOrderById: (id: string) => void;
  createWorkOrder: (data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => void;
  assignTechnician: (id: string, technicianId: string, technicianName: string) => void;
  applyParts: (id: string, parts: PartRequest[]) => void;
  issueParts: (id: string, partId: string) => void;
  submitSignOff: (id: string, data: SignOffData) => void;
  approveSignOff: (id: string, remark?: string) => void;
  rejectSignOff: (id: string, remark: string) => void;
  setStatusFilter: (status: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  batchAssign: (ids: string[], technicianId: string, technicianName: string) => void;
}

export const useWorkOrderStore = create<WorkOrderStore>((set, get) => ({
  workorders: [],
  currentWorkOrder: null,
  statusFilter: 'all',
  selectedIds: [],

  fetchWorkOrders: () => {
    set({ workorders: [...mockWorkOrders] });
  },

  getWorkOrderById: (id: string) => {
    const workorder = get().workorders.find(w => w.id === id);
    set({ currentWorkOrder: workorder || null });
  },

  createWorkOrder: (data) => {
    const newWorkOrder: WorkOrder = {
      ...data,
      id: `wo${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      parts: [],
      maintenanceRecords: [],
    };
    set(state => ({ workorders: [newWorkOrder, ...state.workorders] }));
  },

  updateWorkOrder: (id, data) => {
    set(state => ({
      workorders: state.workorders.map(w => 
        w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) } : w
      ),
      currentWorkOrder: state.currentWorkOrder?.id === id ? { ...state.currentWorkOrder, ...data } : state.currentWorkOrder,
    }));
  },

  assignTechnician: (id, technicianId, techName) => {
    get().updateWorkOrder(id, { 
      assignee: technicianId, 
      assigneeName: techName, 
      status: 'assigned' as WorkOrderStatus 
    });
  },

  applyParts: (id, parts) => {
    const workorder = get().workorders.find(w => w.id === id);
    if (!workorder) return;

    const newParts = parts.map((p, index) => {
      const partInfo = mockParts.find(part => part.id === p.partId);
      return {
        id: `wp${Date.now()}${index}`,
        partId: p.partId,
        partNo: partInfo?.partNo || '',
        name: partInfo?.name || '',
        specification: partInfo?.specification || '',
        quantity: p.quantity,
        status: 'applied' as const,
      };
    });

    get().updateWorkOrder(id, { 
      parts: [...workorder.parts, ...newParts],
      status: 'waiting_parts' as WorkOrderStatus 
    });
  },

  issueParts: (id, partId) => {
    const workorder = get().workorders.find(w => w.id === id);
    if (!workorder) return;

    const updatedParts = workorder.parts.map(p => 
      p.partId === partId ? { ...p, status: 'issued' as const } : p
    );

    const allIssued = updatedParts.every(p => p.status === 'issued');
    
    get().updateWorkOrder(id, { 
      parts: updatedParts,
      status: allIssued ? 'repairing' as WorkOrderStatus : workorder.status 
    });
  },

  submitSignOff: (id, data) => {
    const workorder = get().workorders.find(w => w.id === id);
    if (!workorder) return;

    const signOff = {
      id: `so${Date.now()}`,
      workorderId: id,
      technician: workorder.assignee,
      technicianName: workorder.assigneeName,
      content: data.content,
      partsUsed: data.partsUsed,
      workingHours: data.workingHours,
      applyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'pending' as const,
      attachments: data.attachments,
    };

    const updatedParts = workorder.parts.map(p => ({ ...p, status: 'used' as const }));

    get().updateWorkOrder(id, { 
      signOff, 
      parts: updatedParts,
      status: 'signoff_pending' as WorkOrderStatus 
    });
  },

  approveSignOff: (id, remark) => {
    const workorder = get().workorders.find(w => w.id === id);
    if (!workorder?.signOff) return;

    const updatedSignOff = {
      ...workorder.signOff,
      status: 'approved' as const,
      approver: 'u1',
      approverName: '张伟',
      approveTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark,
    };

    get().updateWorkOrder(id, { 
      signOff: updatedSignOff,
      status: 'completed' as WorkOrderStatus 
    });
  },

  rejectSignOff: (id, remark) => {
    const workorder = get().workorders.find(w => w.id === id);
    if (!workorder?.signOff) return;

    const updatedSignOff = {
      ...workorder.signOff,
      status: 'rejected' as const,
      approver: 'u1',
      approverName: '张伟',
      approveTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark,
    };

    get().updateWorkOrder(id, { 
      signOff: updatedSignOff,
      status: 'repairing' as WorkOrderStatus 
    });
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
  },

  toggleSelect: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id],
    }));
  },

  selectAll: () => {
    const { workorders, statusFilter } = get();
    const filtered = statusFilter === 'all' 
      ? workorders 
      : workorders.filter(w => w.status === statusFilter);
    set({ selectedIds: filtered.map(w => w.id) });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  batchAssign: (ids, technicianId, technicianName) => {
    ids.forEach(id => {
      get().assignTechnician(id, technicianId, technicianName);
    });
    get().clearSelection();
  },
}));
