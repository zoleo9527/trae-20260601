import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AppState, 
  RepairOrder, 
  User, 
  CompletionRecord, 
  ReworkRecord, 
  StatusHistory,
  Notification,
  OrderStatus,
  BackupData
} from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WX${year}${month}${day}${random}`;
};

const defaultUsers: User[] = [
  { id: 'user_1', name: '张宿管', role: 'dorm_manager', phone: '13800138001' },
  { id: 'user_2', name: '李师傅', role: 'repair_worker', phone: '13800138002' },
  { id: 'user_3', name: '王主管', role: 'logistics_supervisor', phone: '13800138003' },
];

const createSampleOrders = (): RepairOrder[] => {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
  
  return [
    {
      id: generateId(),
      orderNo: generateOrderNo(),
      title: '1号楼302宿舍灯管损坏',
      description: '宿舍主灯管闪烁，有时不亮',
      category: '电器维修',
      dormitory: '1号楼',
      roomNumber: '302',
      reporter: '张三',
      reporterPhone: '13900139001',
      createdAt: twoDaysAgo,
      assignedTo: 'user_2',
      status: 'completion_submitted',
      priority: 'medium',
      completions: [
        {
          id: generateId(),
          orderId: '',
          submittedBy: 'user_2',
          submittedAt: yesterday,
          description: '已更换新灯管，测试正常',
          materialsUsed: 'LED灯管1个',
          laborHours: 0.5,
          isRework: false,
          reworkCount: 0,
          confirmed: false
        }
      ],
      reworks: [],
      statusHistory: [
        { id: generateId(), orderId: '', status: 'pending', changedBy: 'user_1', changedAt: twoDaysAgo, remark: '宿管上报' },
        { id: generateId(), orderId: '', status: 'assigned', changedBy: 'user_3', changedAt: twoDaysAgo, remark: '分配给李师傅' },
        { id: generateId(), orderId: '', status: 'in_progress', changedBy: 'user_2', changedAt: yesterday, remark: '开始维修' },
        { id: generateId(), orderId: '', status: 'completion_submitted', changedBy: 'user_2', changedAt: yesterday, remark: '提交完工' },
      ]
    },
    {
      id: generateId(),
      orderNo: generateOrderNo(),
      title: '2号楼105宿舍水龙头漏水',
      description: '卫生间水龙头关不严，一直滴水',
      category: '水暖维修',
      dormitory: '2号楼',
      roomNumber: '105',
      reporter: '李四',
      reporterPhone: '13900139002',
      createdAt: yesterday,
      assignedTo: 'user_2',
      status: 'in_progress',
      priority: 'high',
      completions: [],
      reworks: [],
      statusHistory: [
        { id: generateId(), orderId: '', status: 'pending', changedBy: 'user_1', changedAt: yesterday, remark: '宿管上报' },
        { id: generateId(), orderId: '', status: 'assigned', changedBy: 'user_3', changedAt: yesterday, remark: '分配给李师傅' },
        { id: generateId(), orderId: '', status: 'in_progress', changedBy: 'user_2', changedAt: now, remark: '开始维修' },
      ]
    },
    {
      id: generateId(),
      orderNo: generateOrderNo(),
      title: '3号楼201宿舍门锁损坏',
      description: '房门锁无法正常打开，需要用力才能开',
      category: '五金维修',
      dormitory: '3号楼',
      roomNumber: '201',
      reporter: '王五',
      reporterPhone: '13900139003',
      createdAt: twoDaysAgo,
      assignedTo: 'user_2',
      status: 'completion_confirmed',
      priority: 'low',
      completions: [
        {
          id: generateId(),
          orderId: '',
          submittedBy: 'user_2',
          submittedAt: yesterday,
          confirmedBy: 'user_1',
          confirmedAt: yesterday,
          description: '已更换锁芯，开关顺畅',
          materialsUsed: '锁芯1套',
          laborHours: 1,
          isRework: false,
          reworkCount: 0,
          confirmed: true
        }
      ],
      reworks: [],
      statusHistory: [
        { id: generateId(), orderId: '', status: 'pending', changedBy: 'user_1', changedAt: twoDaysAgo, remark: '宿管上报' },
        { id: generateId(), orderId: '', status: 'assigned', changedBy: 'user_3', changedAt: twoDaysAgo, remark: '分配给李师傅' },
        { id: generateId(), orderId: '', status: 'in_progress', changedBy: 'user_2', changedAt: twoDaysAgo, remark: '开始维修' },
        { id: generateId(), orderId: '', status: 'completion_submitted', changedBy: 'user_2', changedAt: yesterday, remark: '提交完工' },
        { id: generateId(), orderId: '', status: 'completion_confirmed', changedBy: 'user_1', changedAt: yesterday, remark: '宿管确认完工' },
      ]
    },
    {
      id: generateId(),
      orderNo: generateOrderNo(),
      title: '1号楼405宿舍窗户关不严',
      description: '阳台窗户闭合后有缝隙，漏风',
      category: '门窗维修',
      dormitory: '1号楼',
      roomNumber: '405',
      reporter: '赵六',
      reporterPhone: '13900139004',
      createdAt: twoDaysAgo,
      assignedTo: 'user_2',
      status: 'rework_requested',
      priority: 'medium',
      currentCompletionId: 'comp_1',
      completions: [
        {
          id: 'comp_1',
          orderId: '',
          submittedBy: 'user_2',
          submittedAt: yesterday,
          description: '已调整窗户铰链，闭合正常',
          materialsUsed: '螺丝若干',
          laborHours: 0.5,
          isRework: false,
          reworkCount: 0,
          confirmed: true,
          confirmedBy: 'user_1',
          confirmedAt: yesterday
        }
      ],
      reworks: [
        {
          id: generateId(),
          orderId: '',
          requestedBy: 'user_1',
          requestedAt: now,
          reason: '窗户仍然漏风，闭合不严，需要重新处理',
          originalCompletionId: 'comp_1',
          assignedTo: 'user_2',
          status: 'pending'
        }
      ],
      statusHistory: [
        { id: generateId(), orderId: '', status: 'pending', changedBy: 'user_1', changedAt: twoDaysAgo, remark: '宿管上报' },
        { id: generateId(), orderId: '', status: 'assigned', changedBy: 'user_3', changedAt: twoDaysAgo, remark: '分配给李师傅' },
        { id: generateId(), orderId: '', status: 'in_progress', changedBy: 'user_2', changedAt: twoDaysAgo, remark: '开始维修' },
        { id: generateId(), orderId: '', status: 'completion_submitted', changedBy: 'user_2', changedAt: yesterday, remark: '提交完工' },
        { id: generateId(), orderId: '', status: 'completion_confirmed', changedBy: 'user_1', changedAt: yesterday, remark: '宿管确认完工' },
        { id: generateId(), orderId: '', status: 'rework_requested', changedBy: 'user_1', changedAt: now, remark: '申请二次返修：窗户仍漏风' },
      ]
    },
    {
      id: generateId(),
      orderNo: generateOrderNo(),
      title: '2号楼308宿舍空调不制冷',
      description: '空调开启后吹自然风，不制冷',
      category: '电器维修',
      dormitory: '2号楼',
      roomNumber: '308',
      reporter: '孙七',
      reporterPhone: '13900139005',
      createdAt: yesterday,
      status: 'pending',
      priority: 'high',
      completions: [],
      reworks: [],
      statusHistory: [
        { id: generateId(), orderId: '', status: 'pending', changedBy: 'user_1', changedAt: yesterday, remark: '宿管上报' },
      ]
    }
  ].map(order => ({
    ...order,
    completions: order.completions.map(c => ({ ...c, orderId: order.id })),
    reworks: order.reworks.map(r => ({ ...r, orderId: order.id })),
    statusHistory: order.statusHistory.map(h => ({ ...h, orderId: order.id })),
  })) as RepairOrder[];
};

interface StoreState extends AppState {
  initialize: () => void;
  setCurrentUser: (user: User | null) => void;
  addOrder: (order: Omit<RepairOrder, 'id' | 'orderNo' | 'createdAt' | 'completions' | 'reworks' | 'statusHistory' | 'status'>) => void;
  assignOrder: (orderId: string, userId: string) => void;
  startRepair: (orderId: string) => void;
  submitCompletion: (orderId: string, data: Omit<CompletionRecord, 'id' | 'orderId' | 'submittedAt' | 'isRework' | 'reworkCount' | 'confirmed'>, isRework?: boolean) => void;
  confirmCompletion: (orderId: string, completionId: string, remark?: string) => void;
  requestRework: (orderId: string, completionId: string, reason: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, remark?: string) => void;
  getOrdersForRole: (role: User['role']) => RepairOrder[];
  getPendingCount: (role: User['role']) => number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  exportBackup: () => BackupData;
  importBackup: (data: BackupData) => void;
  batchImportOrders: (orders: Array<Omit<RepairOrder, 'id' | 'orderNo' | 'createdAt' | 'completions' | 'reworks' | 'statusHistory' | 'status'>>) => void;
  getRecentActivity: () => StatusHistory[];
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      orders: [],
      users: defaultUsers,
      currentUser: defaultUsers[0],
      notifications: [],
      initialized: false,

      initialize: () => {
        const state = get();
        if (!state.initialized && state.orders.length === 0) {
          const sampleOrders = createSampleOrders();
          const sampleNotifications: Notification[] = sampleOrders
            .filter(o => o.status === 'completion_submitted' || o.status === 'rework_requested')
            .map(o => ({
              id: generateId(),
              type: o.status === 'completion_submitted' ? 'completion' : 'rework',
              orderId: o.id,
              orderNo: o.orderNo,
              message: o.status === 'completion_submitted' 
                ? `工单 ${o.orderNo} 已提交完工，待确认` 
                : `工单 ${o.orderNo} 申请二次返修`,
              createdAt: new Date().toISOString(),
              read: false,
              relatedUserId: 'user_1'
            }));
          set({ 
            orders: sampleOrders, 
            notifications: sampleNotifications,
            initialized: true 
          });
        } else if (!state.initialized) {
          set({ initialized: true });
        }
      },

      setCurrentUser: (user) => set({ currentUser: user }),

      addOrder: (orderData) => {
        const state = get();
        const newOrder: RepairOrder = {
          ...orderData,
          id: generateId(),
          orderNo: generateOrderNo(),
          createdAt: new Date().toISOString(),
          status: 'pending',
          completions: [],
          reworks: [],
          statusHistory: [{
            id: generateId(),
            orderId: '',
            status: 'pending',
            changedBy: state.currentUser?.id || '',
            changedAt: new Date().toISOString(),
            remark: '新建工单'
          }]
        };
        newOrder.statusHistory[0].orderId = newOrder.id;
        set({ orders: [...state.orders, newOrder] });
      },

      assignOrder: (orderId, userId) => {
        const state = get();
        const user = state.users.find(u => u.id === userId);
        const orders = state.orders.map(order => {
          if (order.id === orderId) {
            const newHistory: StatusHistory = {
              id: generateId(),
              orderId,
              status: 'assigned',
              changedBy: state.currentUser?.id || '',
              changedAt: new Date().toISOString(),
              remark: `分配给 ${user?.name || '维修师傅'}`
            };
            return {
              ...order,
              assignedTo: userId,
              status: 'assigned' as OrderStatus,
              statusHistory: [...order.statusHistory, newHistory]
            };
          }
          return order;
        });
        const order = orders.find(o => o.id === orderId);
        if (order) {
          get().addNotification({
            type: 'assignment',
            orderId,
            orderNo: order.orderNo,
            message: `您被分配了新工单：${order.title}`,
            relatedUserId: userId
          });
        }
        set({ orders: orders as RepairOrder[] });
      },

      startRepair: (orderId) => {
        const state = get();
        const orders = state.orders.map(order => {
          if (order.id === orderId) {
            const isRework = order.status === 'rework_requested';
            const newStatus = isRework ? 'rework_in_progress' : 'in_progress';
            const newHistory: StatusHistory = {
              id: generateId(),
              orderId,
              status: newStatus,
              changedBy: state.currentUser?.id || '',
              changedAt: new Date().toISOString(),
              remark: isRework ? '开始返修' : '开始维修'
            };
            if (isRework && order.reworks.length > 0) {
              const reworks = order.reworks.map((r, idx) => 
                idx === order.reworks.length - 1 ? { ...r, status: 'in_progress' as const } : r
              );
              return { ...order, status: newStatus, reworks, statusHistory: [...order.statusHistory, newHistory] };
            }
            return { ...order, status: newStatus, statusHistory: [...order.statusHistory, newHistory] };
          }
          return order;
        });
        set({ orders: orders as RepairOrder[] });
      },

      submitCompletion: (orderId, data, isRework = false) => {
        const state = get();
        const orders = state.orders.map(order => {
          if (order.id === orderId) {
            const reworkCount = order.reworks.length;
            const newCompletion: CompletionRecord = {
              ...data,
              id: generateId(),
              orderId,
              submittedAt: new Date().toISOString(),
              isRework,
              reworkCount,
              confirmed: false
            };
            const newStatus = isRework ? 'rework_completion_submitted' : 'completion_submitted';
            const newHistory: StatusHistory = {
              id: generateId(),
              orderId,
              status: newStatus,
              changedBy: state.currentUser?.id || '',
              changedAt: new Date().toISOString(),
              remark: isRework ? '提交返修完工' : '提交完工'
            };
            let updatedOrder = {
              ...order,
              status: newStatus,
              completions: [...order.completions, newCompletion],
              currentCompletionId: newCompletion.id,
              statusHistory: [...order.statusHistory, newHistory]
            };
            if (isRework && order.reworks.length > 0) {
              const reworks = order.reworks.map((r, idx) => 
                idx === order.reworks.length - 1 
                  ? { ...r, status: 'completed' as const, completionId: newCompletion.id } 
                  : r
              );
              updatedOrder = { ...updatedOrder, reworks };
            }
            return updatedOrder;
          }
          return order;
        });
        const order = orders.find(o => o.id === orderId);
        if (order) {
          get().addNotification({
            type: 'completion',
            orderId,
            orderNo: order.orderNo,
            message: `工单 ${order.orderNo} 已${isRework ? '返修' : ''}完工，待确认`,
            relatedUserId: 'user_1'
          });
        }
        set({ orders: orders as RepairOrder[] });
      },

      confirmCompletion: (orderId, completionId, remark) => {
        const state = get();
        const orders = state.orders.map(order => {
          if (order.id === orderId) {
            const completions = order.completions.map(c => {
              if (c.id === completionId) {
                return {
                  ...c,
                  confirmed: true,
                  confirmedBy: state.currentUser?.id || '',
                  confirmedAt: new Date().toISOString()
                };
              }
              return c;
            });
            const isReworkCompletion = completions.find(c => c.id === completionId)?.isRework;
            const newStatus = isReworkCompletion ? 'rework_completion_confirmed' : 'completion_confirmed';
            const newHistory: StatusHistory = {
              id: generateId(),
              orderId,
              status: newStatus,
              changedBy: state.currentUser?.id || '',
              changedAt: new Date().toISOString(),
              remark: remark || (isReworkCompletion ? '返修完工确认' : '完工确认')
            };
            let updatedOrder = {
              ...order,
              status: newStatus,
              completions,
              statusHistory: [...order.statusHistory, newHistory]
            };
            if (isReworkCompletion && order.reworks.length > 0) {
              const reworks = order.reworks.map((r, idx) => 
                idx === order.reworks.length - 1 ? { ...r, status: 'confirmed' as const } : r
              );
              updatedOrder = { ...updatedOrder, reworks };
            }
            return updatedOrder;
          }
          return order;
        });
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const completion = order.completions.find(c => c.id === completionId);
          get().addNotification({
            type: 'status_change',
            orderId,
            orderNo: order.orderNo,
            message: `工单 ${order.orderNo} 已${completion?.isRework ? '返修' : ''}完工确认`,
            relatedUserId: order.assignedTo
          });
        }
        set({ orders: orders as RepairOrder[] });
      },

      requestRework: (orderId, completionId, reason) => {
        const state = get();
        const orders = state.orders.map(order => {
          if (order.id === orderId) {
            const newRework: ReworkRecord = {
              id: generateId(),
              orderId,
              requestedBy: state.currentUser?.id || '',
              requestedAt: new Date().toISOString(),
              reason,
              originalCompletionId: completionId,
              assignedTo: order.assignedTo,
              status: 'pending'
            };
            const newHistory: StatusHistory = {
              id: generateId(),
              orderId,
              status: 'rework_requested',
              changedBy: state.currentUser?.id || '',
              changedAt: new Date().toISOString(),
              remark: `申请返修：${reason}`
            };
            return {
              ...order,
              status: 'rework_requested',
              reworks: [...order.reworks, newRework],
              statusHistory: [...order.statusHistory, newHistory]
            };
          }
          return order;
        });
        const order = orders.find(o => o.id === orderId);
        if (order) {
          get().addNotification({
            type: 'rework',
            orderId,
            orderNo: order.orderNo,
            message: `工单 ${order.orderNo} 申请二次返修：${reason}`,
            relatedUserId: order.assignedTo
          });
          get().addNotification({
            type: 'rework',
            orderId,
            orderNo: order.orderNo,
            message: `工单 ${order.orderNo} 申请二次返修`,
            relatedUserId: 'user_3'
          });
        }
        set({ orders: orders as RepairOrder[] });
      },

      updateOrderStatus: (orderId, status, remark) => {
        const state = get();
        const orders = state.orders.map(order => {
          if (order.id === orderId) {
            const newHistory: StatusHistory = {
              id: generateId(),
              orderId,
              status,
              changedBy: state.currentUser?.id || '',
              changedAt: new Date().toISOString(),
              remark
            };
            return { ...order, status, statusHistory: [...order.statusHistory, newHistory] };
          }
          return order;
        });
        set({ orders: orders as RepairOrder[] });
      },

      getOrdersForRole: (role) => {
        const state = get();
        const userId = state.currentUser?.id;
        switch (role) {
          case 'dorm_manager':
            return state.orders;
          case 'repair_worker':
            return state.orders.filter(o => o.assignedTo === userId);
          case 'logistics_supervisor':
            return state.orders;
          default:
            return state.orders;
        }
      },

      getPendingCount: (role) => {
        const orders = get().getOrdersForRole(role);
        const userId = get().currentUser?.id;
        switch (role) {
          case 'dorm_manager':
            return orders.filter(o => 
              o.status === 'completion_submitted' || 
              o.status === 'rework_completion_submitted'
            ).length;
          case 'repair_worker':
            return orders.filter(o => 
              o.status === 'assigned' || 
              o.status === 'rework_requested'
            ).length;
          case 'logistics_supervisor':
            return orders.filter(o => o.status === 'pending').length;
          default:
            return 0;
        }
      },

      addNotification: (notification) => {
        const state = get();
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          createdAt: new Date().toISOString(),
          read: false
        };
        set({ notifications: [newNotification, ...state.notifications] });
      },

      markNotificationRead: (id) => {
        const state = get();
        set({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        });
      },

      markAllNotificationsRead: () => {
        const state = get();
        set({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        });
      },

      exportBackup: () => {
        const state = get();
        return {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          orders: state.orders,
          users: state.users,
          notifications: state.notifications
        };
      },

      importBackup: (data) => {
        set({
          orders: data.orders || [],
          users: data.users || defaultUsers,
          notifications: data.notifications || [],
          initialized: true
        });
      },

      batchImportOrders: (ordersData) => {
        const state = get();
        const newOrders: RepairOrder[] = ordersData.map(orderData => {
          const newOrder: RepairOrder = {
            ...orderData,
            id: generateId(),
            orderNo: generateOrderNo(),
            createdAt: new Date().toISOString(),
            status: 'pending',
            completions: [],
            reworks: [],
            statusHistory: [{
              id: generateId(),
              orderId: '',
              status: 'pending',
              changedBy: state.currentUser?.id || '',
              changedAt: new Date().toISOString(),
              remark: '批量导入'
            }]
          };
          newOrder.statusHistory[0].orderId = newOrder.id;
          return newOrder;
        });
        set({ orders: [...state.orders, ...newOrders] });
      },

      getRecentActivity: () => {
        const state = get();
        const allHistory = state.orders.flatMap(o => o.statusHistory);
        return allHistory
          .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
          .slice(0, 20);
      }
    }),
    {
      name: 'campus-repair-storage',
      version: 1
    }
  )
);
