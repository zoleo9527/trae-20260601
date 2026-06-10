import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCallback, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard';
import MainLayout from './components/MainLayout';
import OrderList from './components/OrderList';
import RepairList from './components/RepairList';
import {
  PARKING_ORDERS as INITIAL_ORDERS,
  ABNORMAL_REPAIRS as INITIAL_REPAIRS,
  USERS,
  ROLE_LABEL,
  computeStats,
} from './mock/data';
import type {
  AbnormalRepair,
  ParkingOrder,
  Remark,
  RepairLog,
  RepairStatus,
  RoleType,
  StatusLog,
} from './types';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

function App() {
  const [orders, setOrders] = useState<ParkingOrder[]>(INITIAL_ORDERS);
  const [repairs, setRepairs] = useState<AbnormalRepair[]>(INITIAL_REPAIRS);
  const [currentRole, setCurrentRole] = useState<RoleType>('operator');
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const stats = useMemo(() => computeStats(orders, repairs), [orders, repairs]);

  const switchRole = useCallback((role: RoleType) => {
    setCurrentRole(role);
    const user = USERS.find((u) => u.role === role);
    if (user) setCurrentUser(user);
  }, []);

  const addStatusLog = useCallback(
    (orderId: string, fromStatus: string, toStatus: string, remark: string) => {
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
      const orderLog: StatusLog = {
        id: `sl_${orderId}_${Date.now()}`,
        orderId,
        fromStatus: '__assign__',
        toStatus: '__assign__',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        timestamp: now,
        remark: `指派处理人变更为 ${user.name}（${ROLE_LABEL[user.role]}）`,
      };
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                currentHandlerId: user.id,
                currentHandlerName: user.name,
                currentHandlerRole: user.role,
                statusLogs: [...o.statusLogs, orderLog],
                updateTime: now,
              }
            : o
        )
      );
      setRepairs((prev) =>
        prev.map((r) => {
          if (r.orderId !== orderId) return r;
          const repairLog: RepairLog = {
            id: `rpl_${r.id}_${Date.now()}`,
            repairId: r.id,
            step: '责任变更',
            action: '改派处理人',
            operatorId: currentUser.id,
            operatorName: currentUser.name,
            operatorRole: currentUser.role,
            timestamp: now,
            remark: `改派给 ${user.name}（${ROLE_LABEL[user.role]}）`,
          };
          return {
            ...r,
            assigneeId: user.id,
            assigneeName: user.name,
            assigneeRole: user.role,
            repairLogs: [...r.repairLogs, repairLog],
            updateTime: now,
          };
        })
      );
    },
    [currentUser]
  );

  const updateRepairStatus = useCallback(
    (
      repairId: string,
      newStatus: RepairStatus,
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
                blockerReason: typeof blockerReason === 'string' ? blockerReason : r.blockerReason,
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
                blockerReason: typeof blockerReason === 'string' ? blockerReason : r.blockerReason,
              }
            : r
        )
      );
    },
    [currentUser]
  );

  const confirmPayment = useCallback(
    (repairId: string, amount: number, remark: string): { ok: boolean; reason?: string } => {
      const now = new Date().toISOString();
      const linkedRepair = repairs.find((r) => r.id === repairId);
      if (!linkedRepair) return { ok: false, reason: '补缴单不存在，无法确认到账' };
      const linkedOrder = orders.find((o) => o.id === linkedRepair.orderId);
      if (!linkedOrder) return { ok: false, reason: '关联订单不存在，无法确认到账' };
      const log: RepairLog = {
        id: `rpl_${repairId}_${Date.now()}`,
        repairId,
        step: '补缴确认',
        action: '到账确认',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        timestamp: now,
        remark: `${remark}，到账金额¥${amount.toFixed(2)}`,
        result: `已补缴¥${amount.toFixed(2)}`,
      };
      setRepairs((prev) =>
        prev.map((r) => {
          if (r.id !== repairId) return r;
          const newUnpaid = Math.max(0, Number((r.unpaidAmount - amount).toFixed(2)));
          return {
            ...r,
            paidAmount: Number((r.paidAmount + amount).toFixed(2)),
            unpaidAmount: newUnpaid,
            repairLogs: [...r.repairLogs, log],
            repairStatus: newUnpaid <= 0 ? 'completed' : r.repairStatus,
            currentStep: newUnpaid <= 0 ? '补缴完成，流程闭环' : r.currentStep,
            blockerReason: newUnpaid <= 0 ? '' : r.blockerReason,
            updateTime: now,
          };
        })
      );
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== linkedOrder.id) return o;
          const newPaid = Number((o.paidAmount + amount).toFixed(2));
          const newStatus: ParkingOrder['status'] = newPaid >= o.actualFee ? 'exited' : o.status;
          const orderLog: StatusLog = {
            id: `sl_${o.id}_${Date.now()}`,
            orderId: o.id,
            fromStatus: o.status,
            toStatus: newStatus,
            operatorId: currentUser.id,
            operatorName: currentUser.name,
            operatorRole: currentUser.role,
            timestamp: now,
            remark: `${remark}，补缴到账¥${amount.toFixed(2)}${newStatus === 'exited' ? '，订单已闭环' : ''}`,
          };
          return {
            ...o,
            paidAmount: newPaid,
            status: newStatus,
            statusLogs: [...o.statusLogs, orderLog],
            updateTime: now,
          };
        })
      );
      return { ok: true };
    },
    [currentUser, repairs, orders]
  );

  const assignRepair = useCallback((repairId: string, userId: string): { ok: boolean; reason?: string } => {
    const now = new Date().toISOString();
    const user = USERS.find((u) => u.id === userId);
    if (!user) return { ok: false, reason: '目标处理人不存在' };
    const linkedRepair = repairs.find((r) => r.id === repairId);
    if (!linkedRepair) return { ok: false, reason: '补缴单不存在，无法改派' };
    const linkedOrder = orders.find((o) => o.id === linkedRepair.orderId);
    if (!linkedOrder) return { ok: false, reason: '关联订单不存在，无法改派' };
    const repairLog: RepairLog = {
      id: `rpl_${repairId}_${Date.now()}`,
      repairId,
      step: '责任变更',
      action: '改派处理人',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      timestamp: now,
      remark: `改派给 ${user.name}（${ROLE_LABEL[user.role]}）`,
    };
    setRepairs((prev) =>
      prev.map((r) =>
        r.id === repairId
          ? {
              ...r,
              assigneeId: user.id,
              assigneeName: user.name,
              assigneeRole: user.role,
              repairLogs: [...r.repairLogs, repairLog],
              updateTime: now,
            }
          : r
      )
    );
    const orderLog: StatusLog = {
      id: `sl_${linkedOrder.id}_${Date.now()}`,
      orderId: linkedOrder.id,
      fromStatus: '__assign__',
      toStatus: '__assign__',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      timestamp: now,
      remark: `补缴单改派给 ${user.name}（${ROLE_LABEL[user.role]}）`,
    };
    setOrders((prev) =>
      prev.map((o) =>
        o.id === linkedOrder.id
          ? {
              ...o,
              currentHandlerId: user.id,
              currentHandlerName: user.name,
              currentHandlerRole: user.role,
              statusLogs: [...o.statusLogs, orderLog],
              updateTime: now,
            }
          : o
      )
    );
    return { ok: true };
  }, [currentUser, repairs, orders]);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            orders={orders}
            repairs={repairs}
            currentRole={currentRole}
            onJumpOrders={() => setActiveMenu('orders')}
            onJumpRepairs={() => setActiveMenu('repairs')}
          />
        );
      case 'orders':
        return (
          <OrderList
            orders={orders}
            repairs={repairs}
            users={USERS}
            currentUser={currentUser}
            onAddStatusLog={addStatusLog}
            onAddRemark={addRemark}
            onAssignHandler={assignOrderHandler}
            onConfirmPayment={confirmPayment}
          />
        );
      case 'repairs':
        return (
          <RepairList
            repairs={repairs}
            orders={orders}
            users={USERS}
            currentUser={currentUser}
            onUpdateStatus={updateRepairStatus}
            onAddLog={addRepairLog}
            onConfirmPayment={confirmPayment}
            onAssignRepair={assignRepair}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontSize: 14,
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#001529',
          },
          Menu: {
            darkItemBg: '#001529',
            darkSubMenuItemBg: '#000c17',
          },
        },
      }}
    >
      <AntdApp>
        <MainLayout
          activeKey={activeMenu}
          onMenuChange={setActiveMenu}
          currentUserName={currentUser.name}
          currentUserRole={currentUser.role}
          onSwitchRole={switchRole}
        >
          {renderContent()}
        </MainLayout>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
