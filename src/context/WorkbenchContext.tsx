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
  markTaskBatchComplete: (taskIds: string[]) => void;
  completeTask: (id: string) => void;
  refreshAlertsAfterAdjustment: (skuId: string, adjustmentId: string) => void;
  batchApproveAdjustments: (ids: string[], approver: string) => void;
  batchCompleteAdjustments: (ids: string[]) => void;
  batchRejectAdjustments: (ids: string[], approver: string, reason: string) => void;
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
    const adjustment = adjustments.find(a => a.id === id);
    
    setAdjustments(prev => prev.map(adj => 
      adj.id === id ? { ...adj, status: 'approved', approver, approveTime: new Date().toLocaleString('zh-CN') } : adj
    ));

    setNotifications(prev => [...prev, {
      id: `NOT${String(prev.length + 1).padStart(3, '0')}`,
      type: 'adjustment',
      title: '批号调整已通过',
      content: `您提交的批号调整申请已通过${approver}审核，请执行完成操作`,
      targetRole: 'clerk',
      read: false,
      createTime: new Date().toLocaleString('zh-CN'),
      relatedId: id
    }]);

    if (adjustment) {
      const newTask: Task = {
        id: `TSK${String(tasks.length + 1).padStart(3, '0')}`,
        type: 'adjustment_audit',
        title: `完成批号调整 ${id}`,
        priority: 'high',
        status: 'pending',
        assignee: adjustment.applicant,
        createTime: new Date().toLocaleString('zh-CN'),
        dueTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toLocaleString('zh-CN'),
        relatedData: id
      };
      setTasks(prev => [...prev, newTask]);

      const relatedAlert = alerts.find(a => a.skuId === adjustment.skuId && a.status !== 'resolved');
      if (relatedAlert) {
        const buyerTask: Task = {
          id: `TSK${String(tasks.length + 1).padStart(3, '0')}`,
          type: 'alert_response',
          title: `批号调整完成，请重新评估采购计划 ${id}`,
          priority: 'high',
          status: 'pending',
          assignee: '采购刘',
          createTime: new Date().toLocaleString('zh-CN'),
          dueTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          relatedData: relatedAlert.id
        };
        setTasks(prev => [...prev, buyerTask]);

        const buyerNotification: Notification = {
          id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
          type: 'alert',
          title: '批号调整完成，请评估采购计划',
          content: `批号调整${id}已完成，库存数据已更新，请重新评估采购计划`,
          targetRole: 'buyer',
          read: false,
          createTime: new Date().toLocaleString('zh-CN'),
          relatedId: relatedAlert.id
        };
        setNotifications(prev => [buyerNotification, ...prev]);
      }

      refreshAlertsAfterAdjustment(adjustment.skuId, id);
    }
  }, [adjustments, alerts, tasks.length, notifications.length]);

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

    setTasks(prev => prev.map(task =>
      task.relatedData === id && task.type === 'adjustment_audit' && task.status === 'pending'
        ? { ...task, status: 'completed' }
        : task
    ));
  }, []);

  const completeAdjustment = useCallback((id: string) => {
    const adjustment = adjustments.find(a => a.id === id);
    
    setAdjustments(prev => prev.map(adj => 
      adj.id === id ? { ...adj, status: 'completed' } : adj
    ));

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

      setTasks(prev => prev.map(task =>
        task.relatedData === id && task.type === 'adjustment_audit'
          ? { ...task, status: 'completed' }
          : task
      ));

      refreshAlertsAfterAdjustment(adjustment.skuId, id);
    }
  }, [adjustments]);

  const handleAlert = useCallback((id: string, handler: string, result: string) => {
    const alert = alerts.find(a => a.id === id);
    
    setAlerts(prev => prev.map(alt => 
      alt.id === id ? { 
        ...alt, 
        status: result === 'resolved' ? 'resolved' : 'processing',
        handler,
        handleTime: new Date().toLocaleString('zh-CN'),
        handleResult: result
      } : alt
    ));

    setTasks(prev => prev.map(task => 
      task.relatedData === id && task.type === 'alert_response'
        ? { ...task, status: 'completed' }
        : task
    ));

    if (alert && result !== 'resolved') {
      const newNotification: Notification = {
        id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
        type: 'alert',
        title: '库存预警处理中',
        content: `预警${id}已由${handler}标记为处理中，处理方式：${result}`,
        targetRole: 'manager',
        read: false,
        createTime: new Date().toLocaleString('zh-CN'),
        relatedId: id
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [alerts, notifications.length]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  }, []);

  const completeTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'completed' } : t
    ));

    if (task) {
      if (task.type === 'adjustment_audit' && task.title.includes('完成批号调整')) {
        const adjustmentId = task.relatedData;
        completeAdjustment(adjustmentId);
      }
    }
  }, [tasks, completeAdjustment]);

  const markTaskBatchComplete = useCallback((taskIds: string[]) => {
    setTasks(prev => prev.map(task =>
      taskIds.includes(task.id)
        ? { ...task, status: 'completed' }
        : task
    ));
  }, []);

  const refreshAlertsAfterAdjustment = useCallback((skuId: string, adjustmentId: string) => {
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
            relatedAdjustments: [adjustmentId]
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
            const resolvedNotification: Notification = {
              id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
              type: 'alert',
              title: '库存预警已解除',
              content: `批号调整${adjustmentId}完成后，${sku?.name}库存已恢复至安全水位以上，预警自动解除`,
              targetRole: 'buyer',
              read: false,
              createTime: new Date().toLocaleString('zh-CN'),
              relatedId: alert.id
            };
            setNotifications(prev => [resolvedNotification, ...prev]);

            setTasks(taskPrev => taskPrev.map(t =>
              t.relatedData === alert.id && t.type === 'alert_response' && t.status === 'pending'
                ? { ...t, status: 'completed' }
                : t
            ));

            return { ...alert, status: 'resolved', currentStock: totalStock, relatedAdjustments: [...alert.relatedAdjustments, adjustmentId] };
          }
          return { ...alert, currentStock: totalStock, alertLevel: newLevel as 'red' | 'orange' | 'yellow', relatedAdjustments: [...alert.relatedAdjustments, adjustmentId] };
        }
        return alert;
      });
    });
  }, [skus, batches, notifications.length]);

  const batchApproveAdjustments = useCallback((ids: string[], approver: string) => {
    ids.forEach(id => approveAdjustment(id, approver));
  }, [approveAdjustment]);

  const batchCompleteAdjustments = useCallback((ids: string[]) => {
    ids.forEach(id => completeAdjustment(id));
  }, [completeAdjustment]);

  const batchRejectAdjustments = useCallback((ids: string[], approver: string, reason: string) => {
    ids.forEach(id => rejectAdjustment(id, approver, reason));
  }, [rejectAdjustment]);

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
      markTaskBatchComplete,
      completeTask,
      refreshAlertsAfterAdjustment,
      batchApproveAdjustments,
      batchCompleteAdjustments,
      batchRejectAdjustments
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
