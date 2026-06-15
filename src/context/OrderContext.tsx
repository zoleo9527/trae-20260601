import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { InstallationOrder, Master, DispatchRecord, StatusChange, PartRequest } from '../types';
import { orders as initialOrders, masters as initialMasters } from '../data/mockData';

interface OrderContextType {
  orders: InstallationOrder[];
  masters: Master[];
  dispatchOrder: (orderId: string, masterId: string) => void;
  batchDispatchOrders: (orderIds: string[]) => void;
  approvePart: (partId: string) => void;
  batchApproveParts: (partIds: string[]) => void;
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
        prev.map(o => ({
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
          })
        }))
      );
    },
    [createStatusChange]
  );

  const batchApproveParts = useCallback(
    (partIds: string[]) => {
      setOrders(prev =>
        prev.map(o => ({
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
          })
        }))
      );
    },
    [createStatusChange]
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
