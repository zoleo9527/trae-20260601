import { create } from 'zustand';
import { Order, OrderHistory, ReworkRecord, ColorConfirm, OrderStatus } from '@/types';
import { MOCK_ORDERS, MOCK_HISTORY, MOCK_REWORKS, MOCK_COLOR_CONFIRMS, DEMO_USERS } from '@/utils/mock';
import { useAuthStore } from './useAuthStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

const buildRemark = (userRemark: string | undefined, systemParts: string[]) => {
  const parts: string[] = [];
  if (userRemark?.trim()) {
    parts.push(userRemark.trim());
  }
  parts.push(...systemParts);
  return parts.join(' | ');
};

const formatTs = (iso: string) => {
  return format(new Date(iso), 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

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
    
    set(state => {
      const prevOrder = state.orders.find(o => o.id === orderId);
      return {
        colorConfirms: [...state.colorConfirms, newColorConfirm],
        orders: state.orders.map(o => 
          o.id === orderId 
            ? { 
                ...o, 
                shade, 
                status: 'color_confirmed' as OrderStatus, 
                currentHandler: currentUser.name,
                updatedAt: now 
              }
            : o
        ),
        history: [...state.history, {
          id: generateId(),
          orderId,
          action: '色号确认',
          operator: currentUser.name,
          operatorRole: currentUser.role,
          remark: buildRemark(remark, [
            `确认色号 ${shade}`,
            `状态: ${prevOrder?.status || 'unknown'} → color_confirmed`,
            `责任人: ${currentUser.name}`,
            `更新时间: ${formatTs(now)}`
          ]),
          createdAt: now
        }]
      };
    });
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
          remark: buildRemark(remark, [
            `${reason}：${description}`,
            `状态: ${order?.status || 'unknown'} → rework`,
            `责任人: ${handler}`,
            `更新时间: ${formatTs(now)}`
          ]),
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
    
    const inspector = DEMO_USERS.find((u: { role: string }) => u.role === 'inspector');
    const inspectorName = inspector?.name || '王质检';
    
    set(state => {
      const prevOrder = state.orders.find(o => o.id === rework.orderId);
      return {
        reworks: state.reworks.map(r => 
          r.id === reworkId 
            ? { ...r, status: 'resolved' as const, resolvedAt: now }
            : r
        ),
        orders: state.orders.map(o => 
          o.id === rework.orderId 
            ? { 
                ...o, 
                status: 'quality_check' as OrderStatus, 
                currentHandler: inspectorName,
                updatedAt: now 
              }
            : o
        ),
        history: [...state.history, {
          id: generateId(),
          orderId: rework.orderId,
          action: '返工完成',
          operator: currentUser.name,
          operatorRole: currentUser.role,
          remark: buildRemark(remark, [
            '返工处理完成，提交质检',
            `状态: ${prevOrder?.status || 'unknown'} → quality_check`,
            `责任人: ${inspectorName}`,
            `更新时间: ${formatTs(now)}`
          ]),
          createdAt: now
        }]
      };
    });
  },
  
  updateOrderStatus: (orderId, status, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const actionMap: Record<OrderStatus, string> = {
      pending: '更新状态为待处理',
      model_received: '更新状态为模型已接收',
      color_confirmed: '更新状态为色号已确认',
      in_production: '开始生产',
      quality_check: '提交质检',
      rework: '更新状态为返工中',
      completed: '更新状态为已完成'
    };
    
    const getNextHandler = (newStatus: OrderStatus, currentHandler: string) => {
      switch (newStatus) {
        case 'in_production':
        case 'color_confirmed':
        case 'model_received':
          return currentUser.name;
        case 'quality_check':
          const inspector = DEMO_USERS.find((u: { role: string }) => u.role === 'inspector');
          return inspector?.name || '王质检';
        case 'completed':
          const cs = DEMO_USERS.find((u: { role: string }) => u.role === 'customer_service');
          return cs?.name || '张小姐';
        default:
          return currentHandler;
      }
    };
    
    set(state => {
      const order = state.orders.find(o => o.id === orderId);
      const nextHandler = getNextHandler(status, order?.currentHandler || '');
      return {
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status, currentHandler: nextHandler, updatedAt: now } : o
        ),
        history: [...state.history, {
          id: generateId(),
          orderId,
          action: actionMap[status] || '状态更新',
          operator: currentUser.name,
          operatorRole: currentUser.role,
          remark: buildRemark(remark, [
            `状态: ${order?.status || 'unknown'} → ${status}`,
            `责任人: ${nextHandler}`,
            `更新时间: ${formatTs(now)}`
          ]),
          createdAt: now
        }]
      };
    });
  },
  
  receiveModel: (orderId, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    
    set(state => {
      const prevOrder = state.orders.find(o => o.id === orderId);
      return {
        orders: state.orders.map(o => 
          o.id === orderId 
            ? { 
                ...o, 
                modelReceived: true, 
                status: 'model_received' as OrderStatus, 
                currentHandler: currentUser.name,
                updatedAt: now 
              }
            : o
        ),
        history: [...state.history, {
          id: generateId(),
          orderId,
          action: '模型已接收',
          operator: currentUser.name,
          operatorRole: currentUser.role,
          remark: buildRemark(remark, [
            '口扫文件已确认接收',
            `状态: ${prevOrder?.status || 'unknown'} → model_received`,
            `责任人: ${currentUser.name}`,
            `更新时间: ${formatTs(now)}`
          ]),
          createdAt: now
        }]
      };
    });
  },
  
  completeQualityCheck: (orderId, passed, remark) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const newStatus = passed ? 'completed' : 'rework';
    
    const getNextHandler = (isPassed: boolean) => {
      if (isPassed) {
        const cs = DEMO_USERS.find((u: { role: string }) => u.role === 'customer_service');
        return cs?.name || '张小姐';
      } else {
        const designer = DEMO_USERS.find((u: { role: string }) => u.role === 'designer');
        return designer?.name || '李工';
      }
    };
    
    set(state => {
      const order = state.orders.find(o => o.id === orderId);
      const nextHandler = getNextHandler(passed);
      return {
        orders: state.orders.map(o => 
          o.id === orderId 
            ? { 
                ...o, 
                status: newStatus as OrderStatus, 
                reworkCount: !passed ? (order?.reworkCount || 0) + 1 : o.reworkCount,
                currentHandler: nextHandler,
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
          remark: buildRemark(remark, [
            passed ? '质量检查通过，可以交付' : '质量检查未通过，需要返工',
            `状态: ${order?.status || 'unknown'} → ${newStatus}`,
            `责任人: ${nextHandler}`,
            `更新时间: ${formatTs(now)}`
          ]),
          createdAt: now
        }]
      };
    });
  }
}));
