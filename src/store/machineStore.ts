import { useState, useCallback } from 'react';
import type { Machine, ExportTask, DashboardStats, TestItem, ExceptionRecord } from '@/types';
import { seedMachines, seedExportTasks } from '@/data/seedData';

export function useMachineStore() {
  const [machines, setMachines] = useState<Machine[]>(seedMachines);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>(seedExportTasks);

  const getStats = useCallback((): DashboardStats => {
    const today = new Date().toISOString().split('T')[0];
    const todayTests = machines.filter(m => m.burnInTest?.startTime?.startsWith(today)).length;
    const todayDeliveries = machines.filter(m => m.delivery?.deliveryDate?.startsWith(today)).length;
    
    return {
      totalMachines: machines.length,
      pendingTest: machines.filter(m => m.status === 'pending').length,
      testing: machines.filter(m => m.status === 'testing').length,
      pendingApproval: machines.filter(m => m.status === 'pending_approval').length,
      approved: machines.filter(m => m.status === 'approved').length,
      rejected: machines.filter(m => m.status === 'rejected').length,
      completed: machines.filter(m => m.status === 'completed').length,
      exceptions: machines.reduce((acc, m) => acc + m.exceptions.filter(e => !e.resolved).length, 0),
      todayTests,
      todayDeliveries,
    };
  }, [machines]);

  const getMachineById = useCallback((id: string): Machine | undefined => {
    return machines.find(m => m.id === id);
  }, [machines]);

  const startBurnInTest = useCallback((machineId: string, operator: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId && m.status === 'pending') {
        const now = new Date().toLocaleString('zh-CN');
        return {
          ...m,
          status: 'testing',
          burnInTest: {
            id: `T${Date.now()}`,
            machineId,
            startTime: now,
            temperature: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            gpuUsage: 0,
            items: [
              { id: `TI${Date.now()}1`, name: 'CPU压力测试', description: 'AIDA64 FPU测试', status: 'pending', result: '', remarks: '' },
              { id: `TI${Date.now()}2`, name: '显卡测试', description: '3DMark Time Spy', status: 'pending', result: '', remarks: '' },
              { id: `TI${Date.now()}3`, name: '内存测试', description: 'MemTest86', status: 'pending', result: '', remarks: '' },
              { id: `TI${Date.now()}4`, name: '硬盘测试', description: 'CrystalDiskMark', status: 'pending', result: '', remarks: '' },
            ],
            overallStatus: 'running',
            remarks: '',
            operator,
            createdAt: now,
            updatedAt: now,
          },
          updatedAt: now,
          lastModifiedBy: operator,
        };
      }
      return m;
    }));
  }, []);

  const updateTestItem = useCallback((machineId: string, itemId: string, update: Partial<TestItem>) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId && m.burnInTest) {
        const updatedItems = m.burnInTest.items.map(item => 
          item.id === itemId ? { ...item, ...update, testedAt: update.status !== 'pending' ? new Date().toLocaleString('zh-CN') : item.testedAt } : item
        );
        
        const completedItems = updatedItems.filter(i => i.status !== 'pending' && i.status !== 'running');
        const hasFailed = updatedItems.some(i => i.status === 'failed');
        const allCompleted = completedItems.length === updatedItems.length;
        
        let overallStatus: 'pending' | 'running' | 'passed' | 'failed' = 'running';
        if (allCompleted && hasFailed) {
          overallStatus = 'failed';
        } else if (allCompleted && !hasFailed) {
          overallStatus = 'passed';
        }
        
        const now = new Date().toLocaleString('zh-CN');
        const status: Machine['status'] = overallStatus === 'failed' ? 'test_failed' : 
                                         overallStatus === 'passed' ? 'pending_approval' : 'testing';
        
        return {
          ...m,
          status,
          burnInTest: {
            ...m.burnInTest,
            items: updatedItems,
            overallStatus,
            endTime: overallStatus !== 'running' ? now : undefined,
            duration: overallStatus !== 'running' ? Math.round((new Date().getTime() - new Date(m.burnInTest.startTime).getTime()) / 60000) : undefined,
            updatedAt: now,
          },
          updatedAt: now,
          approval: overallStatus === 'passed' ? {
            id: `A${Date.now()}`,
            machineId,
            approver: '',
            status: 'pending',
            comments: '',
            createdAt: now,
          } : m.approval,
        };
      }
      return m;
    }));
  }, []);

  const addException = useCallback((machineId: string, exception: Omit<ExceptionRecord, 'id' | 'createdAt'>) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        const now = new Date().toLocaleString('zh-CN');
        return {
          ...m,
          exceptions: [...m.exceptions, { ...exception, id: `E${Date.now()}`, createdAt: now }],
          updatedAt: now,
        };
      }
      return m;
    }));
  }, []);

  const resolveException = useCallback((machineId: string, exceptionId: string, resolution: string, resolvedBy: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        const now = new Date().toLocaleString('zh-CN');
        return {
          ...m,
          exceptions: m.exceptions.map(e => 
            e.id === exceptionId ? { ...e, resolved: true, resolution, resolvedBy, resolvedAt: now } : e
          ),
          updatedAt: now,
          lastModifiedBy: resolvedBy,
        };
      }
      return m;
    }));
  }, []);

  const approveMachine = useCallback((machineId: string, approver: string, comments: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId && m.status === 'pending_approval') {
        const now = new Date().toLocaleString('zh-CN');
        return {
          ...m,
          status: 'approved',
          approval: m.approval ? {
            ...m.approval,
            approver,
            status: 'approved',
            comments,
            approvedAt: now,
          } : undefined,
          updatedAt: now,
          lastModifiedBy: approver,
        };
      }
      return m;
    }));
  }, []);

  const rejectMachine = useCallback((machineId: string, approver: string, comments: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId && (m.status === 'pending_approval' || m.status === 'approved')) {
        const now = new Date().toLocaleString('zh-CN');
        return {
          ...m,
          status: 'rejected',
          approval: m.approval ? {
            ...m.approval,
            approver,
            status: 'rejected',
            comments,
            approvedAt: now,
          } : undefined,
          updatedAt: now,
          lastModifiedBy: approver,
        };
      }
      return m;
    }));
  }, []);

  const returnToTesting = useCallback((machineId: string, operator: string, reason: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId && (m.status === 'test_failed' || m.status === 'rejected')) {
        const now = new Date().toLocaleString('zh-CN');
        return {
          ...m,
          status: 'pending',
          burnInTest: undefined,
          approval: undefined,
          exceptions: [...m.exceptions, {
            id: `E${Date.now()}`,
            machineId,
            type: 'other',
            description: reason,
            severity: 'medium',
            resolved: false,
            createdAt: now,
          }],
          updatedAt: now,
          lastModifiedBy: operator,
        };
      }
      return m;
    }));
  }, []);

  const completeDelivery = useCallback((machineId: string, delivery: Omit<Machine['delivery'], 'id' | 'createdAt'>) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId && m.status === 'approved') {
        const now = new Date().toLocaleString('zh-CN');
        return {
          ...m,
          status: 'completed',
          delivery: { ...delivery, id: `D${Date.now()}`, createdAt: now },
          updatedAt: now,
        };
      }
      return m;
    }));
  }, []);

  const createExportTask = useCallback((type: ExportTask['type']) => {
    const now = new Date().toLocaleString('zh-CN');
    const task: ExportTask = {
      id: `EXP${Date.now()}`,
      type,
      status: 'processing',
      filename: `${type}_report_${Date.now()}.xlsx`,
      totalRecords: machines.length,
      exportedRecords: 0,
      createdAt: now,
    };
    
    setExportTasks(prev => [...prev, task]);
    
    setTimeout(() => {
      setExportTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'completed' as const, exportedRecords: machines.length, completedAt: new Date().toLocaleString('zh-CN') } : t
      ));
    }, 2000);
  }, [machines.length]);

  return {
    machines,
    exportTasks,
    getStats,
    getMachineById,
    startBurnInTest,
    updateTestItem,
    addException,
    resolveException,
    approveMachine,
    rejectMachine,
    returnToTesting,
    completeDelivery,
    createExportTask,
  };
}
