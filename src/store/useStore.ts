import { useState, useCallback } from 'react';
import type { Confirmation, CollectionRecord, ActionLog, Reminder } from '@/types';
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
    const confirmation = confirmations.find(c => c.id === id);
    const today = new Date().toISOString().split('T')[0];
    
    setConfirmations(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'confirmed', updatedAt: today } : c
    ));

    const existingCollection = collections.find(col => col.confirmationId === id);
    
    if (!existingCollection && confirmation) {
      const newCollection: CollectionRecord = {
        id: `CL${Date.now()}`,
        confirmationId: id,
        subjectCode: confirmation.subjectCode,
        subjectName: confirmation.subjectName,
        bidderName: confirmation.bidderName,
        bidderPhone: '待补充',
        totalAmount: confirmation.bidAmount,
        paidAmount: 0,
        remainingAmount: confirmation.balanceAmount,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `争议已解决（${today}），备注：${confirmation.notes || '无'}`,
        createdAt: today,
        updatedAt: today,
        reminders: [{
          id: `R${Date.now()}`,
          type: 'call',
          content: `争议处理回访：竞买人资格核实完成，流程继续`,
          sentAt: today,
          operator: '系统',
          result: 'success',
        }],
      };
      setCollections(prev => [...prev, newCollection]);
      addLog('解决争议', id, 'confirmation', '当前用户', `竞买资格争议已解决，自动生成催收记录`);
    } else if (existingCollection) {
      const disputeResolutionReminder: Reminder = {
        id: `R${Date.now()}`,
        type: 'call',
        content: `争议处理回访：竞买人资格核实完成，流程继续`,
        sentAt: today,
        operator: '系统',
        result: 'success',
      };
      setCollections(prev => prev.map(col => 
        col.confirmationId === id ? { 
          ...col, 
          notes: `${col.notes}\n争议解决记录（${today}）：竞买资格已核实，流程继续`,
          reminders: [...col.reminders, disputeResolutionReminder],
          updatedAt: today 
        } : col
      ));
      addLog('解决争议', id, 'confirmation', '当前用户', '竞买资格争议已解决');
    }
  }, [confirmations, collections, addLog]);

  const confirmCompletion = useCallback((id: string) => {
    const confirmation = confirmations.find(c => c.id === id);
    const today = new Date().toISOString().split('T')[0];
    
    setConfirmations(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'completed', updatedAt: today } : c
    ));

    const existingCollection = collections.find(col => col.confirmationId === id);
    
    if (!existingCollection && confirmation) {
      const newCollection: CollectionRecord = {
        id: `CL${Date.now()}`,
        confirmationId: id,
        subjectCode: confirmation.subjectCode,
        subjectName: confirmation.subjectName,
        bidderName: confirmation.bidderName,
        bidderPhone: '待补充',
        totalAmount: confirmation.bidAmount,
        paidAmount: confirmation.depositAmount,
        remainingAmount: confirmation.balanceAmount,
        status: 'first_reminder',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `成交确认完成（${today}），备注：${confirmation.notes || '无'}`,
        createdAt: today,
        updatedAt: today,
        reminders: [{
          id: `R${Date.now()}`,
          type: 'sms',
          content: `欢迎参与拍卖，您竞得的标的已进入尾款催收流程`,
          sentAt: today,
          operator: '系统',
          result: 'success',
        }],
      };
      setCollections(prev => [...prev, newCollection]);
      addLog('确认完成', id, 'confirmation', '当前用户', '成交确认完成，自动生成催收记录');
    } else if (existingCollection) {
      if (existingCollection.status === 'pending') {
        const startReminder: Reminder = {
          id: `R${Date.now()}`,
          type: 'sms',
          content: `欢迎参与拍卖，您竞得的标的已进入尾款催收流程`,
          sentAt: today,
          operator: '系统',
          result: 'success',
        };
        setCollections(prev => prev.map(col => 
          col.confirmationId === id ? { 
            ...col, 
            status: 'first_reminder' as const,
            notes: `${col.notes}\n成交确认完成（${today}）`,
            reminders: [...col.reminders, startReminder],
            updatedAt: today 
          } : col
        ));
      } else {
        setCollections(prev => prev.map(col => 
          col.confirmationId === id ? { ...col, updatedAt: today } : col
        ));
      }
      addLog('确认完成', id, 'confirmation', '当前用户', '成交确认完成');
    }
  }, [confirmations, collections, addLog]);

  const batchConfirm = useCallback((ids: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    setConfirmations(prev => prev.map(c => 
      ids.includes(c.id) ? { ...c, status: 'completed', updatedAt: today } : c
    ));

    const newCollections: CollectionRecord[] = [];
    
    ids.forEach(id => {
      const confirmation = confirmations.find(c => c.id === id);
      const existingCollection = collections.find(col => col.confirmationId === id);
      
      if (!existingCollection && confirmation) {
        newCollections.push({
          id: `CL${Date.now()}`,
          confirmationId: id,
          subjectCode: confirmation.subjectCode,
          subjectName: confirmation.subjectName,
          bidderName: confirmation.bidderName,
          bidderPhone: '待补充',
          totalAmount: confirmation.bidAmount,
          paidAmount: confirmation.depositAmount,
          remainingAmount: confirmation.balanceAmount,
          status: 'first_reminder',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: `批量确认完成（${today}），备注：${confirmation.notes || '无'}`,
          createdAt: today,
          updatedAt: today,
          reminders: [{
            id: `R${Date.now()}`,
            type: 'sms',
            content: `欢迎参与拍卖，您竞得的标的已进入尾款催收流程`,
            sentAt: today,
            operator: '系统',
            result: 'success',
          }],
        });
      } else if (existingCollection && existingCollection.status === 'pending') {
        const startReminder: Reminder = {
          id: `R${Date.now()}`,
          type: 'sms',
          content: `欢迎参与拍卖，您竞得的标的已进入尾款催收流程`,
          sentAt: today,
          operator: '系统',
          result: 'success',
        };
        setCollections(prev => prev.map(col => 
          col.confirmationId === id ? { 
            ...col, 
            status: 'first_reminder' as const,
            notes: `${col.notes}\n批量确认完成（${today}）`,
            reminders: [...col.reminders, startReminder],
            updatedAt: today 
          } : col
        ));
      }
    });

    if (newCollections.length > 0) {
      setCollections(prev => [...prev, ...newCollections]);
    }

    addLog('批量确认', ids.join(','), 'confirmation', '当前用户', `批量确认 ${ids.length} 条成交确认`);
  }, [confirmations, collections, addLog]);

  const sendReminder = useCallback((collectionId: string, type: 'sms' | 'call' | 'email' | 'letter', content: string, operator: string) => {
    setCollections(prev => prev.map(col => {
      if (col.id !== collectionId) return col;
      if (col.status === 'paid') return col;
      
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
    const collection = collections.find(c => c.id === collectionId);
    
    setCollections(prev => prev.map(col => {
      if (col.id !== collectionId) return col;
      return {
        ...col,
        paidAmount: col.totalAmount,
        remainingAmount: 0,
        status: 'paid',
        updatedAt: new Date().toISOString().split('T')[0],
        notes: `${col.notes || ''}\n${new Date().toISOString().split('T')[0]}：尾款已全部结清`,
      };
    }));

    addLog('确认收款', collectionId, 'collection', '当前用户', `确认${collection?.bidderName || ''}尾款${collection?.remainingAmount || 0}元到账`);
  }, [collections, addLog]);

  const batchRemind = useCallback((ids: string[], operator: string) => {
    const today = new Date().toISOString().split('T')[0];
    const processedIds: string[] = [];
    
    setCollections(prev => prev.map(col => {
      if (!ids.includes(col.id)) return col;
      if (col.status === 'paid') return col;
      
      processedIds.push(col.id);

      const newStatus = col.status === 'pending' ? 'first_reminder' : 
                        col.status === 'first_reminder' ? 'second_reminder' : 
                        col.status === 'second_reminder' ? 'legal_notice' : col.status;

      return {
        ...col,
        status: newStatus,
        lastRemindAt: today,
        reminders: [...col.reminders, {
          id: `R${Date.now()}`,
          type: 'sms' as const,
          content: `批量催收：请于${col.dueDate}前支付尾款${col.remainingAmount}元`,
          sentAt: today,
          operator,
          result: 'success' as const,
        }],
        updatedAt: today,
      };
    }));

    if (processedIds.length > 0) {
      addLog('批量催收', processedIds.join(','), 'collection', operator, `批量发送 ${processedIds.length} 条催收通知`);
    }
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

export type ConfirmationFilter = 'all' | 'pending' | 'dispute' | 'incomplete' | 'confirmed';
export type CollectionFilter = 'all' | 'pending' | 'overdue' | 'paid';

export function filterConfirmations(confirmations: Confirmation[], filter: ConfirmationFilter): Confirmation[] {
  switch (filter) {
    case 'pending':
      return confirmations.filter(c => c.status === 'pending');
    case 'dispute':
      return confirmations.filter(c => c.status === 'dispute');
    case 'incomplete':
      return confirmations.filter(c => 
        !c.dataCompleteness.subjectData || 
        !c.dataCompleteness.bidderQualification || 
        !c.dataCompleteness.contractSigned || 
        !c.dataCompleteness.otherDocuments
      );
    case 'confirmed':
      return confirmations.filter(c => c.status === 'confirmed');
    default:
      return confirmations;
  }
}

export function filterCollections(collections: CollectionRecord[], filter: CollectionFilter): CollectionRecord[] {
  const today = new Date();
  switch (filter) {
    case 'pending':
      return collections.filter(c => c.status !== 'paid');
    case 'overdue':
      return collections.filter(c => {
        const due = new Date(c.dueDate);
        return due < today && c.status !== 'paid';
      });
    case 'paid':
      return collections.filter(c => c.status === 'paid');
    default:
      return collections;
  }
}