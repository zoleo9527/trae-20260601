import { create } from 'zustand';
import type { WorkOrder, WorkOrderStatus, Priority, Remark, User } from '../types';
import { mockWorkOrders } from '../data/mockData';

interface WorkOrderState {
  workOrders: WorkOrder[];
  selectedWorkOrder: WorkOrder | null;
  isDetailOpen: boolean;
  isDispatchModalOpen: boolean;
  isOnSiteModalOpen: boolean;
  isCompleteModalOpen: boolean;
  filterStatus: WorkOrderStatus | 'all';
  filterPriority: Priority | 'all';
  searchKeyword: string;
  flashingWorkOrderId: string | null;

  setFilterStatus: (status: WorkOrderStatus | 'all') => void;
  setFilterPriority: (priority: Priority | 'all') => void;
  setSearchKeyword: (keyword: string) => void;
  selectWorkOrder: (workOrder: WorkOrder | null) => void;
  openDetail: (workOrder: WorkOrder) => void;
  closeDetail: () => void;
  openDispatchModal: () => void;
  closeDispatchModal: () => void;
  openOnSiteModal: () => void;
  closeOnSiteModal: () => void;
  openCompleteModal: () => void;
  closeCompleteModal: () => void;
  getFilteredWorkOrders: () => WorkOrder[];
  getTodoByRole: (user: User) => WorkOrder[];

  dispatchWorkOrder: (
    workOrderId: string,
    electricianId: string,
    electricianName: string,
    remark: string,
    priority: Priority
  ) => void;

  submitOnSiteFeedback: (
    workOrderId: string,
    remark: string,
    result: 'complete' | 'return',
    returnReason?: string
  ) => void;

  completeWorkOrder: (workOrderId: string, remark: string) => void;
  addRemark: (workOrderId: string, remark: Omit<Remark, 'id' | 'timestamp'>) => void;
  setFlashingWorkOrderId: (id: string | null) => void;
}

const generateId = () => `r${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
const getCurrentTime = () => new Date().toISOString().replace('T', ' ').substr(0, 19);

export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
  workOrders: mockWorkOrders,
  selectedWorkOrder: null,
  isDetailOpen: false,
  isDispatchModalOpen: false,
  isOnSiteModalOpen: false,
  isCompleteModalOpen: false,
  filterStatus: 'all',
  filterPriority: 'all',
  searchKeyword: '',
  flashingWorkOrderId: null,

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  selectWorkOrder: (workOrder) => set({ selectedWorkOrder: workOrder }),

  openDetail: (workOrder) => {
    set({ selectedWorkOrder: workOrder, isDetailOpen: true });
  },

  closeDetail: () => set({ isDetailOpen: false }),

  openDispatchModal: () => set({ isDispatchModalOpen: true }),
  closeDispatchModal: () => set({ isDispatchModalOpen: false }),

  openOnSiteModal: () => set({ isOnSiteModalOpen: true }),
  closeOnSiteModal: () => set({ isOnSiteModalOpen: false }),

  openCompleteModal: () => set({ isCompleteModalOpen: true }),
  closeCompleteModal: () => set({ isCompleteModalOpen: false }),

  setFlashingWorkOrderId: (id) => set({ flashingWorkOrderId: id }),

  getFilteredWorkOrders: () => {
    const { workOrders, filterStatus, filterPriority, searchKeyword } = get();
    return workOrders.filter((wo) => {
      const matchStatus = filterStatus === 'all' || wo.status === filterStatus;
      const matchPriority = filterPriority === 'all' || wo.priority === filterPriority;
      const matchKeyword =
        !searchKeyword ||
        wo.orderNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        wo.lampPost.location.includes(searchKeyword) ||
        wo.faultType.includes(searchKeyword);
      return matchStatus && matchPriority && matchKeyword;
    });
  },

  getTodoByRole: (user) => {
    const { getFilteredWorkOrders } = get();
    const allOrders = getFilteredWorkOrders();

    switch (user.role) {
      case 'inspector':
        return allOrders.filter(
          (wo) =>
            wo.status === 'pending_dispatch' ||
            wo.status === 'in_progress' ||
            wo.status === 'on_site'
        );
      case 'electrician':
        return allOrders.filter(
          (wo) =>
            (wo.status === 'dispatched' ||
              wo.status === 'on_site' ||
              wo.status === 'in_progress') &&
            wo.electricianId === user.id
        );
      case 'dispatcher':
        return allOrders.filter(
          (wo) =>
            wo.status === 'pending_dispatch' ||
            wo.status === 'returned' ||
            wo.status === 'dispatched' ||
            wo.status === 'on_site' ||
            wo.status === 'in_progress'
        );
      case 'supervisor':
        return allOrders;
      default:
        return allOrders;
    }
  },

  dispatchWorkOrder: (workOrderId, electricianId, electricianName, remark, priority) => {
    const currentTime = getCurrentTime();
    const newRemark: Remark = {
      id: generateId(),
      workOrderId,
      authorId: 'u005',
      authorName: '陈调度',
      authorRole: 'dispatcher',
      content: remark,
      type: 'dispatch',
      timestamp: currentTime,
    };

    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === workOrderId
          ? {
              ...wo,
              status: 'dispatched' as WorkOrderStatus,
              priority,
              electricianId,
              electricianName,
              dispatchTime: currentTime,
              dispatchRemark: remark,
              remarks: [...wo.remarks, newRemark],
            }
          : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === workOrderId
          ? {
              ...state.selectedWorkOrder,
              status: 'dispatched' as WorkOrderStatus,
              priority,
              electricianId,
              electricianName,
              dispatchTime: currentTime,
              dispatchRemark: remark,
              remarks: [...state.selectedWorkOrder.remarks, newRemark],
            }
          : state.selectedWorkOrder,
      flashingWorkOrderId: workOrderId,
    }));

    setTimeout(() => set({ flashingWorkOrderId: null }), 1000);
  },

  submitOnSiteFeedback: (workOrderId, remark, result, returnReason) => {
    const currentTime = getCurrentTime();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const onSiteRemark: Remark = {
      id: generateId(),
      workOrderId,
      authorId: currentUser.id || 'u002',
      authorName: currentUser.name || '王电工',
      authorRole: currentUser.role || 'electrician',
      content: remark,
      type: 'onsite',
      timestamp: currentTime,
    };

    set((state) => {
      const baseUpdates = {
        status: result === 'complete' ? ('in_progress' as WorkOrderStatus) : ('returned' as WorkOrderStatus),
        onSiteTime: currentTime,
        onSiteRemark: remark,
        remarks: [...state.workOrders.find((wo) => wo.id === workOrderId)!.remarks, onSiteRemark],
      };

      if (result === 'return' && returnReason) {
        const returnRemark: Remark = {
          id: generateId(),
          workOrderId,
          authorId: currentUser.id || 'u002',
          authorName: currentUser.name || '王电工',
          authorRole: currentUser.role || 'electrician',
          content: returnReason,
          type: 'return',
          timestamp: currentTime,
        };
        baseUpdates.remarks = [...baseUpdates.remarks, returnRemark];
        (baseUpdates as any).returnReason = returnReason;
        (baseUpdates as any).returnTime = currentTime;
      }

      return {
        workOrders: state.workOrders.map((wo) =>
          wo.id === workOrderId ? { ...wo, ...baseUpdates } : wo
        ),
        selectedWorkOrder:
          state.selectedWorkOrder?.id === workOrderId
            ? { ...state.selectedWorkOrder, ...baseUpdates }
            : state.selectedWorkOrder,
        flashingWorkOrderId: workOrderId,
      };
    });

    setTimeout(() => set({ flashingWorkOrderId: null }), 1000);
  },

  completeWorkOrder: (workOrderId, remark) => {
    const currentTime = getCurrentTime();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const completeRemark: Remark = {
      id: generateId(),
      workOrderId,
      authorId: currentUser.id || 'u002',
      authorName: currentUser.name || '王电工',
      authorRole: currentUser.role || 'electrician',
      content: remark,
      type: 'supplement',
      timestamp: currentTime,
    };

    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === workOrderId
          ? {
              ...wo,
              status: 'completed' as WorkOrderStatus,
              completeTime: currentTime,
              completeRemark: remark,
              remarks: [...wo.remarks, completeRemark],
            }
          : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === workOrderId
          ? {
              ...state.selectedWorkOrder,
              status: 'completed' as WorkOrderStatus,
              completeTime: currentTime,
              completeRemark: remark,
              remarks: [...state.selectedWorkOrder.remarks, completeRemark],
            }
          : state.selectedWorkOrder,
      flashingWorkOrderId: workOrderId,
    }));

    setTimeout(() => set({ flashingWorkOrderId: null }), 1000);
  },

  addRemark: (workOrderId, remark) => {
    const currentTime = getCurrentTime();
    const newRemark: Remark = {
      ...remark,
      id: generateId(),
      timestamp: currentTime,
    };

    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === workOrderId
          ? { ...wo, remarks: [...wo.remarks, newRemark] }
          : wo
      ),
      selectedWorkOrder:
        state.selectedWorkOrder?.id === workOrderId
          ? { ...state.selectedWorkOrder, remarks: [...state.selectedWorkOrder.remarks, newRemark] }
          : state.selectedWorkOrder,
    }));
  },
}));
