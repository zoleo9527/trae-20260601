import { useState, useCallback } from 'react';
import type { Confirmation, CollectionRecord, ActionLog } from '@/types';
import { mockConfirmations, mockCollectionRecords, mockActionLogs } from '@/data/mockData';

export interface StoreState {
  confirmations: Confirmation[];
  collections: CollectionRecord[];
  logs: ActionLog[];
}

export interface StoreActions {
  updateConfirmation: (id: string, updates: Partial<Confirmation>) => void;
  resolveDispute: (id: string) => void;
  confirmCompletion: (id: string) => void;
  batchConfirm: (ids: string[]) => void;
  sendReminder: (collectionId: string, type: 'sms' | 'call' | 'email' | 'letter', content: string, operator: string) => void;
  confirmPayment: (collectionId: string) => void;
  batchRemind: (ids: string[], operator: string) => void;
  addLog: (type: string, targetId: string, targetType: 'confirmation' | 'collection', operator: string, content: string) => void;
}

export function useStore() {
  const [confirmations, setConfirmations] = useState<Confirmation[]>(mockConfirmations);
  const [collections, setCollections] = useState<CollectionRecord[]>(mockCollectionRecords);
  const [logs, setLogs] = useState<ActionLog[]>(mockActionLogs);

  const addLog = useCallback((type: string, targetId: string, targetType: 'confirmation' | 'collection', operator: string, content: string) => {
    const newLog: ActionLog = {
      id: `L${Date.now()}`,
      type,
      targetId,
      targetType,
      operator,
      content,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const updateConfirmation = useCallback((id: string, updates: Partial<Confirmation>) => {
    setConfirmations(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : c
    ));
    
    setCollections(prev => prev.map(col => 
      col.confirmationId === id ? { ...col, notes: updates.notes || col.notes, updatedAt: new Date().toISOString().split('T')[0] } : col
    ));

    addLog('编辑成交确认', id, 'confirmation', '当前用户', `修改成交确认信息：${updates.notes ? '更新备注' : '更新状态'}`);
  }, [addLog]);

  const resolveDispute = useCallback((id: string) => {
    setConfirmations(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'confirmed', updatedAt: new Date().toISOString().split('T')[0] } : c
    ));
    
    addLog('解决争议', id, 'confirmation', '当前用户', '竞买资格争议已解决');
  }, [addLog]);

  const confirmCompletion = useCallback((id: string) => {
    setConfirmations(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'completed', updatedAt: new Date().toISOString().split('T')[0] } : c
    ));
    
    setCollections(prev => prev.map(col => 
      col.confirmationId === id ? { ...col, status: 'first_reminder' as const, updatedAt: new Date().toISOString().split('T')[0] } : col
    ));

    addLog('确认完成', id, 'confirmation', '当前用户', '成交确认完成，进入催收流程');
  }, [addLog]);

  const batchConfirm = useCallback((ids: string[]) => {
    setConfirmations(prev => prev.map(c => 
      ids.includes(c.id) ? { ...c, status: 'completed', updatedAt: new Date().toISOString().split('T')[0] } : c
    ));
    
    setCollections(prev => prev.map(col => 
      ids.includes(col.confirmationId) ? { ...col, status: 'first_reminder' as const, updatedAt: new Date().toISOString().split('T')[0] } : col
    ));

    addLog('批量确认', ids.join(','), 'confirmation', '当前用户', `批量确认 ${ids.length} 条成交确认`);
  }, [addLog]);

  const sendReminder = useCallback((collectionId: string, type: 'sms' | 'call' | 'email' | 'letter', content: string, operator: string) => {
    setCollections(prev => prev.map(col => {
      if (col.id !== collectionId) return col;
      
      const newStatus = col.status === 'pending' ? 'first_reminder' : 
                        col.status === 'first_reminder' ? 'second_reminder' : 
                        col.status === 'second_reminder' ? 'legal_notice' : col.status;

      return {
        ...col,
        status: newStatus,
        lastRemindAt: new Date().toISOString().split('T')[0],
        reminders: [...col.reminders, {
          id: `R${Date.now()}`,
          type,
          content,
          sentAt: new Date().toISOString().split('T')[0],
          operator,
          result: 'success' as const,
        }],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }));

    addLog('发送催收', collectionId, 'collection', operator, `发送${type === 'sms' ? '短信' : type === 'call' ? '电话' : type === 'email' ? '邮件' : '信函'}催收`);
  }, [addLog]);

  const confirmPayment = useCallback((collectionId: string) => {
    setCollections(prev => prev.map(col => {
      if (col.id !== collectionId) return col;
      return {
        ...col,
        paidAmount: col.totalAmount,
        remainingAmount: 0,
        status: 'paid',
        updatedAt: new Date().toISOString().split('T')[0],
        notes: `${col.notes || ''}\n${new Date().toISOString().split('T')[0]}: 尾款已全部结清`,
      };
    }));

    addLog('确认收款', collectionId, 'collection', '当前用户', '确认尾款到账');
  }, [addLog]);

  const batchRemind = useCallback((ids: string[], operator: string) => {
    setCollections(prev => prev.map(col => {
      if (!ids.includes(col.id)) return col;

      const newStatus = col.status === 'pending' ? 'first_reminder' : 
                        col.status === 'first_reminder' ? 'second_reminder' : 
                        col.status === 'second_reminder' ? 'legal_notice' : col.status;

      return {
        ...col,
        status: newStatus,
        lastRemindAt: new Date().toISOString().split('T')[0],
        reminders: [...col.reminders, {
          id: `R${Date.now()}`,
          type: 'sms' as const,
          content: `批量催收：请于${col.dueDate}前支付尾款${col.remainingAmount}元`,
          sentAt: new Date().toISOString().split('T')[0],
          operator,
          result: 'success' as const,
        }],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }));

    addLog('批量催收', ids.join(','), 'collection', operator, `批量发送 ${ids.length} 条催收通知`);
  }, [addLog]);

  return {
    state: { confirmations, collections, logs },
    actions: {
      updateConfirmation,
      resolveDispute,
      confirmCompletion,
      batchConfirm,
      sendReminder,
      confirmPayment,
      batchRemind,
      addLog,
    },
  };
}

export interface TodoStats {
  pendingConfirmations: number;
  incompleteData: number;
  disputes: number;
  pendingCollections: number;
  overdueCollections: number;
  totalConfirmations: number;
  totalCollections: number;
}

export function getTodoStats(confirmations: Confirmation[], collections: CollectionRecord[]): TodoStats {
  const today = new Date();
  
  return {
    pendingConfirmations: confirmations.filter(c => c.status === 'pending').length,
    incompleteData: confirmations.filter(c => 
      !c.dataCompleteness.subjectData || 
      !c.dataCompleteness.bidderQualification || 
      !c.dataCompleteness.contractSigned || 
      !c.dataCompleteness.otherDocuments
    ).length,
    disputes: confirmations.filter(c => c.status === 'dispute').length,
    pendingCollections: collections.filter(c => c.status !== 'paid').length,
    overdueCollections: collections.filter(c => {
      const due = new Date(c.dueDate);
      return due < today && c.status !== 'paid';
    }).length,
    totalConfirmations: confirmations.length,
    totalCollections: collections.length,
  };
}