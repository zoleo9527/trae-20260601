import type { Machine, ExportTask, DashboardStats, TestItem, ExceptionRecord, OperationRecord } from '@/types';
import { seedMachines, seedExportTasks } from '@/data/seedData';
import { getStoredData, setStoredData, STORAGE_KEYS } from '@/utils/storage';

function loadMachines(): Machine[] {
  return getStoredData<Machine[]>(STORAGE_KEYS.MACHINES, seedMachines);
}



function loadExportTasks(): ExportTask[] {
  return getStoredData<ExportTask[]>(STORAGE_KEYS.EXPORT_TASKS, seedExportTasks);
}

function saveExportTasks(tasks: ExportTask[]): void {
  setStoredData(STORAGE_KEYS.EXPORT_TASKS, tasks);
}

export function getMachines(): Machine[] {
  return loadMachines();
}

export function getMachineById(id: string): Machine | undefined {
  return loadMachines().find(m => m.id === id);
}

export function getStats(): DashboardStats {
  const machines = loadMachines();
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
}

export function addOperation(machine: Machine, type: OperationRecord['type'], description: string, data?: Record<string, unknown>): OperationRecord {
  const operation: OperationRecord = {
    id: `OP${Date.now()}`,
    machineId: machine.id,
    type,
    operator: machine.lastModifiedBy,
    description,
    createdAt: new Date().toLocaleString('zh-CN'),
    data,
  };
  return operation;
}

export function startBurnInTest(machineId: string, operator: string): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId && m.status === 'pending') {
      const newOperation: OperationRecord = {
        id: `OP${Date.now()}`,
        machineId,
        type: 'start_test',
        operator,
        description: '开始烤机测试',
        createdAt: now,
      };
      
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
        operations: [...m.operations, newOperation],
        updatedAt: now,
        lastModifiedBy: operator,
      };
    }
    return m;
  });
}

export function updateTestItem(machineId: string, itemId: string, update: Partial<TestItem>): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId && m.burnInTest) {
      const updatedItems = m.burnInTest.items.map(item => 
        item.id === itemId ? { ...item, ...update, testedAt: update.status !== 'pending' ? now : item.testedAt } : item
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
      
      const status: Machine['status'] = overallStatus === 'failed' ? 'test_failed' : 
                                       overallStatus === 'passed' ? 'pending_approval' : 'testing';

      const operations: OperationRecord[] = [...m.operations];
      
      if (update.status) {
        operations.push({
          id: `OP${Date.now()}`,
          machineId,
          type: 'update_test_item',
          operator: m.lastModifiedBy,
          description: `${update.status === 'passed' ? '通过' : update.status === 'failed' ? '失败' : '跳过'}: ${updatedItems.find(i => i.id === itemId)?.name}`,
          createdAt: now,
          data: { itemId, status: update.status },
        });
      }
      
      if (allCompleted) {
        operations.push({
          id: `OP${Date.now()}`,
          machineId,
          type: 'complete_test',
          operator: m.lastModifiedBy,
          description: `烤机测试完成，结果：${overallStatus === 'passed' ? '通过' : '失败'}`,
          createdAt: now,
        });
      }
      
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
        operations,
        approval: overallStatus === 'passed' ? {
          id: `A${Date.now()}`,
          machineId,
          approver: '',
          status: 'pending',
          comments: '',
          createdAt: now,
        } : m.approval,
        updatedAt: now,
      };
    }
    return m;
  });
}

export function addException(machineId: string, exception: Omit<ExceptionRecord, 'id' | 'createdAt'>): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId) {
      const newException: ExceptionRecord = {
        ...exception,
        id: `E${Date.now()}`,
        createdAt: now,
      };
      
      const newOperation: OperationRecord = {
        id: `OP${Date.now()}`,
        machineId,
        type: 'add_exception',
        operator: m.lastModifiedBy,
        description: `记录异常：${exception.description}`,
        createdAt: now,
      };
      
      return {
        ...m,
        exceptions: [...m.exceptions, newException],
        operations: [...m.operations, newOperation],
        updatedAt: now,
      };
    }
    return m;
  });
}

export function resolveException(machineId: string, exceptionId: string, resolution: string, resolvedBy: string): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId) {
      const newOperation: OperationRecord = {
        id: `OP${Date.now()}`,
        machineId,
        type: 'resolve_exception',
        operator: resolvedBy,
        description: `处理异常：${resolution}`,
        createdAt: now,
      };
      
      return {
        ...m,
        exceptions: m.exceptions.map(e => 
          e.id === exceptionId ? { ...e, resolved: true, resolution, resolvedBy, resolvedAt: now } : e
        ),
        operations: [...m.operations, newOperation],
        updatedAt: now,
        lastModifiedBy: resolvedBy,
      };
    }
    return m;
  });
}

export function approveMachine(machineId: string, approver: string, comments: string): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId && m.status === 'pending_approval') {
      const newOperation: OperationRecord = {
        id: `OP${Date.now()}`,
        machineId,
        type: 'approve',
        operator: approver,
        description: '验收通过',
        createdAt: now,
      };
      
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
        operations: [...m.operations, newOperation],
        updatedAt: now,
        lastModifiedBy: approver,
      };
    }
    return m;
  });
}

export function rejectMachine(machineId: string, approver: string, comments: string): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId && (m.status === 'pending_approval' || m.status === 'approved')) {
      const newOperation: OperationRecord = {
        id: `OP${Date.now()}`,
        machineId,
        type: 'reject',
        operator: approver,
        description: `验收驳回：${comments}`,
        createdAt: now,
      };
      
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
        operations: [...m.operations, newOperation],
        updatedAt: now,
        lastModifiedBy: approver,
      };
    }
    return m;
  });
}

export function returnToTesting(machineId: string, operator: string, reason: string): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId && (m.status === 'test_failed' || m.status === 'rejected')) {
      const newException: ExceptionRecord = {
        id: `E${Date.now()}`,
        machineId,
        type: 'other',
        description: reason,
        severity: 'medium',
        resolved: false,
        createdAt: now,
      };
      
      const newOperation: OperationRecord = {
        id: `OP${Date.now()}`,
        machineId,
        type: 'return',
        operator,
        description: `退回处理：${reason}`,
        createdAt: now,
      };
      
      const burnInTestHistory = m.burnInTest ? [...m.burnInTestHistory, m.burnInTest] : m.burnInTestHistory;
      const approvalHistory = m.approval ? [...m.approvalHistory, m.approval] : m.approvalHistory;
      
      return {
        ...m,
        status: 'pending',
        burnInTest: undefined,
        burnInTestHistory,
        approval: undefined,
        approvalHistory,
        exceptions: [...m.exceptions, newException],
        operations: [...m.operations, newOperation],
        updatedAt: now,
        lastModifiedBy: operator,
      };
    }
    return m;
  });
}

export function completeDelivery(machineId: string, delivery: Omit<Machine['delivery'], 'id' | 'createdAt'>): Machine[] {
  const machines = loadMachines();
  const now = new Date().toLocaleString('zh-CN');
  
  return machines.map(m => {
    if (m.id === machineId && m.status === 'approved') {
      const newOperation: OperationRecord = {
        id: `OP${Date.now()}`,
        machineId,
        type: 'complete_delivery',
        operator: m.lastModifiedBy,
        description: '完成交付',
        createdAt: now,
      };
      
      const updatedMachine: Machine = {
        ...m,
        status: 'completed',
        delivery: { ...delivery, id: `D${Date.now()}`, machineId, createdAt: now } as Machine['delivery'],
        operations: [...m.operations, newOperation],
        updatedAt: now,
      };
      return updatedMachine;
    }
    return m;
  });
}

export function getExportTasks(): ExportTask[] {
  return loadExportTasks();
}

export function createExportTask(type: ExportTask['type']): { machines: Machine[], tasks: ExportTask[] } {
  const machines = loadMachines();
  const tasks = loadExportTasks();
  const now = new Date().toLocaleString('zh-CN');
  
  const task: ExportTask = {
    id: `EXP${Date.now()}`,
    type,
    status: 'processing',
    filename: `${type}_report_${Date.now().toString().replace(/\D/g, '').slice(-12)}.xlsx`,
    totalRecords: machines.length,
    exportedRecords: 0,
    createdAt: now,
  };
  
  const newTasks = [...tasks, task];
  saveExportTasks(newTasks);
  
  return { machines, tasks: newTasks };
}

export function completeExportTask(taskId: string, machines: Machine[]): ExportTask[] {
  const tasks = loadExportTasks();
  return tasks.map(t => 
    t.id === taskId ? { ...t, status: 'completed' as const, exportedRecords: machines.length, completedAt: new Date().toLocaleString('zh-CN') } : t
  );
}

export function generateReportData(type: ExportTask['type'], machines: Machine[]): string {
  const headers = {
    burn_in_test: ['订单号', '客户姓名', '配置', '测试状态', '测试开始时间', '测试结束时间', '测试时长', '操作人员'],
    delivery: ['订单号', '客户姓名', '交付日期', '交付地址', '签收人', '配件清单', '保修卡', '发票'],
    exception: ['订单号', '客户姓名', '异常类型', '严重程度', '异常描述', '状态', '创建时间'],
    all: ['订单号', '客户姓名', '配置', '状态', '测试状态', '验收状态', '交付状态', '创建时间'],
  };
  
  const rows: string[][] = [];
  
  machines.forEach(m => {
    if (type === 'burn_in_test' && m.burnInTest) {
      rows.push([
        m.orderNo,
        m.customerName,
        m.configuration,
        m.burnInTest.overallStatus === 'passed' ? '通过' : m.burnInTest.overallStatus === 'failed' ? '失败' : '进行中',
        m.burnInTest.startTime,
        m.burnInTest.endTime || '',
        m.burnInTest.duration ? `${Math.floor(m.burnInTest.duration / 60)}小时${m.burnInTest.duration % 60}分钟` : '',
        m.burnInTest.operator,
      ]);
    } else if (type === 'delivery' && m.delivery) {
      rows.push([
        m.orderNo,
        m.customerName,
        m.delivery.deliveryDate,
        m.delivery.address,
        m.delivery.signer,
        m.delivery.accessories.join(';'),
        m.delivery.warrantyCard ? '是' : '否',
        m.delivery.invoice ? '是' : '否',
      ]);
    } else if (type === 'exception') {
      m.exceptions.forEach(e => {
        rows.push([
          m.orderNo,
          m.customerName,
          e.type === 'hardware' ? '硬件问题' : e.type === 'software' ? '软件问题' : e.type === 'configuration' ? '配置问题' : '其他',
          e.severity === 'low' ? '低' : e.severity === 'medium' ? '中' : e.severity === 'high' ? '高' : '严重',
          e.description,
          e.resolved ? '已解决' : '待处理',
          e.createdAt,
        ]);
      });
    } else if (type === 'all') {
      rows.push([
        m.orderNo,
        m.customerName,
        m.configuration,
        m.status === 'pending' ? '待测试' : 
        m.status === 'testing' ? '测试中' :
        m.status === 'test_failed' ? '测试失败' :
        m.status === 'pending_approval' ? '待验收' :
        m.status === 'approved' ? '验收通过' :
        m.status === 'rejected' ? '验收驳回' : '已交付',
        m.burnInTest ? (m.burnInTest.overallStatus === 'passed' ? '通过' : m.burnInTest.overallStatus === 'failed' ? '失败' : '进行中') : '',
        m.approval ? (m.approval.status === 'approved' ? '通过' : m.approval.status === 'rejected' ? '驳回' : '待审批') : '',
        m.delivery ? '已交付' : '',
        m.createdAt,
      ]);
    }
  });
  
  return [headers[type], ...rows].map(row => row.join('\t')).join('\n');
}

export function saveReportAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.xlsx', '.txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
