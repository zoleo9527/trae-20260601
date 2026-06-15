import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { InstallationOrder, Master, DispatchRecord, StatusChange, PartRequest, AfterSaleCommunication } from '../types';
import { orders as initialOrders, masters as initialMasters } from '../data/mockData';

interface OrderContextType {
  orders: InstallationOrder[];
  masters: Master[];
  dispatchOrder: (orderId: string, masterId: string) => void;
  batchDispatchOrders: (orderIds: string[]) => void;
  approvePart: (partId: string) => void;
  batchApproveParts: (partIds: string[]) => void;
  addAfterSaleReply: (orderId: string, content: string) => void;
  resolveAfterSale: (orderId: string) => void;
  getOrderById: (orderId: string) => InstallationOrder | undefined;
  getMasterById: (masterId: string) => Master | undefined;
  getPendingPartsCount: () => number;
  getPendingOrdersCount: () => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<InstallationOrder[]>(initialOrders);
  const [masters, setMasters] = useState<Master[]>(initialMasters);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createStatusChange = useCallback(
    (fromStatus: string, toStatus: string, operator: string, operatorRole: string, remark: string = ''): StatusChange => ({
      id: generateId(),
      fromStatus,
      toStatus,
      operator,
      operatorRole,
      timestamp: new Date().toISOString(),
      remark
    }),
    []
  );

  const dispatchOrder = useCallback(
    (orderId: string, masterId: string) => {
      const master = masters.find(m => m.id === masterId);
      if (!master) return;

      const newDispatchRecord: DispatchRecord = {
        id: `DR-${Date.now()}`,
        orderId,
        masterId: master.id,
        masterName: master.name,
        status: 'assigned',
        dispatchTime: new Date().toISOString(),
        statusHistory: [
          createStatusChange('', 'assigned', '调度员小王', '调度员', `分配给${master.name}，技能匹配: ${master.skills.join(', ')}`)
        ]
      };

      const newStatusChange = createStatusChange(
        orders.find(o => o.id === orderId)?.status || '',
        'assigned',
        '调度员小王',
        '调度员',
        `已分配给${master.name}`
      );

      setOrders(prev =>
        prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              status: 'assigned',
              dispatcher: '调度员小王',
              assignedMaster: master.name,
              assignedMasterId: master.id,
              dispatchRecords: [...o.dispatchRecords, newDispatchRecord],
              statusHistory: [...o.statusHistory, newStatusChange]
            };
          }
          return o;
        })
      );

      setMasters(prev =>
        prev.map(m => {
          if (m.id === masterId) {
            return {
              ...m,
              status: 'busy',
              currentOrders: [...m.currentOrders, orderId]
            };
          }
          return m;
        })
      );
    },
    [masters, createStatusChange, orders]
  );

  const batchDispatchOrders = useCallback(
    (orderIds: string[]) => {
      const availableMasters = masters.filter(m => m.status === 'available');
      if (availableMasters.length === 0) return;

      const pendingOrderIds = orderIds.filter(id =>
        orders.find(o => o.id === id && o.status === 'pending')
      );

      let masterIndex = 0;
      setOrders(prev =>
        prev.map(o => {
          if (pendingOrderIds.includes(o.id) && o.status === 'pending') {
            const master = availableMasters[masterIndex % availableMasters.length];
            masterIndex++;

            const newDispatchRecord: DispatchRecord = {
              id: `DR-${Date.now()}-${o.id}`,
              orderId: o.id,
              masterId: master.id,
              masterName: master.name,
              status: 'assigned',
              dispatchTime: new Date().toISOString(),
              statusHistory: [
                createStatusChange('', 'assigned', '调度员小王', '调度员', `批量分配给${master.name}`)
              ]
            };

            const newStatusChange = createStatusChange(
              'pending',
              'assigned',
              '调度员小王',
              '调度员',
              `批量分配给${master.name}`
            );

            return {
              ...o,
              status: 'assigned',
              dispatcher: '调度员小王',
              assignedMaster: master.name,
              assignedMasterId: master.id,
              dispatchRecords: [...o.dispatchRecords, newDispatchRecord],
              statusHistory: [...o.statusHistory, newStatusChange]
            };
          }
          return o;
        })
      );

      const masterOrderMap: Record<string, string[]> = {};
      pendingOrderIds.forEach((orderId, index) => {
        const master = availableMasters[index % availableMasters.length];
        if (!masterOrderMap[master.id]) {
          masterOrderMap[master.id] = [];
        }
        masterOrderMap[master.id].push(orderId);
      });

      setMasters(prev =>
        prev.map(m => {
          if (masterOrderMap[m.id]) {
            return {
              ...m,
              status: 'busy',
              currentOrders: [...m.currentOrders, ...masterOrderMap[m.id]]
            };
          }
          return m;
        })
      );
    },
    [masters, createStatusChange, orders]
  );

  const approvePart = useCallback(
    (partId: string) => {
      setOrders(prev =>
        prev.map(o => {
          const approvedPart = o.partRequests.find(p => p.id === partId);
          const hasApprovedPart = approvedPart && approvedPart.status === 'requested';
          const remainingPendingParts = o.partRequests.filter(p => p.status === 'requested' && p.id !== partId);
          
          const orderRemarks: string[] = [];
          if (o.remark) orderRemarks.push(o.remark);
          if (hasApprovedPart && approvedPart) {
            orderRemarks.push(`配件【${approvedPart.partName}】已审批通过，等待${approvedPart.requester}领取`);
          }
          
          const allPartsApproved = remainingPendingParts.length === 0 && o.partRequests.length > 0;
          
          return {
            ...o,
            partRequests: o.partRequests.map(p => {
              if (p.id === partId && p.status === 'requested') {
                const newStatusChange = createStatusChange(
                  'requested',
                  'approved',
                  '仓库管理员小张',
                  '仓库管理',
                  '审批通过，配件已准备好领取'
                );
                return {
                  ...p,
                  status: 'approved',
                  statusHistory: [...p.statusHistory, newStatusChange],
                  currentHandler: p.requester,
                  currentHandlerRole: '安装师傅'
                };
              }
              return p;
            }),
            remark: orderRemarks.join('; ') || undefined,
            status: allPartsApproved && o.status === 'delayed' ? 'in_progress' : o.status,
            statusHistory: hasApprovedPart ? [
              ...o.statusHistory,
              createStatusChange(
                o.status,
                allPartsApproved && o.status === 'delayed' ? 'in_progress' : o.status,
                '仓库管理员小张',
                '仓库管理',
                `配件【${approvedPart?.partName}】已审批通过，${allPartsApproved ? '订单恢复进行中' : '等待' + approvedPart?.requester + '领取'}`
              )
            ] : o.statusHistory
          };
        })
      );
    },
    [createStatusChange]
  );

  const batchApproveParts = useCallback(
    (partIds: string[]) => {
      setOrders(prev =>
        prev.map(o => {
          const approvedParts = o.partRequests.filter(p => partIds.includes(p.id) && p.status === 'requested');
          const remainingPendingParts = o.partRequests.filter(p => p.status === 'requested' && !partIds.includes(p.id));
          
          const orderRemarks: string[] = [];
          if (o.remark) orderRemarks.push(o.remark);
          if (approvedParts.length > 0) {
            orderRemarks.push(`批量审批通过 ${approvedParts.length} 个配件申请: ${approvedParts.map(p => p.partName).join(', ')}`);
          }
          
          const allPartsApproved = remainingPendingParts.length === 0 && o.partRequests.length > 0;
          
          return {
            ...o,
            partRequests: o.partRequests.map(p => {
              if (partIds.includes(p.id) && p.status === 'requested') {
                const newStatusChange = createStatusChange(
                  'requested',
                  'approved',
                  '仓库管理员小张',
                  '仓库管理',
                  '批量审批通过'
                );
                return {
                  ...p,
                  status: 'approved',
                  statusHistory: [...p.statusHistory, newStatusChange],
                  currentHandler: p.requester,
                  currentHandlerRole: '安装师傅'
                };
              }
              return p;
            }),
            remark: orderRemarks.join('; ') || undefined,
            status: allPartsApproved && o.status === 'delayed' ? 'in_progress' : o.status,
            statusHistory: approvedParts.length > 0 ? [
              ...o.statusHistory,
              createStatusChange(
                o.status,
                allPartsApproved && o.status === 'delayed' ? 'in_progress' : o.status,
                '仓库管理员小张',
                '仓库管理',
                `批量审批通过 ${approvedParts.length} 个配件申请: ${approvedParts.map(p => p.partName).join(', ')}${allPartsApproved ? '，订单恢复进行中' : ''}`
              )
            ] : o.statusHistory
          };
        })
      );
    },
    [createStatusChange]
  );

  const addAfterSaleReply = useCallback(
    (orderId: string, content: string) => {
      const newCommunication: AfterSaleCommunication = {
        id: `C-${Date.now()}`,
        type: 'handler',
        content,
        operator: '客服小美',
        timestamp: new Date().toISOString()
      };

      setOrders(prev =>
        prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              afterSale: {
                ...o.afterSale,
                status: 'processing',
                updateTime: new Date().toISOString(),
                communications: [...(o.afterSale?.communications || []), newCommunication]
              }
            };
          }
          return o;
        })
      );
    },
    []
  );

  const resolveAfterSale = useCallback(
    (orderId: string) => {
      const resolveCommunication: AfterSaleCommunication = {
        id: `C-${Date.now()}`,
        type: 'system',
        content: '售后问题已解决',
        operator: '系统',
        timestamp: new Date().toISOString()
      };

      setOrders(prev =>
        prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              afterSale: {
                ...o.afterSale,
                status: 'resolved',
                updateTime: new Date().toISOString(),
                communications: [...(o.afterSale?.communications || []), resolveCommunication]
              }
            };
          }
          return o;
        })
      );
    },
    []
  );

  const getOrderById = useCallback(
    (orderId: string) => orders.find(o => o.id === orderId),
    [orders]
  );

  const getMasterById = useCallback(
    (masterId: string) => masters.find(m => m.id === masterId),
    [masters]
  );

  const getPendingPartsCount = useCallback(() => {
    return orders.reduce((acc, o) => acc + o.partRequests.filter(p => p.status === 'requested').length, 0);
  }, [orders]);

  const getPendingOrdersCount = useCallback(() => {
    return orders.filter(o => o.status === 'pending').length;
  }, [orders]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        masters,
        dispatchOrder,
        batchDispatchOrders,
        approvePart,
        batchApproveParts,
        addAfterSaleReply,
        resolveAfterSale,
        getOrderById,
        getMasterById,
        getPendingPartsCount,
        getPendingOrdersCount
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};
