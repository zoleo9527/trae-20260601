import { StudentNotification, StudentNotificationStatus, RoleType } from '../types';
import { studentNotifications as mockNotifications } from '../data/mockData';
import { logOperation, validateActionPermission } from './operationLog';

let studentNotifications: StudentNotification[] = [...mockNotifications];

export const getNotifications = (batchId?: string, status?: StudentNotificationStatus): StudentNotification[] => {
  let result = [...studentNotifications];
  if (batchId) {
    result = result.filter(n => n.batchId === batchId);
  }
  if (status) {
    result = result.filter(n => n.status === status);
  }
  return result;
};

export const getNotificationById = (id: string): StudentNotification | undefined => {
  return studentNotifications.find(n => n.id === id);
};

export const createNotification = (
  notification: Omit<StudentNotification, 'id' | 'notifyTime'>
): StudentNotification => {
  const newNotification: StudentNotification = {
    ...notification,
    id: `n${Date.now()}`,
    notifyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  studentNotifications.push(newNotification);
  return newNotification;
};

export const sendNotification = (
  id: string, 
  notifierId: string, 
  notifierName: string,
  notifierRole: RoleType
): { success: boolean; data?: StudentNotification; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('send_notification', notifierRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = studentNotifications.findIndex(n => n.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'SN001', message: '学员通知不存在' } 
    };
  }
  
  if (studentNotifications[index].status !== 'pending') {
    return { 
      success: false, 
      error: { code: 'SN003', message: '只有待通知的才能发送通知' } 
    };
  }
  
  studentNotifications[index] = {
    ...studentNotifications[index],
    status: 'notified',
    notifierId,
    notifierName,
    notifyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  
  logOperation(
    '发送学员通知',
    'notification',
    id,
    notifierId,
    notifierName,
    notifierRole,
    `通知学员 ${studentNotifications[index].studentName}`
  );
  
  return { success: true, data: studentNotifications[index] };
};

export const confirmNotification = (
  id: string,
  confirmerId: string,
  confirmerName: string,
  confirmerRole: RoleType
): { success: boolean; data?: StudentNotification; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('confirm_notification', confirmerRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = studentNotifications.findIndex(n => n.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'SN001', message: '学员通知不存在' } 
    };
  }
  
  if (studentNotifications[index].status !== 'notified') {
    return { 
      success: false, 
      error: { code: 'SN003', message: '只有已通知的才能确认' } 
    };
  }
  
  studentNotifications[index] = {
    ...studentNotifications[index],
    status: 'confirmed',
    confirmTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  
  logOperation(
    '确认学员通知',
    'notification',
    id,
    confirmerId,
    confirmerName,
    confirmerRole,
    `确认学员 ${studentNotifications[index].studentName} 的通知`
  );
  
  return { success: true, data: studentNotifications[index] };
};

export const markAbsent = (
  id: string, 
  remarks: string | undefined,
  operatorId: string,
  operatorName: string,
  operatorRole: RoleType
): { success: boolean; data?: StudentNotification; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('mark_absent', operatorRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = studentNotifications.findIndex(n => n.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'SN001', message: '学员通知不存在' } 
    };
  }
  
  studentNotifications[index] = {
    ...studentNotifications[index],
    status: 'absent',
    remarks,
  };
  
  logOperation(
    '标记缺考',
    'notification',
    id,
    operatorId,
    operatorName,
    operatorRole,
    `标记学员 ${studentNotifications[index].studentName} 缺考: ${remarks || '未说明'}`
  );
  
  return { success: true, data: studentNotifications[index] };
};

export const completeNotification = (
  id: string,
  operatorId: string,
  operatorName: string,
  operatorRole: RoleType
): { success: boolean; data?: StudentNotification; error?: { code: string; message: string } } => {
  const validation = validateActionPermission('complete_notification', operatorRole);
  if (!validation.allowed) {
    return { 
      success: false, 
      error: { code: validation.errorCode!, message: validation.message! } 
    };
  }

  const index = studentNotifications.findIndex(n => n.id === id);
  if (index === -1) {
    return { 
      success: false, 
      error: { code: 'SN001', message: '学员通知不存在' } 
    };
  }
  
  if (studentNotifications[index].status !== 'confirmed') {
    return { 
      success: false, 
      error: { code: 'SN003', message: '只有已确认的才能完成' } 
    };
  }
  
  studentNotifications[index] = {
    ...studentNotifications[index],
    status: 'completed',
  };
  
  logOperation(
    '完成通知',
    'notification',
    id,
    operatorId,
    operatorName,
    operatorRole,
    `完成学员 ${studentNotifications[index].studentName} 的通知`
  );
  
  return { success: true, data: studentNotifications[index] };
};
