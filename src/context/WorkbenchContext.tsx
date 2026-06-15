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
  currentUserName: string;
  setCurrentRole: (role: Role) => void;
  setCurrentUserName: (name: string) => void;
  addAdjustment: (adjustment: Omit<BatchAdjustment, 'id'>) => void;
  approveAdjustment: (id: string, approver: string) => void;
  rejectAdjustment: (id: string, approver: string, reason: string) => void;
  completeAdjustment: (id: string) => void;
  handleAlert: (id: string, handler: string, result: string) => void;
  markNotificationRead: (id: string) => void;
  markTaskBatchComplete: (taskIds: string[], approver: string) => void;
  completeTask: (id: string, approver?: string) => void;
  batchApproveAdjustments: (ids: string[], approver: string) => void;
  batchCompleteAdjustments: (ids: string[]) => void;
  batchRejectAdjustments: (ids: string[], approver: string, reason: string) => void;
  handleAlertBatch: (alertIds: string[], handler: string, result: string) => void;
}

const WorkbenchContext = createContext<WorkbenchContextType | null>(null);

let idCounter = { ADJ: 10, NOT: 10, TSK: 10, ALT: 10 };

function generateId(prefix: keyof typeof idCounter): string {
  const num = idCounter[prefix]++;
  return `${prefix}${String(num).padStart(3, '0')}`;
}

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [adjustments, setAdjustments] = useState<BatchAdjustment[]>(mockAdjustments);
  const [alerts, setAlerts] = useState<InventoryAlert[]>(mockAlerts);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [skus] = useState<SKU[]>(mockSKUs);
  const [currentRole, setCurrentRole] = useState<Role>('manager');
  const [currentUserName, setCurrentUserName] = useState<string>('王经理');

  const addAdjustment = useCallback((adjustment: Omit<BatchAdjustment, 'id'>) => {
    const newId = generateId('ADJ');
    setAdjustments(prev => [...prev, { ...adjustment, id: newId }]);
    
    setNotifications(prev => [...prev, {
      id: generateId('NOT'),
      type: 'adjustment',
      title: '批号调整申请待审核',
      content: `${adjustment.applicant}提交了批号调整申请，请及时审核`,
      targetRole: 'manager',
      read: false,
      createTime: new Date().toLocaleString('zh-CN'),
      relatedId: newId
    }]);

    setTasks(prev => [...prev, {
      id: generateId('TSK'),
      type: 'adjustment_audit',
      title: `审核批号调整申请 ${newId}`,
      priority: 'high',
      status: 'pending',
      assignee: '王经理',
      createTime: new Date().toLocaleString('zh-CN'),
      dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      relatedData: newId
    }]);
  }, []);

  const approveAdjustment = useCallback((id: string, approver: string) => {
    const adj = adjustments.find(a => a.id === id);
    if (!adj || adj.status !== 'pending') return;

    setAdjustments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'approved' as const, approver, approveTime: new Date().toLocaleString('zh-CN') } : a
    ));

    setNotifications(prev => [...prev, {
      id: generateId('NOT'),
      type: 'adjustment',
      title: '批号调整已通过',
      content: `您提交的批号调整申请已通过${approver}审核，请执行完成操作`,
      targetRole: 'clerk',
      read: false,
      createTime: new Date().toLocaleString('zh-CN'),
      relatedId: id
    }]);

    setTasks(prev => prev.map(t =>
      t.relatedData === id && t.type === 'adjustment_audit' && t.status === 'pending'
        ? { ...t, status: 'completed' as const } : t
    ));

    setTasks(prev => [...prev, {
      id: generateId('TSK'),
      type: 'adjustment_audit',
      title: `完成批号调整 ${id}`,
      priority: 'high',
      status: 'pending',
      assignee: adj.applicant,
      createTime: new Date().toLocaleString('zh-CN'),
      dueTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toLocaleString('zh-CN'),
      relatedData: id
    }]);

    const sku = skus.find(s => s.id === adj.skuId);
    const skuBatches = batches.filter(b => b.skuId === adj.skuId);
    const newStock = skuBatches.reduce((sum, b) => sum + b.quantity, 0) - adj.adjustQuantity;
    const needBuyerTask = sku && newStock < sku.safetyStock;
    const relatedAlert = alerts.find(a => a.skuId === adj.skuId && a.status !== 'resolved');

    if (relatedAlert) {
      const newAlertStock = relatedAlert.currentStock - adj.adjustQuantity;
      const newLevel: 'red' | 'orange' | 'yellow' = sku && newAlertStock < sku.safetyStock * 0.5 ? 'red' as const :
                      sku && newAlertStock < sku.safetyStock * 0.8 ? 'orange' as const : 'yellow' as const;
      const shouldResolve = sku && newAlertStock >= sku.safetyStock;

      setAlerts(prev => prev.map(alt => 
        alt.id === relatedAlert.id ? { ...alt, currentStock: newAlertStock, alertLevel: shouldResolve ? alt.alertLevel : newLevel, status: shouldResolve ? 'resolved' as const : alt.status, relatedAdjustments: [...alt.relatedAdjustments, id] } : alt
      ));

      if (needBuyerTask || relatedAlert) {
        setTasks(prev => [...prev, {
          id: generateId('TSK'),
          type: 'alert_response',
          title: `批号调整${id}已完成，请重新评估采购计划`,
          priority: 'high',
          status: 'pending',
          assignee: '采购刘',
          createTime: new Date().toLocaleString('zh-CN'),
          dueTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString('zh-CN'),
          relatedData: relatedAlert.id
        }]);

        setNotifications(prev => [...prev, {
          id: generateId('NOT'),
          type: 'alert',
          title: '批号调整完成，请评估采购计划',
          content: `批号调整${id}已完成，${sku?.name}库存已更新至${newAlertStock}，请重新评估采购计划`,
          targetRole: 'buyer',
          read: false,
          createTime: new Date().toLocaleString('zh-CN'),
          relatedId: relatedAlert.id
        }]);
      }
    } else if (needBuyerTask) {
      const newAlertId = generateId('ALT');
      setAlerts(prev => [...prev, {
        id: newAlertId,
        skuId: adj.skuId,
        currentStock: newStock,
        safetyStock: sku!.safetyStock,
        alertLevel: newStock < sku!.safetyStock * 0.5 ? 'red' as const :
                    newStock < sku!.safetyStock * 0.8 ? 'orange' as const : 'yellow' as const,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        relatedAdjustments: [id]
      }]);

      setTasks(prev => [...prev, {
        id: generateId('TSK'),
        type: 'alert_response',
        title: `批号调整${id}已完成，请重新评估采购计划`,
        priority: 'high',
        status: 'pending',
        assignee: '采购刘',
        createTime: new Date().toLocaleString('zh-CN'),
        dueTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString('zh-CN'),
        relatedData: newAlertId
      }]);

      setNotifications(prev => [...prev, {
        id: generateId('NOT'),
        type: 'alert',
        title: '批号调整完成，请评估采购计划',
        content: `批号调整${id}已完成，${sku?.name}库存已更新至${newStock}，请重新评估采购计划`,
        targetRole: 'buyer',
        read: false,
        createTime: new Date().toLocaleString('zh-CN'),
        relatedId: newAlertId
      }]);
    }
  }, [adjustments, alerts, batches, skus]);

  const rejectAdjustment = useCallback((id: string, approver: string, reason: string) => {
    const adj = adjustments.find(a => a.id === id);
    if (!adj || adj.status !== 'pending') return;

    setAdjustments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'rejected' as const, approver, approveTime: new Date().toLocaleString('zh-CN'), rejectReason: reason } : a
    ));

    setNotifications(prev => [...prev, {
      id: generateId('NOT'),
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
        ? { ...task, status: 'completed' as const } : task
    ));
  }, [adjustments]);

  const completeAdjustment = useCallback((id: string) => {
    const adj = adjustments.find(a => a.id === id);
    if (!adj || adj.status !== 'approved') return;
    
    setAdjustments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'completed' as const } : a
    ));

    setBatches(prev => prev.map(batch => {
      if (batch.id === adj.originalBatchId) {
        return { ...batch, quantity: batch.quantity - adj.adjustQuantity };
      }
      if (batch.id === adj.newBatchId) {
        return { ...batch, quantity: batch.quantity + adj.adjustQuantity };
      }
      return batch;
    }));

    setTasks(prev => prev.map(task =>
      task.relatedData === id && task.type === 'adjustment_audit'
        ? { ...task, status: 'completed' as const } : task
    ));

    const sku = skus.find(s => s.id === adj.skuId);
    const skuBatches = batches.filter(b => b.skuId === adj.skuId);
    const finalStock = skuBatches.reduce((sum, b) => sum + b.quantity, 0);
    
    setAlerts(prev => prev.map(alt => {
      if (alt.skuId === adj.skuId) {
        const newLevel = sku && finalStock < sku.safetyStock * 0.5 ? 'red' as const :
                        sku && finalStock < sku.safetyStock * 0.8 ? 'orange' as const :
                        sku && finalStock < sku.safetyStock ? 'yellow' as const : 'resolved' as const;
        
        if (newLevel === 'resolved') {
          setNotifications(notifPrev => [...notifPrev, {
            id: generateId('NOT'),
            type: 'alert',
            title: '库存预警已解除',
            content: `批号调整${id}完成后，${sku?.name}库存已恢复至安全水位以上`,
            targetRole: 'buyer',
            read: false,
            createTime: new Date().toLocaleString('zh-CN'),
            relatedId: alt.id
          }]);
          setTasks(taskPrev => taskPrev.map(t =>
            t.relatedData === alt.id && t.type === 'alert_response' && t.status === 'pending'
              ? { ...t, status: 'completed' as const } : t
          ));
          return { ...alt, status: 'resolved' as const, currentStock: finalStock, relatedAdjustments: [...alt.relatedAdjustments, id] };
        }
        return { ...alt, currentStock: finalStock, alertLevel: newLevel, relatedAdjustments: [...alt.relatedAdjustments, id] };
      }
      return alt;
    }));
  }, [adjustments, batches, skus]);

  const handleAlert = useCallback((id: string, handler: string, result: string) => {
    setAlerts(prev => prev.map(alt => 
      alt.id === id ? { ...alt, status: result === 'resolved' ? 'resolved' as const : 'processing' as const, handler, handleTime: new Date().toLocaleString('zh-CN'), handleResult: result } : alt
    ));

    setTasks(prev => prev.map(task => 
      task.relatedData === id && task.type === 'alert_response'
        ? { ...task, status: 'completed' as const } : task
    ));

    if (result !== 'resolved') {
      setNotifications(prev => [...prev, {
        id: generateId('NOT'),
        type: 'alert',
        title: '库存预警处理中',
        content: `预警${id}已由${handler}标记为处理中，处理方式：${result}`,
        targetRole: 'manager',
        read: false,
        createTime: new Date().toLocaleString('zh-CN'),
        relatedId: id
      }]);
    }
  }, []);

  const handleAlertBatch = useCallback((alertIds: string[], handler: string, result: string) => {
    alertIds.forEach(id => handleAlert(id, handler, result));
  }, [handleAlert]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  }, []);

  const completeTask = useCallback((id: string, approver?: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === 'completed') return;

    if (task.type === 'adjustment_audit' && task.title.includes('完成批号调整')) {
      completeAdjustment(task.relatedData);
    } else if (task.type === 'adjustment_audit' && task.title.includes('审核') && approver) {
      approveAdjustment(task.relatedData, approver);
    }
  }, [tasks, completeAdjustment, approveAdjustment]);

  const markTaskBatchComplete = useCallback((taskIds: string[], approver: string) => {
    taskIds.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.status === 'completed') return;

      if (task.type === 'adjustment_audit' && task.title.includes('完成批号调整')) {
        completeAdjustment(task.relatedData);
      } else if (task.type === 'adjustment_audit' && task.title.includes('审核')) {
        approveAdjustment(task.relatedData, approver);
      } else if (task.type === 'alert_response') {
        handleAlert(task.relatedData, currentUserName, '批量处理');
      }
    });
  }, [tasks, currentUserName, completeAdjustment, approveAdjustment, handleAlert]);

  const batchApproveAdjustments = useCallback((ids: string[], approver: string) => {
    const pendingIds = ids.filter(id => {
      const adj = adjustments.find(a => a.id === id);
      return adj && adj.status === 'pending';
    });
    pendingIds.forEach(id => approveAdjustment(id, approver));
  }, [adjustments, approveAdjustment]);

  const batchCompleteAdjustments = useCallback((ids: string[]) => {
    const approvedIds = ids.filter(id => {
      const adj = adjustments.find(a => a.id === id);
      return adj && adj.status === 'approved';
    });
    approvedIds.forEach(id => completeAdjustment(id));
  }, [adjustments, completeAdjustment]);

  const batchRejectAdjustments = useCallback((ids: string[], approver: string, reason: string) => {
    const pendingIds = ids.filter(id => {
      const adj = adjustments.find(a => a.id === id);
      return adj && adj.status === 'pending';
    });
    pendingIds.forEach(id => rejectAdjustment(id, approver, reason));
  }, [adjustments, rejectAdjustment]);

  return (
    <WorkbenchContext.Provider value={{
      adjustments,
      alerts,
      notifications,
      tasks,
      batches,
      skus,
      currentRole,
      currentUserName,
      setCurrentRole,
      setCurrentUserName,
      addAdjustment,
      approveAdjustment,
      rejectAdjustment,
      completeAdjustment,
      handleAlert,
      handleAlertBatch,
      markNotificationRead,
      markTaskBatchComplete,
      completeTask,
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
