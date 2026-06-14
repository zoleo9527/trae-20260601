import { ExamBatch, ExamBatchStatus, RoleType, ERROR_CODES } from '../types';
import { examBatches as mockBatches, students } from '../data/mockData';
import { logOperation, validateActionPermission } from './operationLog';

let examBatches: ExamBatch[] = [...mockBatches];

export const getExamBatches = (status?: ExamBatchStatus): ExamBatch[] => {
  if (status) {
    return examBatches.filter(batch => batch.status === status);
  }
  return examBatches;
};

export const getExamBatchById = (id: string): ExamBatch | undefined => {
  return examBatches.find(batch => batch.id === id);
};

export const createExamBatch = (
  batch: Omit<ExamBatch, 'id' | 'submitTime'>,
  operatorId: string,
  operatorName: string,
  operatorRole: RoleType
): { success: boolean; data?: ExamBatch; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('create_batch', operatorRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const newBatch: ExamBatch = {
    ...batch,
    id: `b${Date.now()}`,
    submitTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  examBatches.push(newBatch);
  
  logOperation(
    '创建考试批次',
    'batch',
    newBatch.id,
    operatorId,
    operatorName,
    operatorRole,
    `创建批次 ${newBatch.batchNumber}`
  );
  
  return { success: true, data: newBatch };
};

export const submitExamBatch = (
  id: string, 
  submitterId: string, 
  submitterName: string,
  submitterRole: RoleType
): { success: boolean; data?: ExamBatch; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('submit_batch', submitterRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = examBatches.findIndex(batch => batch.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'EB001', message: '考试批次不存在' } 
    };
  }
  
  if (examBatches[index].status !== 'pending') {
    return { 
      success: false, 
      error: { code: 'EB002', message: '只有待提交的批次才能提交' } 
    };
  }
  
  examBatches[index] = {
    ...examBatches[index],
    status: 'submitted',
    submitterId,
    submitterName,
    submitTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  
  logOperation(
    '提交考试批次',
    'batch',
    id,
    submitterId,
    submitterName,
    submitterRole,
    `提交批次 ${examBatches[index].batchNumber}`
  );
  
  return { success: true, data: examBatches[index] };
};

export const confirmExamBatch = (
  id: string, 
  confirmerId: string, 
  confirmerName: string,
  confirmerRole: RoleType
): { success: boolean; data?: ExamBatch; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('confirm_batch', confirmerRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = examBatches.findIndex(batch => batch.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'EB001', message: '考试批次不存在' } 
    };
  }
  
  if (examBatches[index].status !== 'submitted') {
    return { 
      success: false, 
      error: { code: 'EB002', message: '只有已提交的批次才能确认' } 
    };
  }
  
  examBatches[index] = {
    ...examBatches[index],
    status: 'confirmed',
    confirmerId,
    confirmerName,
    confirmTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  
  logOperation(
    '确认考试批次',
    'batch',
    id,
    confirmerId,
    confirmerName,
    confirmerRole,
    `确认批次 ${examBatches[index].batchNumber}`
  );
  
  return { success: true, data: examBatches[index] };
};

export const completeExam = (
  id: string,
  operatorId: string,
  operatorName: string,
  operatorRole: RoleType
): { success: boolean; data?: ExamBatch; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('complete_exam', operatorRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = examBatches.findIndex(batch => batch.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'EB001', message: '考试批次不存在' } 
    };
  }
  
  if (examBatches[index].status !== 'confirmed') {
    return { 
      success: false, 
      error: { code: 'EB002', message: '只有已确认的批次才能完成考试' } 
    };
  }
  
  examBatches[index] = {
    ...examBatches[index],
    status: 'exam_completed',
  };
  
  logOperation(
    '完成考试',
    'batch',
    id,
    operatorId,
    operatorName,
    operatorRole,
    `完成批次 ${examBatches[index].batchNumber} 的考试`
  );
  
  return { success: true, data: examBatches[index] };
};

export const cancelExamBatch = (
  id: string,
  operatorId: string,
  operatorName: string,
  operatorRole: RoleType
): { success: boolean; data?: ExamBatch; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('cancel_batch', operatorRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = examBatches.findIndex(batch => batch.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'EB001', message: '考试批次不存在' } 
    };
  }
  
  if (examBatches[index].status === 'exam_completed') {
    return { 
      success: false, 
      error: { code: 'EB002', message: '已完成的考试不能取消' } 
    };
  }
  
  examBatches[index] = {
    ...examBatches[index],
    status: 'cancelled',
  };
  
  logOperation(
    '取消考试批次',
    'batch',
    id,
    operatorId,
    operatorName,
    operatorRole,
    `取消批次 ${examBatches[index].batchNumber}`
  );
  
  return { success: true, data: examBatches[index] };
};

export const getBatchStudents = (batchId: string) => {
  const batch = getExamBatchById(batchId);
  if (!batch) return [];
  return students.filter(s => batch.students.includes(s.id));
};
