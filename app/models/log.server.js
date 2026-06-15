import { operationLogs, users } from '~/data/mockData';

export async function getOperationLogs() {
  return operationLogs.map(log => {
    const user = users.find(u => u.id === log.userId);
    return { ...log, user };
  });
}

export async function getLogsByTarget(targetType, targetId) {
  return operationLogs
    .filter(log => log.targetType === targetType && log.targetId === targetId)
    .map(log => {
      const user = users.find(u => u.id === log.userId);
      return { ...log, user };
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

export async function createOperationLog(data) {
  const newLog = {
    id: `${Date.now()}`,
    ...data,
    time: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  
  operationLogs.push(newLog);
  return newLog;
}
