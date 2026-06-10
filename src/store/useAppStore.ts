import { useCallback, useState } from 'react';
import {
    PARKING_ORDERS as INITIAL_ORDERS,
    ABNORMAL_REPAIRS as INITIAL_REPAIRS,
    USERS,
} from '../mock/data';
import type {
    AbnormalRepair,
    ParkingOrder,
    Remark,
    RepairLog,
    RoleType,
    StatusLog,
} from '../types';

export const useAppStore = () => {
  const [orders, setOrders] = useState<ParkingOrder[]>(INITIAL_ORDERS);
  const [repairs, setRepairs] = useState<AbnormalRepair[]>(INITIAL_REPAIRS);
  const [currentRole, setCurrentRole] = useState<RoleType>('operator');
  const [currentUser, setCurrentUser] = useState(USERS[0]);

  const addStatusLog = useCallback(
    (
      orderId: string,
      fromStatus: string,
      toStatus: string,
      remark: string
    ) => {
      const now = new Date().toISOString();
      const log: StatusLog = {
        id: `sl_${orderId}_${Date.now()}`,
        orderId,
        fromStatus,
        toStatus,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        timestamp: now,
        remark,
      };
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: toStatus as ParkingOrder['status'],
                statusLogs: [...o.statusLogs, log],
                updateTime: now,
              }
            : o
        )
      );
    },
    [currentUser]
  );

  const addRemark = useCallback(
    (orderId: string, content: string) => {
      const now = new Date().toISOString();
      const remark: Remark = {
        id: `rm_${orderId}_${Date.now()}`,
        orderId,
        content,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        timestamp: now,
      };
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, remarks: [...o.remarks, remark], updateTime: now }
            : o
        )
      );
    },
    [currentUser]
  );

  const assignOrderHandler = useCallback(
    (orderId: string, userId: string) => {
      const now = new Date().toISOString();
      const user = USERS.find((u) => u.id === userId);
      if (!user) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                currentHandlerId: user.id,
                currentHandlerName: user.name,
                currentHandlerRole: user.role,
                updateTime: now,
              }
            : o
        )
      );
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setRepairs((prev) =>
          prev.map((r) =>
            r.orderId === orderId
              ? {
                  ...r,
                  assigneeId: user.id,
                  assigneeName: user.name,
                  assigneeRole: user.role,
                  updateTime: now,
                }
              : r
          )
        );
      }
    },
    [orders]
  );

  const updateRepairStatus = useCallback(
    (
      repairId: string,
      newStatus: AbnormalRepair['repairStatus'],
      step: string,
      action: string,
      remark: string,
      currentStep?: string,
      blockerReason?: string
    ) => {
      const now = new Date().toISOString();
      const log: RepairLog = {
        id: `rpl_${repairId}_${Date.now()}`,
        repairId,
        step,
        action,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        timestamp: now,
        remark,
      };
      setRepairs((prev) =>
        prev.map((r) =>
          r.id === repairId
            ? {
                ...r,
                repairStatus: newStatus,
                repairLogs: [...r.repairLogs, log],
                updateTime: now,
                currentStep: currentStep ?? r.currentStep,
                blockerReason: blockerReason ?? r.blockerReason,
              }
            : r
        )
      );
    },
    [currentUser]
  );

  const addRepairLog = useCallback(
    (
      repairId: string,
      step: string,
      action: string,
      remark: string,
      currentStep?: string,
      blockerReason?: string
    ) => {
      const now = new Date().toISOString();
      const log: RepairLog = {
        id: `rpl_${repairId}_${Date.now()}`,
        repairId,
        step,
        action,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        timestamp: now,
        remark,
      };
      setRepairs((prev) =>
        prev.map((r) =>
          r.id === repairId
            ? {
                ...r,
                repairLogs: [...r.repairLogs, log],
                updateTime: now,
                currentStep: currentStep ?? r.currentStep,
                blockerReason: blockerReason ?? r.blockerReason,
              }
            : r
        )
      );
    },
    [currentUser]
  );

  const confirmPayment = useCallback(
    (repairId: string, amount: number, remark: string) => {
      const now = new Date().toISOString();
      const log: RepairLog = {
        id: `rpl_${repairId}_${Date.now()}`,
        repairId,
        step: '补缴确认',
        action: '到账确认',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        timestamp: now,
        remark: `${remark}，到账金额¥${amount}`,
        result: `已补缴¥${amount}`,
      };
      setRepairs((prev) =>
        prev.map((r) =>
          r.id === repairId
            ? {
                ...r,
                paidAmount: r.paidAmount + amount,
                unpaidAmount: Math.max(0, r.unpaidAmount - amount),
                repairLogs: [...r.repairLogs, log],
                repairStatus: r.unpaidAmount - amount <= 0 ? 'completed' : r.repairStatus,
                currentStep:
                  r.unpaidAmount - amount <= 0 ? '补缴完成' : r.currentStep,
                updateTime: now,
              }
            : r
        )
      );
      const repair = repairs.find((r) => r.id === repairId);
      if (repair) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== repair.orderId) return o;
            const newPaid = o.paidAmount + amount;
            return {
              ...o,
              paidAmount: newPaid,
              status:
                newPaid >= o.actualFee
                  ? 'exited'
                  : o.status,
              updateTime: now,
            };
          })
        );
      }
    },
    [currentUser, repairs]
  );

  const switchRole = useCallback((role: RoleType) => {
    setCurrentRole(role);
    const user = USERS.find((u) => u.role === role);
    if (user) setCurrentUser(user);
  }, []);

  return {
    orders,
    repairs,
    users: USERS,
    currentUser,
    currentRole,
    switchRole,
    addStatusLog,
    addRemark,
    assignOrderHandler,
    updateRepairStatus,
    addRepairLog,
    confirmPayment,
  };
};
