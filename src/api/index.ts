import type { OutOfStockRecord, ReplenishOrder, OperationLog, OutOfStockQueryParams, ReplenishQueryParams } from '@/types';
import { mockOutOfStockRecords, mockReplenishOrders, mockOperationLogs } from '@/data/mockData';

let outOfStockRecords: OutOfStockRecord[] = [...mockOutOfStockRecords];
let replenishOrders: ReplenishOrder[] = [...mockReplenishOrders];
let operationLogs: OperationLog[] = [...mockOperationLogs];

const generateId = () => Math.random().toString(36).substring(2, 9);

const getCurrentTime = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

export const outOfStockApi = {
  list: (params?: OutOfStockQueryParams): Promise<OutOfStockRecord[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...outOfStockRecords];
        
        if (params?.status) {
          result = result.filter(r => r.status === params.status);
        }
        if (params?.storeId) {
          result = result.filter(r => r.storeId === params.storeId);
        }
        if (params?.region) {
          result = result.filter(r => r.region === params.region);
        }
        if (params?.dishName) {
          result = result.filter(r => r.dishName.includes(params.dishName));
        }
        if (params?.startTime) {
          result = result.filter(r => r.submitTime >= params.startTime);
        }
        if (params?.endTime) {
          result = result.filter(r => r.submitTime <= params.endTime);
        }
        
        result.sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());
        resolve(result);
      }, 300);
    });
  },

  getById: (id: string): Promise<OutOfStockRecord | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const record = outOfStockRecords.find(r => r.id === id);
        resolve(record || null);
      }, 200);
    });
  },

  create: (data: {
    dishId: string;
    dishName: string;
    storeId: string;
    storeName: string;
    region: string;
    quantity: number;
    reason: string;
    remark: string;
    submitterId: string;
    submitterName: string;
  }): Promise<OutOfStockRecord> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRecord: OutOfStockRecord = {
          id: generateId(),
          ...data,
          status: 'pending',
          submitTime: getCurrentTime(),
        };
        outOfStockRecords.unshift(newRecord);
        
        operationLogs.unshift({
          id: generateId(),
          type: 'out_of_stock',
          targetId: newRecord.id,
          action: '提交售罄申请',
          operatorId: data.submitterId,
          operatorName: data.submitterName,
          operatorRole: '店长',
          storeName: data.storeName,
          region: data.region,
          detail: `菜品：${data.dishName}，数量：${data.quantity}份，原因：${data.reason}，备注：${data.remark}`,
          operationTime: newRecord.submitTime,
        });
        
        resolve(newRecord);
      }, 300);
    });
  },

  approve: (id: string, approverId: string, approverName: string): Promise<OutOfStockRecord> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = outOfStockRecords.findIndex(r => r.id === id);
        if (index === -1) {
          reject(new Error('记录不存在'));
          return;
        }
        
        if (outOfStockRecords[index].status !== 'pending') {
          reject(new Error('只能处理待审核的记录'));
          return;
        }
        
        outOfStockRecords[index] = {
          ...outOfStockRecords[index],
          status: 'approved',
          approverId,
          approverName,
          approveTime: getCurrentTime(),
        };
        
        operationLogs.unshift({
          id: generateId(),
          type: 'out_of_stock',
          targetId: id,
          action: '确认售罄申请',
          operatorId: approverId,
          operatorName: approverName,
          operatorRole: '区域督导',
          storeName: '区域督导',
          region: outOfStockRecords[index].region,
          detail: `同意${outOfStockRecords[index].storeName}的${outOfStockRecords[index].dishName}售罄申请，已生成临时补货单`,
          operationTime: outOfStockRecords[index].approveTime!,
        });
        
        resolve(outOfStockRecords[index]);
      }, 300);
    });
  },

  reject: (id: string, approverId: string, approverName: string, rejectReason: string): Promise<OutOfStockRecord> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = outOfStockRecords.findIndex(r => r.id === id);
        if (index === -1) {
          reject(new Error('记录不存在'));
          return;
        }
        
        if (outOfStockRecords[index].status !== 'pending') {
          reject(new Error('只能处理待审核的记录'));
          return;
        }
        
        outOfStockRecords[index] = {
          ...outOfStockRecords[index],
          status: 'rejected',
          approverId,
          approverName,
          approveTime: getCurrentTime(),
          rejectReason,
        };
        
        operationLogs.unshift({
          id: generateId(),
          type: 'out_of_stock',
          targetId: id,
          action: '驳回售罄申请',
          operatorId: approverId,
          operatorName: approverName,
          operatorRole: '区域督导',
          storeName: '区域督导',
          region: outOfStockRecords[index].region,
          detail: `驳回${outOfStockRecords[index].storeName}${outOfStockRecords[index].dishName}售罄申请，原因：${rejectReason}`,
          operationTime: outOfStockRecords[index].approveTime!,
        });
        
        resolve(outOfStockRecords[index]);
      }, 300);
    });
  },

  close: (id: string): Promise<OutOfStockRecord> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = outOfStockRecords.findIndex(r => r.id === id);
        if (index === -1) {
          reject(new Error('记录不存在'));
          return;
        }
        
        if (outOfStockRecords[index].status !== 'replenished') {
          reject(new Error('只能关闭已补货的记录'));
          return;
        }
        
        outOfStockRecords[index] = {
          ...outOfStockRecords[index],
          status: 'closed',
          closeTime: getCurrentTime(),
        };
        
        operationLogs.unshift({
          id: generateId(),
          type: 'out_of_stock',
          targetId: id,
          action: '关闭售罄记录',
          operatorId: outOfStockRecords[index].submitterId,
          operatorName: outOfStockRecords[index].submitterName,
          operatorRole: '店长',
          storeName: outOfStockRecords[index].storeName,
          region: outOfStockRecords[index].region,
          detail: `关闭${outOfStockRecords[index].dishName}售罄记录，状态已更新为已完成`,
          operationTime: outOfStockRecords[index].closeTime!,
        });
        
        resolve(outOfStockRecords[index]);
      }, 300);
    });
  },
};

export const replenishApi = {
  list: (params?: ReplenishQueryParams): Promise<ReplenishOrder[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...replenishOrders];
        
        if (params?.status) {
          result = result.filter(r => r.status === params.status);
        }
        if (params?.storeId) {
          result = result.filter(r => r.storeId === params.storeId);
        }
        if (params?.region) {
          result = result.filter(r => r.region === params.region);
        }
        if (params?.dishName) {
          result = result.filter(r => r.dishName.includes(params.dishName));
        }
        if (params?.startTime) {
          result = result.filter(r => r.submitTime >= params.startTime);
        }
        if (params?.endTime) {
          result = result.filter(r => r.submitTime <= params.endTime);
        }
        
        result.sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime());
        resolve(result);
      }, 300);
    });
  },

  getById: (id: string): Promise<ReplenishOrder | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const order = replenishOrders.find(r => r.id === id);
        resolve(order || null);
      }, 200);
    });
  },

  create: (data: {
    outOfStockId: string;
    dishId: string;
    dishName: string;
    storeId: string;
    storeName: string;
    region: string;
    requestedQuantity: number;
    remark: string;
    submitterId: string;
    submitterName: string;
  }): Promise<ReplenishOrder> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder: ReplenishOrder = {
          id: generateId(),
          ...data,
          actualQuantity: data.requestedQuantity,
          status: 'pending',
          submitTime: getCurrentTime(),
        };
        replenishOrders.unshift(newOrder);
        
        const oosIndex = outOfStockRecords.findIndex(r => r.id === data.outOfStockId);
        if (oosIndex !== -1) {
          outOfStockRecords[oosIndex] = {
            ...outOfStockRecords[oosIndex],
            replenishOrderId: newOrder.id,
          };
        }
        
        operationLogs.unshift({
          id: generateId(),
          type: 'replenish',
          targetId: newOrder.id,
          action: '创建临时补货单',
          operatorId: data.submitterId,
          operatorName: data.submitterName,
          operatorRole: '区域督导',
          storeName: '区域督导',
          region: data.region,
          detail: `为${data.storeName}创建${data.dishName}补货单，数量：${data.requestedQuantity}，备注：${data.remark}`,
          operationTime: newOrder.submitTime,
        });
        
        resolve(newOrder);
      }, 300);
    });
  },

  confirm: (id: string, confirmerId: string, confirmerName: string): Promise<ReplenishOrder> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = replenishOrders.findIndex(r => r.id === id);
        if (index === -1) {
          reject(new Error('补货单不存在'));
          return;
        }
        
        if (replenishOrders[index].status !== 'pending') {
          reject(new Error('只能确认待确认的补货单'));
          return;
        }
        
        replenishOrders[index] = {
          ...replenishOrders[index],
          status: 'confirmed',
          confirmerId,
          confirmerName,
          confirmTime: getCurrentTime(),
        };
        
        operationLogs.unshift({
          id: generateId(),
          type: 'replenish',
          targetId: id,
          action: '确认补货单',
          operatorId: confirmerId,
          operatorName: confirmerName,
          operatorRole: '采购',
          storeName: '采购部',
          region: '总部',
          detail: `确认${replenishOrders[index].storeName}${replenishOrders[index].dishName}补货单，安排配送`,
          operationTime: replenishOrders[index].confirmTime!,
        });
        
        resolve(replenishOrders[index]);
      }, 300);
    });
  },

  complete: (id: string): Promise<ReplenishOrder> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = replenishOrders.findIndex(r => r.id === id);
        if (index === -1) {
          reject(new Error('补货单不存在'));
          return;
        }
        
        if (replenishOrders[index].status !== 'confirmed') {
          reject(new Error('只能完成已确认的补货单'));
          return;
        }
        
        replenishOrders[index] = {
          ...replenishOrders[index],
          status: 'completed',
          completionTime: getCurrentTime(),
        };
        
        const oosIndex = outOfStockRecords.findIndex(r => r.replenishOrderId === id);
        if (oosIndex !== -1) {
          outOfStockRecords[oosIndex] = {
            ...outOfStockRecords[oosIndex],
            status: 'replenished',
          };
        }
        
        operationLogs.unshift({
          id: generateId(),
          type: 'replenish',
          targetId: id,
          action: '完成补货',
          operatorId: replenishOrders[index].confirmerId!,
          operatorName: replenishOrders[index].confirmerName!,
          operatorRole: '采购',
          storeName: '采购部',
          region: '总部',
          detail: `${replenishOrders[index].storeName}${replenishOrders[index].dishName}补货完成，数量：${replenishOrders[index].actualQuantity}`,
          operationTime: replenishOrders[index].completionTime!,
        });
        
        resolve(replenishOrders[index]);
      }, 300);
    });
  },

  cancel: (id: string, cancelReason: string): Promise<ReplenishOrder> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = replenishOrders.findIndex(r => r.id === id);
        if (index === -1) {
          reject(new Error('补货单不存在'));
          return;
        }
        
        if (replenishOrders[index].status === 'completed') {
          reject(new Error('已完成的补货单不能取消'));
          return;
        }
        
        replenishOrders[index] = {
          ...replenishOrders[index],
          status: 'cancelled',
          cancelReason,
        };
        
        operationLogs.unshift({
          id: generateId(),
          type: 'replenish',
          targetId: id,
          action: '取消补货单',
          operatorId: replenishOrders[index].submitterId,
          operatorName: replenishOrders[index].submitterName,
          operatorRole: '区域督导',
          storeName: '区域督导',
          region: replenishOrders[index].region,
          detail: `取消${replenishOrders[index].storeName}${replenishOrders[index].dishName}补货单，原因：${cancelReason}`,
          operationTime: getCurrentTime(),
        });
        
        resolve(replenishOrders[index]);
      }, 300);
    });
  },
};

export const operationLogApi = {
  list: (): Promise<OperationLog[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sortedLogs = [...operationLogs].sort(
          (a, b) => new Date(b.operationTime).getTime() - new Date(a.operationTime).getTime()
        );
        resolve(sortedLogs);
      }, 200);
    });
  },
};
