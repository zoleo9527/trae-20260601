import { create } from 'zustand';
import { Order, OrderHistory, FabricReservation, FabricHistory, PatternTask, PatternHistory, Reminder, User, OrderStatus, FabricStatus, PatternStatus } from '../types';
import { mockOrders, mockOrderHistory, mockFabricReservations, mockFabricHistory, mockPatternTasks, mockPatternHistory, mockReminders, mockUsers } from '../data/mockData';

interface AppState {
  orders: Order[];
  orderHistory: OrderHistory[];
  fabricReservations: FabricReservation[];
  fabricHistory: FabricHistory[];
  patternTasks: PatternTask[];
  patternHistory: PatternHistory[];
  reminders: Reminder[];
  users: User[];
  currentUser: User;
  
  setCurrentUser: (user: User) => void;
  
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, operatorId: string, operatorName: string, remark: string) => void;
  
  updateFabricStatus: (fabricId: string, newStatus: FabricStatus, remark: string) => void;
  
  updatePatternStatus: (taskId: string, newStatus: PatternStatus, remark: string) => void;
  
  assignPatternTask: (taskId: string, assigneeId: string, assigneeName: string) => void;
  
  addReminder: (targetId: string, targetType: 'fabric' | 'pattern', remark: string) => void;
  
  getOrderById: (orderId: string) => Order | undefined;
  
  getOrderHistory: (orderId: string) => OrderHistory[];
  
  getFabricByOrderId: (orderId: string) => FabricReservation | undefined;
  
  getFabricHistory: (fabricId: string) => FabricHistory[];
  
  getPatternTaskByOrderId: (orderId: string) => PatternTask | undefined;
  
  getPatternHistory: (taskId: string) => PatternHistory[];
  
  getReminders: (targetId: string, targetType: 'fabric' | 'pattern') => Reminder[];
}

export const useStore = create<AppState>((set, get) => ({
  orders: mockOrders,
  orderHistory: mockOrderHistory,
  fabricReservations: mockFabricReservations,
  fabricHistory: mockFabricHistory,
  patternTasks: mockPatternTasks,
  patternHistory: mockPatternHistory,
  reminders: mockReminders,
  users: mockUsers,
  currentUser: mockUsers[2],
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  updateOrderStatus: (orderId, newStatus, operatorId, operatorName, remark) => {
    const { orders, orderHistory } = get();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const historyEntry: OrderHistory = {
      id: `h${Date.now()}`,
      order_id: orderId,
      status_from: order.status,
      status_to: newStatus,
      operator_id: operatorId,
      operator_name: operatorName,
      change_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark,
    };
    
    set({
      orders: orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o),
      orderHistory: [...orderHistory, historyEntry],
    });
  },
  
  updateFabricStatus: (fabricId, newStatus, remark) => {
    const { fabricReservations, fabricHistory, currentUser } = get();
    const fabric = fabricReservations.find(f => f.id === fabricId);
    if (!fabric) return;
    
    const historyEntry: FabricHistory = {
      id: `fh${Date.now()}`,
      fabric_id: fabricId,
      order_id: fabric.order_id,
      status_from: fabric.status,
      status_to: newStatus,
      operator_id: currentUser.id,
      operator_name: currentUser.name,
      change_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark,
    };
    
    set({
      fabricReservations: fabricReservations.map(f => 
        f.id === fabricId ? { ...f, status: newStatus, remark } : f
      ),
      fabricHistory: [...fabricHistory, historyEntry],
    });
  },
  
  updatePatternStatus: (taskId, newStatus, remark) => {
    const { patternTasks, patternHistory, currentUser } = get();
    const task = patternTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const historyEntry: PatternHistory = {
      id: `ph${Date.now()}`,
      task_id: taskId,
      order_id: task.order_id,
      status_from: task.status,
      status_to: newStatus,
      operator_id: currentUser.id,
      operator_name: currentUser.name,
      change_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark,
    };
    
    set({
      patternTasks: patternTasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus, remark } : t
      ),
      patternHistory: [...patternHistory, historyEntry],
    });
  },
  
  assignPatternTask: (taskId, assigneeId, assigneeName) => {
    const { patternTasks, patternHistory, currentUser } = get();
    const task = patternTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const historyEntry: PatternHistory = {
      id: `ph${Date.now()}`,
      task_id: taskId,
      order_id: task.order_id,
      status_from: task.status,
      status_to: 'in_progress',
      operator_id: currentUser.id,
      operator_name: currentUser.name,
      change_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark: `分配给${assigneeName}`,
    };
    
    set({
      patternTasks: patternTasks.map(t => 
        t.id === taskId ? { ...t, assignee_id: assigneeId, assignee_name: assigneeName, status: 'in_progress' as PatternStatus } : t
      ),
      patternHistory: [...patternHistory, historyEntry],
    });
  },
  
  addReminder: (targetId, targetType, remark) => {
    const { reminders, currentUser } = get();
    
    const reminder: Reminder = {
      id: `r${Date.now()}`,
      target_id: targetId,
      target_type: targetType,
      operator_id: currentUser.id,
      operator_name: currentUser.name,
      reminder_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark,
    };
    
    set({
      reminders: [...reminders, reminder],
    });
  },
  
  getOrderById: (orderId) => get().orders.find(o => o.id === orderId),
  
  getOrderHistory: (orderId) => get().orderHistory
    .filter(h => h.order_id === orderId)
    .sort((a, b) => new Date(b.change_time).getTime() - new Date(a.change_time).getTime()),
  
  getFabricByOrderId: (orderId) => get().fabricReservations.find(f => f.order_id === orderId),
  
  getFabricHistory: (fabricId) => get().fabricHistory
    .filter(h => h.fabric_id === fabricId)
    .sort((a, b) => new Date(b.change_time).getTime() - new Date(a.change_time).getTime()),
  
  getPatternTaskByOrderId: (orderId) => get().patternTasks.find(t => t.order_id === orderId),
  
  getPatternHistory: (taskId) => get().patternHistory
    .filter(h => h.task_id === taskId)
    .sort((a, b) => new Date(b.change_time).getTime() - new Date(a.change_time).getTime()),
  
  getReminders: (targetId, targetType) => get().reminders
    .filter(r => r.target_id === targetId && r.target_type === targetType)
    .sort((a, b) => new Date(b.reminder_time).getTime() - new Date(a.reminder_time).getTime()),
}));