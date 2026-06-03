import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Order,
  ScanFile,
  Assignment,
  Technician,
  Remark,
  AuditLog,
  OrderStatus,
  Role,
  PaginationParams,
  FilterParams,
  PaginatedResponse,
} from '@/types';
import {
  mockOrders,
  mockScanFiles,
  mockAssignments,
  mockTechnicians,
  mockRemarks,
  mockAuditLogs,
  INTEGRATION_POINTS,
} from '@/data/mockData';
import { canTransitionTo } from '@/types';

interface AppState {
  orders: Order[];
  scanFiles: ScanFile[];
  assignments: Assignment[];
  technicians: Technician[];
  remarks: Remark[];
  auditLogs: AuditLog[];
  currentRole: Role | null;
  currentUser: string;
  integrationPoints: typeof INTEGRATION_POINTS;
  initialized: boolean;

  initMockData: () => void;

  getOrders: (params: PaginationParams & FilterParams) => PaginatedResponse<Order>;
  getOrderById: (id: string) => Order | undefined;
  createOrder: (data: Omit<Order, 'id' | 'orderNo' | 'status' | 'createdAt' | 'createdBy' | 'reworkCount'>) => Order;

  getScanFiles: (orderId?: string) => ScanFile[];
  getScanFileById: (id: string) => ScanFile | undefined;
  uploadScanFile: (data: Omit<ScanFile, 'id' | 'uploadedAt' | 'status'>, remark: string) => ScanFile;
  processScanFile: (scanFileId: string) => void;

  getAssignments: (params?: PaginationParams & { technicianId?: string }) => PaginatedResponse<Assignment>;
  getAssignmentById: (id: string) => Assignment | undefined;
  getAssignmentsByOrderId: (orderId: string) => Assignment[];
  createAssignment: (data: {
    scanFileId: string;
    orderId: string;
    technicianId: string;
    technicianName: string;
    customerServiceRemark: string;
    designerRemark: string;
    estimatedDays: number;
  }) => Assignment;

  getTechnicians: () => Technician[];
  getAvailableTechnicians: () => Technician[];

  getRemarksByOrderId: (orderId: string) => Remark[];
  addRemark: (orderId: string, content: string, role: Role, operator: string) => Remark;

  getAuditLogs: (params: PaginationParams & { orderId?: string; role?: Role }) => PaginatedResponse<AuditLog>;
  addAuditLog: (
    orderId: string,
    action: string,
    oldStatus: OrderStatus | undefined,
    newStatus: OrderStatus,
    operator: string,
    role: Role,
    detail: string
  ) => void;

  qualityCheck: (orderId: string, passed: boolean, remark: string, operator: string) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, operator: string, role: Role, detail: string) => boolean;

  setCurrentRole: (role: Role | null) => void;
  setCurrentUser: (user: string) => void;

  getOrdersForCustomerService: (params: PaginationParams & FilterParams) => PaginatedResponse<Order>;
  getScanFilesForDesigner: (params: PaginationParams & FilterParams) => PaginatedResponse<{ scanFile: ScanFile; order: Order }>;
  getOrdersForQuality: (params: PaginationParams & FilterParams) => PaginatedResponse<Order>;
}

const generateOrderNo = () => {
  const now = new Date();
  const prefix = `YC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}${random}`;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const DATA_VERSION = 2;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      orders: [],
      scanFiles: [],
      assignments: [],
      technicians: [],
      remarks: [],
      auditLogs: [],
      currentRole: null,
      currentUser: '',
      integrationPoints: INTEGRATION_POINTS,
      initialized: false,

      initMockData: () => {
        const state = get();
        const storedVersion = (localStorage.getItem('denture-lab-version') || '1');
        if (state.initialized && Number(storedVersion) >= DATA_VERSION) return;
        localStorage.setItem('denture-lab-version', String(DATA_VERSION));
        set({
          orders: mockOrders,
          scanFiles: mockScanFiles,
          assignments: mockAssignments,
          technicians: mockTechnicians,
          remarks: mockRemarks,
          auditLogs: mockAuditLogs,
          initialized: true,
        });
      },

      getOrders: (params) => {
        const { orders } = get();
        let filtered = [...orders];

        if (params.status) {
          filtered = filtered.filter((o) => o.status === params.status);
        }
        if (params.keyword) {
          const kw = params.keyword.toLowerCase();
          filtered = filtered.filter(
            (o) =>
              o.orderNo.toLowerCase().includes(kw) ||
              o.customerName.toLowerCase().includes(kw) ||
              o.toothType.toLowerCase().includes(kw)
          );
        }
        if (params.startDate) {
          filtered = filtered.filter((o) => o.deliveryDate >= params.startDate!);
        }
        if (params.endDate) {
          filtered = filtered.filter((o) => o.deliveryDate <= params.endDate!);
        }

        const total = filtered.length;
        const totalPages = Math.ceil(total / params.pageSize);
        const start = (params.page - 1) * params.pageSize;
        const data = filtered.slice(start, start + params.pageSize);

        return { data, total, page: params.page, pageSize: params.pageSize, totalPages };
      },

      getOrderById: (id) => get().orders.find((o) => o.id === id),

      createOrder: (data) => {
        const newOrder: Order = {
          id: generateId(),
          orderNo: generateOrderNo(),
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          createdBy: get().currentUser || '系统',
          reworkCount: 0,
          ...data,
        };

        set((state) => ({ orders: [newOrder, ...state.orders] }));

        get().addAuditLog(
          newOrder.id,
          '创建订单',
          undefined,
          'PENDING',
          get().currentUser || '系统',
          get().currentRole || 'CUSTOMER_SERVICE',
          `创建订单 ${newOrder.orderNo}，客户：${newOrder.customerName}`
        );

        return newOrder;
      },

      getScanFiles: (orderId) => {
        const { scanFiles } = get();
        if (orderId) {
          return scanFiles.filter((s) => s.orderId === orderId);
        }
        return scanFiles;
      },

      getScanFileById: (id) => get().scanFiles.find((s) => s.id === id),

      uploadScanFile: (data, remark) => {
        const newScanFile: ScanFile = {
          id: generateId(),
          uploadedAt: new Date().toISOString(),
          status: 'UPLOADED',
          customerServiceRemark: remark,
          ...data,
        };

        set((state) => ({ scanFiles: [newScanFile, ...state.scanFiles] }));

        const success = get().updateOrderStatus(
          data.orderId,
          'SCAN_UPLOADED',
          get().currentUser || '系统',
          get().currentRole || 'CUSTOMER_SERVICE',
          `上传扫描文件：${data.fileName}`
        );

        if (remark) {
          get().addRemark(
            data.orderId,
            remark,
            get().currentRole || 'CUSTOMER_SERVICE',
            get().currentUser || '系统'
          );
        }

        if (success && remark) {
          const order = get().getOrderById(data.orderId);
          if (order) {
            get().addAuditLog(
              data.orderId,
              '上传扫描文件并添加备注',
              'PENDING',
              'SCAN_UPLOADED',
              get().currentUser || '系统',
              get().currentRole || 'CUSTOMER_SERVICE',
              `上传扫描文件：${data.fileName}，备注：${remark}`
            );
          }
        }

        return newScanFile;
      },

      processScanFile: (scanFileId) => {
        const scanFile = get().getScanFileById(scanFileId);
        if (!scanFile) return;

        set((state) => ({
          scanFiles: state.scanFiles.map((s) =>
            s.id === scanFileId ? { ...s, status: 'PROCESSED' as const } : s
          ),
        }));

        get().updateOrderStatus(
          scanFile.orderId,
          'PROCESSING',
          get().currentUser || '系统',
          get().currentRole || 'DESIGNER',
          '设计师开始处理扫描文件'
        );
      },

      getAssignments: (params) => {
        let filtered = [...get().assignments];
        if (params?.technicianId) {
          filtered = filtered.filter((a) => a.technicianId === params.technicianId);
        }

        const page = params?.page || 1;
        const pageSize = params?.pageSize || 10;
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const data = filtered.slice(start, start + pageSize);

        return { data, total, page, pageSize, totalPages };
      },

      getAssignmentById: (id) => get().assignments.find((a) => a.id === id),

      getAssignmentsByOrderId: (orderId) =>
        get().assignments.filter((a) => a.orderId === orderId),

      createAssignment: (data) => {
        const combinedRemark =
          (data.customerServiceRemark ? `【客服】${data.customerServiceRemark}\n` : '') +
          `【设计师】${data.designerRemark}`;

        const newAssignment: Assignment = {
          id: generateId(),
          combinedRemark,
          assignedAt: new Date().toISOString(),
          assignedBy: get().currentUser || '系统',
          status: 'PENDING',
          ...data,
        };

        set((state) => ({ assignments: [newAssignment, ...state.assignments] }));

        const success = get().updateOrderStatus(
          data.orderId,
          'ASSIGNED',
          get().currentUser || '系统',
          get().currentRole || 'DESIGNER',
          `派单给技师：${data.technicianName}，预计${data.estimatedDays}天`
        );

        if (success && data.designerRemark) {
          get().addRemark(
            data.orderId,
            data.designerRemark,
            get().currentRole || 'DESIGNER',
            get().currentUser || '系统'
          );
        }

        if (success) {
          setTimeout(() => {
            get().updateOrderStatus(
              data.orderId,
              'IN_PRODUCTION',
              data.technicianName,
              'ADMIN',
              '技师已确认接单，开始生产'
            );

            setTimeout(() => {
              get().updateOrderStatus(
                data.orderId,
                'PENDING_INSPECTION',
                '系统',
                'ADMIN',
                '生产已完成，提交质检'
              );
            }, 600);
          }, 300);
        }

        return newAssignment;
      },

      getTechnicians: () => get().technicians,

      getAvailableTechnicians: () =>
        get().technicians.filter((t) => t.status === 'AVAILABLE'),

      getRemarksByOrderId: (orderId) =>
        get().remarks.filter((r) => r.orderId === orderId).sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),

      addRemark: (orderId, content, role, operator) => {
        const newRemark: Remark = {
          id: generateId(),
          orderId,
          content,
          createdBy: operator,
          role,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ remarks: [...state.remarks, newRemark] }));
        return newRemark;
      },

      getAuditLogs: (params) => {
        let filtered = [...get().auditLogs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (params.orderId) {
          filtered = filtered.filter((l) => l.orderId === params.orderId);
        }
        if (params.role) {
          filtered = filtered.filter((l) => l.role === params.role);
        }

        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const data = filtered.slice(start, start + pageSize);

        return { data, total, page, pageSize, totalPages };
      },

      addAuditLog: (orderId, action, oldStatus, newStatus, operator, role, detail) => {
        const newLog: AuditLog = {
          id: generateId(),
          orderId,
          action,
          oldStatus,
          newStatus,
          operator,
          role,
          createdAt: new Date().toISOString(),
          detail,
        };

        set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      },

      updateOrderStatus: (orderId, newStatus, operator, role, detail) => {
        const order = get().getOrderById(orderId);
        if (!order) return false;

        if (!canTransitionTo(order.status, newStatus)) {
          console.error(`状态转换不允许: ${order.status} -> ${newStatus}`);
          return false;
        }

        const oldStatus = order.status;
        let reworkCount = order.reworkCount;
        if (newStatus === 'REWORK') {
          reworkCount += 1;
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: newStatus, reworkCount } : o
          ),
        }));

        get().addAuditLog(orderId, '状态变更', oldStatus, newStatus, operator, role, detail);

        if (newStatus === 'REWORK') {
          setTimeout(() => {
            get().updateOrderStatus(
              orderId,
              'PROCESSING',
              '系统',
              'ADMIN',
              '返工流程已启动，自动回退至设计师环节'
            );
          }, 500);
        }

        return true;
      },

      qualityCheck: (orderId, passed, remark, operator) => {
        const order = get().getOrderById(orderId);
        if (!order || order.status !== 'PENDING_INSPECTION') return;

        const newStatus: OrderStatus = passed ? 'COMPLETED' : 'REWORK';
        const detail = passed
          ? `质检通过${remark ? `，备注：${remark}` : ''}`
          : `质检不合格，原因：${remark}，已自动回退至设计师环节`;

        const success = get().updateOrderStatus(
          orderId,
          newStatus,
          operator,
          'QUALITY',
          detail
        );

        if (success && remark) {
          get().addRemark(orderId, remark, 'QUALITY', operator);
        }
      },

      setCurrentRole: (role) => set({ currentRole: role }),

      setCurrentUser: (user) => set({ currentUser: user }),

      getOrdersForCustomerService: (params) => get().getOrders(params),

      getScanFilesForDesigner: (params) => {
        const { scanFiles, orders } = get();
        let combined = scanFiles
          .filter((s) => s.status === 'UPLOADED' || s.status === 'PROCESSED')
          .map((s) => ({
            scanFile: s,
            order: orders.find((o) => o.id === s.orderId)!,
          }))
          .filter((item) => !!item.order);

        if (params.status) {
          combined = combined.filter((c) => c.order.status === params.status);
        }
        if (params.keyword) {
          const kw = params.keyword.toLowerCase();
          combined = combined.filter(
            (c) =>
              c.order.orderNo.toLowerCase().includes(kw) ||
              c.order.customerName.toLowerCase().includes(kw) ||
              c.scanFile.fileName.toLowerCase().includes(kw)
          );
        }

        const total = combined.length;
        const totalPages = Math.ceil(total / params.pageSize);
        const start = (params.page - 1) * params.pageSize;
        const data = combined.slice(start, start + params.pageSize);

        return { data, total, page: params.page, pageSize: params.pageSize, totalPages };
      },

      getOrdersForQuality: (params) => {
        let filtered = get().orders.filter(
          (o) => o.status === 'PENDING_INSPECTION' || o.status === 'COMPLETED' || o.status === 'REWORK'
        );

        if (params.status) {
          filtered = filtered.filter((o) => o.status === params.status);
        }
        if (params.keyword) {
          const kw = params.keyword.toLowerCase();
          filtered = filtered.filter(
            (o) =>
              o.orderNo.toLowerCase().includes(kw) ||
              o.customerName.toLowerCase().includes(kw) ||
              o.toothType.toLowerCase().includes(kw)
          );
        }

        const total = filtered.length;
        const totalPages = Math.ceil(total / params.pageSize);
        const start = (params.page - 1) * params.pageSize;
        const data = filtered.slice(start, start + params.pageSize);

        return { data, total, page: params.page, pageSize: params.pageSize, totalPages };
      },
    }),
    {
      name: 'denture-lab-storage',
      partialize: (state) => ({
        orders: state.orders,
        scanFiles: state.scanFiles,
        assignments: state.assignments,
        remarks: state.remarks,
        auditLogs: state.auditLogs,
        currentRole: state.currentRole,
        currentUser: state.currentUser,
        initialized: state.initialized,
      }),
    }
  )
);
