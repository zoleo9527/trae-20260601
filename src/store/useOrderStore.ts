import { create } from 'zustand';
import { Order, OrderHistory, ReworkRecord, ColorConfirm, OrderStatus } from '@/types';
import { MOCK_ORDERS, MOCK_HISTORY, MOCK_REWORKS, MOCK_COLOR_CONFIRMS } from '@/utils/mock';
import { useAuthStore } from './useAuthStore';

interface OrderState {
  orders: Order[];
  history: OrderHistory[];
  reworks: ReworkRecord[];
  colorConfirms: ColorConfirm[];
  
  getOrderById: (id: string) => Order | undefined;
  getHistoryByOrderId: (orderId: string) => OrderHistory[];
  getReworksByOrderId: (orderId: string) => ReworkRecord[];
  getColorConfirmsByOrderId: (orderId: string) => ColorConfirm[];
  
  confirmColor: (orderId: string, shade: string, remark?: string) => void;
  createRework: (orderId: string, reason: string, description: string, handler: string, remark?: string) => void;
  resolveRework: (reworkId: string, remark?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, remark?: string) => void;
  receiveModel: (orderId: string, remark?: string) => void;
  completeQualityCheck: (orderId: string, passed: boolean, remark?: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: MOCK_ORDERS,
  history: MOCK_HISTORY,
  reworks: MOCK_REWORKS,
  colorConfirms: MOCK_COLOR_CONFIRMS,
  
  getOrderById: (id) => get().orders.find(o => o.id === id),
  getHistoryByOrderId: (orderId) => 
    get().history.filter(h => h.orderId === orderId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  getReworksByOrderId: (orderId) => 
    get().reworks.filter(r => r.orderId === orderId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  getColorConfirmsByOrderId: (orderId) => 
    get().colorConfirms.filter(c => c.orderId === orderId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  
  confirmColor: (orderId, shade, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const newColorConfirm: ColorConfirm = {
      id: generateId(),
      orderId,
      shade,
      operator: currentUser.name,
      confirmed: true,
      remark,
      createdAt: now
    };
    
    set(state => ({
      colorConfirms: [...state.colorConfirms, newColorConfirm],
      orders: state.orders.map(o => 
        o.id === orderId 
          ? { ...o, shade, status: 'color_confirmed' as OrderStatus, updatedAt: now }
          : o
      ),
      history: [...state.history, {
        id: generateId(),
        orderId,
        action: '色号确认',
        operator: currentUser.name,
        operatorRole: currentUser.role,
        remark: remark || `确认色号 ${shade}`,
        createdAt: now
      }]
    }));
  },
  
  createRework: (orderId, reason, description, handler, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const newRework: ReworkRecord = {
      id: generateId(),
      orderId,
      reason,
      description,
      applicant: currentUser.name,
      handler,
      status: 'processing',
      createdAt: now
    };
    
    set(state => {
      const order = state.orders.find(o => o.id === orderId);
      return {
        reworks: [...state.reworks, newRework],
        orders: state.orders.map(o => 
          o.id === orderId 
            ? { 
                ...o, 
                status: 'rework' as OrderStatus, 
                reworkCount: (order?.reworkCount || 0) + 1,
                currentHandler: handler,
                updatedAt: now 
              }
            : o
        ),
        history: [...state.history, {
          id: generateId(),
          orderId,
          action: '提交返工',
          operator: currentUser.name,
          operatorRole: currentUser.role,
          remark: remark || `${reason}：${description}`,
          createdAt: now
        }]
      };
    });
  },
  
  resolveRework: (reworkId, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const rework = get().reworks.find(r => r.id === reworkId);
    if (!rework) return;
    
    set(state => ({
      reworks: state.reworks.map(r => 
        r.id === reworkId 
          ? { ...r, status: 'resolved' as const, resolvedAt: now }
          : r
      ),
      orders: state.orders.map(o => 
        o.id === rework.orderId 
          ? { ...o, status: 'quality_check' as OrderStatus, updatedAt: now }
          : o
      ),
      history: [...state.history, {
        id: generateId(),
        orderId: rework.orderId,
        action: '返工完成',
        operator: currentUser.name,
        operatorRole: currentUser.role,
        remark,
        createdAt: now
      }]
    }));
  },
  
  updateOrderStatus: (orderId, status, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const actionMap: Record<OrderStatus, string> = {
      pending: '更新状态为待处理',
      model_received: '更新状态为模型已接收',
      color_confirmed: '更新状态为色号已确认',
      in_production: '更新状态为生产中',
      quality_check: '更新状态为质检中',
      rework: '更新状态为返工中',
      completed: '更新状态为已完成'
    };
    
    set(state => ({
      orders: state.orders.map(o => 
        o.id === orderId ? { ...o, status, updatedAt: now } : o
      ),
      history: [...state.history, {
        id: generateId(),
        orderId,
        action: actionMap[status] || '状态更新',
        operator: currentUser.name,
        operatorRole: currentUser.role,
        remark: remark || `状态变更为 ${status}`,
        createdAt: now
      }]
    }));
  },
  
  receiveModel: (orderId, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    
    set(state => ({
      orders: state.orders.map(o => 
        o.id === orderId 
          ? { ...o, modelReceived: true, status: 'model_received' as OrderStatus, updatedAt: now }
          : o
      ),
      history: [...state.history, {
        id: generateId(),
        orderId,
        action: '模型已接收',
        operator: currentUser.name,
        operatorRole: currentUser.role,
        remark: remark || '口扫文件已确认接收',
        createdAt: now
      }]
    }));
  },
  
  completeQualityCheck: (orderId, passed, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const newStatus = passed ? 'completed' : 'rework';
    
    set(state => {
      const order = state.orders.find(o => o.id === orderId);
      return {
        orders: state.orders.map(o => 
          o.id === orderId 
            ? { 
                ...o, 
                status: newStatus as OrderStatus, 
                reworkCount: !passed ? (order?.reworkCount || 0) + 1 : o.reworkCount,
                updatedAt: now 
              }
            : o
        ),
        history: [...state.history, {
          id: generateId(),
          orderId,
          action: passed ? '质检通过' : '质检驳回',
          operator: currentUser.name,
          operatorRole: currentUser.role,
          remark: remark || (passed ? '质量检查通过，可以交付' : '质量检查未通过，需要返工'),
          createdAt: now
        }]
      };
    });
  }
}));
