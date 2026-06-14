import { ExceptionRecord, ExceptionType, RoleType } from '../types';
import { exceptionRecords as mockExceptions } from '../data/mockData';
import { logOperation, validateActionPermission } from './operationLog';

let exceptionRecords: ExceptionRecord[] = [...mockExceptions];

export const getExceptions = (batchId?: string, type?: ExceptionType, resolved?: boolean): ExceptionRecord[] => {
  let result = [...exceptionRecords];
  if (batchId) {
    result = result.filter(e => e.batchId === batchId);
  }
  if (type) {
    result = result.filter(e => e.type === type);
  }
  if (resolved !== undefined) {
    result = result.filter(e => e.resolved === resolved);
  }
  return result;
};

export const getExceptionById = (id: string): ExceptionRecord | undefined => {
  return exceptionRecords.find(e => e.id === id);
};

export const createException = (
  exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'resolved'>,
  operatorId: string,
  operatorName: string,
  operatorRole: RoleType
): ExceptionRecord => {
  const newException: ExceptionRecord = {
    ...exception,
    id: `ex${Date.now()}`,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    resolved: false,
  };
  exceptionRecords.push(newException);
  
  logOperation(
    '创建异常记录',
    'exception',
    newException.id,
    operatorId,
    operatorName,
    operatorRole,
    `记录${exception.studentName}${exception.type === 'missing_documents' ? '材料缺失' : exception.type === 'timeout' ? '超时未处理' : '复核不通过'}异常`
  );
  
  return newException;
};

export const handleException = (
  id: string, 
  handlerId: string, 
  handlerName: string,
  handlerRole: RoleType
): { success: boolean; data?: ExceptionRecord; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('handle_exception', handlerRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = exceptionRecords.findIndex(e => e.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'EX001', message: '异常记录不存在' } 
    };
  }
  
  if (exceptionRecords[index].resolved) {
    return { 
      success: false, 
      error: { code: 'EX002', message: '异常已处理完成' } 
    };
  }
  
  exceptionRecords[index] = {
    ...exceptionRecords[index],
    resolved: true,
    handlerId,
    handlerName,
    handledAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  
  logOperation(
    '处理异常记录',
    'exception',
    id,
    handlerId,
    handlerName,
    handlerRole,
    `处理${exceptionRecords[index].studentName}的异常`
  );
  
  return { success: true, data: exceptionRecords[index] };
};

export const getUnresolvedExceptions = (): ExceptionRecord[] => {
  return exceptionRecords.filter(e => !e.resolved);
};
