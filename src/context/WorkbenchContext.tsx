import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BatchAdjustment, InventoryAlert, Notification, Task, Batch, SKU, Role } from '../types';
import { mockAdjustments, mockAlerts, mockNotifications, mockTasks, mockBatches, mockSKUs } from '../data/mockData';

interface WorkbenchContextType {
  adjustments: BatchAdjustment[];
  alerts: InventoryAlert[];
  notifications: Notification[];
  tasks: Task[];
  batches: Batch[];
  skus: SKU[];
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  addAdjustment: (adjustment: Omit<BatchAdjustment, 'id'>) => void;
  approveAdjustment: (id: string, approver: string) => void;
  rejectAdjustment: (id: string, approver: string, reason: string) => void;
  completeAdjustment: (id: string) => void;
  handleAlert: (id: string, handler: string, result: string) => void;
  markNotificationRead: (id: string) => void;
  completeTask: (id: string) => void;
  refreshAlertsAfterAdjustment: (skuId: string) => void;
}

const WorkbenchContext = createContext<WorkbenchContextType | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [adjustments, setAdjustments] = useState<BatchAdjustment[]>(mockAdjustments);
  const [alerts, setAlerts] = useState<InventoryAlert[]>(mockAlerts);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [skus] = useState<SKU[]>(mockSKUs);
  const [currentRole, setCurrentRole] = useState<Role>('manager');

  const addAdjustment = useCallback((adjustment: Omit<BatchAdjustment, 'id'>) => {
    const newId = `ADJ${String(adjustments.length + 1).padStart(3, '0')}`;
    const newAdjustment: BatchAdjustment = { ...adjustment, id: newId };
    setAdjustments(prev => [...prev, newAdjustment]);
    
    const newNotification: Notification = {
      id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
      type: 'adjustment',
      title: '批号调整申请待审核',
      content: `${adjustment.applicant}提交了批号调整申请，请及时审核`,
      targetRole: 'manager',
      read: false,
      createTime: new Date().toLocaleString('zh-CN'),
      relatedId: newId
    };
    setNotifications(prev => [newNotification, ...prev]);

    const newTask: Task = {
      id: `TSK${String(tasks.length + 1).padStart(3, '0')}`,
      type: 'adjustment_audit',
      title: `审核批号调整申请 ${newId}`,
      priority: 'high',
      status: 'pending',
      assignee: '王经理',
      createTime: new Date().toLocaleString('zh-CN'),
      dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      relatedData: newId
    };
    setTasks(prev => [newTask, ...prev]);
  }, [adjustments.length, notifications.length, tasks.length]);

  const approveAdjustment = useCallback((id: string, approver: string) => {
    setAdjustments(prev => prev.map(adj => 
      adj.id === id ? { ...adj, status: 'approved', approver, approveTime: new Date().toLocaleString('zh-CN') } : adj
    ));

    setNotifications(prev => [...prev, {
      id: `NOT${String(prev.length + 1).padStart(3, '0')}`,
      type: 'adjustment',
      title: '批号调整已通过',
      content: `您提交的批号调整申请已通过${approver}审核`,
      targetRole: 'clerk',
      read: false,
      createTime: new Date().toLocaleString('zh-CN'),
      relatedId: id
    }]);

    const adjustment = adjustments.find(a => a.id === id);
    if (adjustment) {
      refreshAlertsAfterAdjustment(adjustment.skuId);
    }
  }, [adjustments]);

  const rejectAdjustment = useCallback((id: string, approver: string, reason: string) => {
    setAdjustments(prev => prev.map(adj => 
      adj.id === id ? { ...adj, status: 'rejected', approver, approveTime: new Date().toLocaleString('zh-CN'), rejectReason: reason } : adj
    ));

    setNotifications(prev => [...prev, {
      id: `NOT${String(prev.length + 1).padStart(3, '0')}`,
      type: 'adjustment',
      title: '批号调整已驳回',
      content: `您提交的批号调整申请被${approver}驳回，原因：${reason}`,
      targetRole: 'clerk',
      read: false,
      createTime: new Date().toLocaleString('zh-CN'),
      relatedId: id
    }]);
  }, []);

  const completeAdjustment = useCallback((id: string) => {
    setAdjustments(prev => prev.map(adj => 
      adj.id === id ? { ...adj, status: 'completed' } : adj
    ));

    const adjustment = adjustments.find(a => a.id === id);
    if (adjustment) {
      setBatches(prev => prev.map(batch => {
        if (batch.id === adjustment.originalBatchId) {
          return { ...batch, quantity: batch.quantity - adjustment.adjustQuantity };
        }
        if (batch.id === adjustment.newBatchId) {
          return { ...batch, quantity: batch.quantity + adjustment.adjustQuantity };
        }
        return batch;
      }));
    }
  }, [adjustments]);

  const handleAlert = useCallback((id: string, handler: string, result: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { 
        ...alert, 
        status: result === 'resolved' ? 'resolved' : 'processing',
        handler,
        handleTime: new Date().toLocaleString('zh-CN'),
        handleResult: result
      } : alert
    ));

    setTasks(prev => prev.map(task => 
      task.relatedData === id ? { ...task, status: 'completed' } : task
    ));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status: 'completed' } : task
    ));
  }, []);

  const refreshAlertsAfterAdjustment = useCallback((skuId: string) => {
    const sku = skus.find(s => s.id === skuId);
    const skuBatches = batches.filter(b => b.skuId === skuId);
    const totalStock = skuBatches.reduce((sum, b) => sum + b.quantity, 0);

    setAlerts(prev => {
      const existingAlert = prev.find(a => a.skuId === skuId);
      
      if (!existingAlert) {
        if (totalStock < sku!.safetyStock) {
          const alertLevel = totalStock < sku!.safetyStock * 0.5 ? 'red' : 
                            totalStock < sku!.safetyStock * 0.8 ? 'orange' : 'yellow';
          return [...prev, {
            id: `ALT${String(prev.length + 1).padStart(3, '0')}`,
            skuId,
            currentStock: totalStock,
            safetyStock: sku!.safetyStock,
            alertLevel,
            status: 'pending',
            createTime: new Date().toLocaleString('zh-CN'),
            relatedAdjustments: []
          }];
        }
        return prev;
      }

      return prev.map(alert => {
        if (alert.skuId === skuId) {
          const newLevel = totalStock < sku!.safetyStock * 0.5 ? 'red' : 
                          totalStock < sku!.safetyStock * 0.8 ? 'orange' : 
                          totalStock < sku!.safetyStock ? 'yellow' : 'resolved';
          
          if (newLevel === 'resolved') {
            return { ...alert, status: 'resolved', currentStock: totalStock };
          }
          return { ...alert, currentStock: totalStock, alertLevel: newLevel as 'red' | 'orange' | 'yellow' };
        }
        return alert;
      });
    });
  }, [skus, batches]);

  return (
    <WorkbenchContext.Provider value={{
      adjustments,
      alerts,
      notifications,
      tasks,
      batches,
      skus,
      currentRole,
      setCurrentRole,
      addAdjustment,
      approveAdjustment,
      rejectAdjustment,
      completeAdjustment,
      handleAlert,
      markNotificationRead,
      completeTask,
      refreshAlertsAfterAdjustment
    }}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbench() {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
}
