import React, { createContext, useContext, useState, useCallback } from 'react';
import { Room, RoomStatus, StatusFilter, OperationLog, Dispute } from '../types/inventory';
import { mockRooms } from '../data/mockData';

interface InventoryContextType {
  rooms: Room[];
  selectedRoom: Room | null;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  setSelectedRoom: (room: Room | null) => void;
  assignCleaning: (roomId: string, cleanerName: string) => void;
  submitReinspection: (roomId: string) => void;
  initiateDeduction: (roomId: string, amount: number, remark: string) => void;
  cancelDeduction: (roomId: string, reason: string) => void;
  recordNegotiation: (roomId: string, disputeId: string, result: string, resolution?: string) => void;
  getFilteredRooms: () => Room[];
  getStatusCounts: () => Record<RoomStatus, number>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const addOperationLog = useCallback((room: Room, action: string, remark: string): OperationLog => {
    return {
      id: `l${Date.now()}`,
      action,
      operator: '管家-当前用户',
      time: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      remark,
    };
  }, []);

  const assignCleaning = useCallback((roomId: string, cleanerName: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          const newLog = addOperationLog(room, '指派保洁', `指派${cleanerName}进行保洁`);
          return {
            ...room,
            status: 'PENDING_CLEANING' as RoomStatus,
            operationLogs: [...room.operationLogs, newLog],
          };
        }
        return room;
      })
    );
  }, [addOperationLog]);

  const submitReinspection = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          const newLog = addOperationLog(room, '提交复检', '保洁完成，待管家复检');
          return {
            ...room,
            status: 'PENDING_REINSPECTION' as RoomStatus,
            operationLogs: [...room.operationLogs, newLog],
          };
        }
        return room;
      })
    );
  }, [addOperationLog]);

  const initiateDeduction = useCallback((roomId: string, amount: number, remark: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          const newLog = addOperationLog(room, '发起扣款', `扣款${amount}元，${remark}`);
          return {
            ...room,
            status: 'DEPOSIT_PENDING' as RoomStatus,
            operationLogs: [...room.operationLogs, newLog],
          };
        }
        return room;
      })
    );
  }, [addOperationLog]);

  const cancelDeduction = useCallback((roomId: string, reason: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          const newLog = addOperationLog(room, '撤回扣款', `撤回原因：${reason}`);
          return {
            ...room,
            status: 'COMPLETED' as RoomStatus,
            operationLogs: [...room.operationLogs, newLog],
          };
        }
        return room;
      })
    );
  }, [addOperationLog]);

  const recordNegotiation = useCallback(
    (roomId: string, disputeId: string, result: string, resolution?: string) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === roomId) {
            const newLog = addOperationLog(room, '记录协商结果', result);
            const updatedDisputes = room.disputes.map((dispute) => {
              if (dispute.id === disputeId) {
                return {
                  ...dispute,
                  status: (resolution ? 'RESOLVED' : 'IN_PROGRESS') as Dispute['status'],
                  resolution: resolution || dispute.resolution,
                  resolver: '管家-当前用户',
                  resolveTime: resolution
                    ? new Date().toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : dispute.resolveTime,
                };
              }
              return dispute;
            });
            return {
              ...room,
              disputes: updatedDisputes,
              operationLogs: [...room.operationLogs, newLog],
            };
          }
          return room;
        })
      );
    },
    [addOperationLog]
  );

  const getFilteredRooms = useCallback(() => {
    if (statusFilter === 'ALL') return rooms;
    return rooms.filter((room) => room.status === statusFilter);
  }, [rooms, statusFilter]);

  const getStatusCounts = useCallback(() => {
    const counts: Record<RoomStatus, number> = {
      CHECKED_OUT_TODAY: 0,
      PENDING_CLEANING: 0,
      PENDING_REINSPECTION: 0,
      DEPOSIT_PENDING: 0,
      COMPLETED: 0,
    };
    rooms.forEach((room) => {
      counts[room.status]++;
    });
    return counts;
  }, [rooms]);

  return (
    <InventoryContext.Provider
      value={{
        rooms,
        selectedRoom,
        statusFilter,
        setStatusFilter,
        setSelectedRoom,
        assignCleaning,
        submitReinspection,
        initiateDeduction,
        cancelDeduction,
        recordNegotiation,
        getFilteredRooms,
        getStatusCounts,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
