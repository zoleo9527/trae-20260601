import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CustomerOrder, OperationLog, RoleType, OrderStatus, StuckRecord, OrderItem } from '@/types';
import { mockOrders, mockLogs } from '@/mock/data';
import { orderStatusText } from '@/utils';

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<CustomerOrder[]>(JSON.parse(JSON.stringify(mockOrders)));
  const logs = ref<OperationLog[]>(JSON.parse(JSON.stringify(mockLogs)));

  const pad = (n: number) => n.toString().padStart(2, '0');

  const stuckOrders = computed(() => orders.value.filter((o) => o.status === 'STUCK'));
  const stuckCount = computed(() => stuckOrders.value.length);
  const stuckSummary = computed(() => stuckOrders.value.slice(0, 3).map((o) => `${o.id} ${o.stuckRecord?.stuckType === 'FORECAST_DEVIATION' ? '花期' : o.stuckRecord?.stuckType === 'PACKAGE_DAMAGE' ? '包装' : '改单'}`).join('、'));

  function getOrderById(id: string) {
    return orders.value.find((o) => o.id === id);
  }

  function getLogsByOrderId(orderId: string) {
    return logs.value.filter((l) => l.orderId === orderId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  function addLog(orderId: string, role: RoleType | 'SYSTEM', operatorName: string, action: string, detail: string, isStuck = false) {
    const id = `${orderId}-L${Date.now()}`;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    logs.value.unshift({ id, orderId, role, operatorName, action, detail, timestamp, isStuck });
    const order = getOrderById(orderId);
    if (order) order.updatedAt = timestamp;
  }

  function nowStr() {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  function addOrder(data: {
    customerName: string;
    phone: string;
    deliveryDate: string;
    address: string;
    specNote: string;
    items: Omit<OrderItem, 'id' | 'orderId'>[];
  }) {
    const seq = (orders.value.length + 1).toString().padStart(3, '0');
    const id = `DD${new Date().getFullYear()}${pad(new Date().getMonth() + 1)}${pad(new Date().getDate())}${seq}`;
    const ts = nowStr();

    const items: OrderItem[] = data.items.map((it, idx) => ({
      ...it,
      id: `OI${Date.now()}_${idx}`,
      orderId: id,
    }));

    const order: CustomerOrder = {
      id,
      customerName: data.customerName,
      phone: data.phone,
      deliveryDate: data.deliveryDate,
      address: data.address,
      status: 'PENDING_CONFIRM',
      totalAmount: data.items.reduce((s, it) => s + it.quantity * 200, 0),
      specNote: data.specNote,
      createdAt: ts,
      updatedAt: ts,
      operator: 'SALES',
      items,
      harvestPlan: {
        id: `HP${Date.now()}`,
        orderId: id,
        shelterId: items[0]?.shelterId || 'SH-A01',
        planDate: data.deliveryDate,
        planQty: items.reduce((s, it) => s + it.quantity, 0),
        status: 'PENDING',
        operator: ['李师傅', '王师傅', '张师傅'][Math.floor(Math.random() * 3)],
      },
    };

    orders.value.unshift(order);
    addLog(id, 'SALES', '销售-小林', '创建订单', `新建订单,客户:${data.customerName},共${items.length}个品种`);
    return order;
  }

  function changeSpec(id: string, newSpecNote: string, changedBy: string) {
    const order = getOrderById(id);
    if (!order) return;
    const before = order.specNote;
    if (before === newSpecNote) return;

    const changeRecord = {
      id: `SCH${Date.now()}`,
      changedAt: nowStr(),
      changedBy,
      before,
      after: newSpecNote,
    };

    if (!order.specChangeHistory) {
      order.specChangeHistory = [];
    }
    order.specChangeHistory.push(changeRecord);

    order.specNote = newSpecNote;

    const beforeShort = before.length > 20 ? before.slice(0, 20) + '...' : before;
    const afterShort = newSpecNote.length > 20 ? newSpecNote.slice(0, 20) + '...' : newSpecNote;
    addLog(id, 'SALES', changedBy, '修改规格', `${beforeShort} → ${afterShort}`);
  }

  function updateOrderStatus(id: string, status: OrderStatus, operator: RoleType) {
    const order = getOrderById(id);
    if (!order) return;
    order.previousStatus = order.status;
    order.status = status;
    order.operator = operator;
    addLog(id, operator, operator === 'SALES' ? '销售-小林' : operator === 'GROWER' ? '种植-李师傅' : '包装-老赵', `更新状态`, `状态变更: ${orderStatusText[order.previousStatus]} → ${orderStatusText[status]}`);
  }

  function confirmOrder(id: string) {
    const order = getOrderById(id);
    if (!order) return;
    order.previousStatus = order.status;
    order.status = 'HARVESTING';
    order.operator = 'GROWER';
    if (order.harvestPlan) {
      order.harvestPlan.status = 'PENDING';
    }
    addLog(id, 'SALES', '销售-小林', '确认订单', '已确认,系统自动生成采切排期,推送至种植员工作台');
    addLog(id, 'SYSTEM', '系统', '生成采切排期', `自动分配至${order.items[0]?.shelterId || '-'},计划日期${order.harvestPlan?.planDate}`);
  }

  function completeHarvest(id: string, actualQty: number) {
    const order = getOrderById(id);
    if (!order || !order.harvestPlan) return;
    order.harvestPlan.actualQty = actualQty;
    order.harvestPlan.status = 'DONE';
    order.previousStatus = order.status;
    order.status = 'PACKING';
    order.operator = 'PACKER';
    addLog(id, 'GROWER', '种植-李师傅', '完成采切', `实际采切${actualQty}扎,已推送至包装队列`);
  }

  function reportStuck(id: string, stuckRecord: Omit<StuckRecord, 'id' | 'orderId' | 'stuckAt'>) {
    const order = getOrderById(id);
    if (!order) return;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    order.previousStatus = order.status;
    order.status = 'STUCK';
    order.stuckRecord = { id: `STK${Date.now()}`, orderId: id, stuckAt: nowStr, ...stuckRecord };
    const isPacker = stuckRecord.stuckType === 'PACKAGE_DAMAGE';
    const isGrower = stuckRecord.stuckType === 'FORECAST_DEVIATION';
    const roleType = isPacker ? 'PACKER' : isGrower ? 'GROWER' : 'SALES';
    const operatorName = isPacker ? '包装-老赵' : isGrower ? '种植-李师傅' : '销售-小林';
    addLog(id, roleType, operatorName, '标记卡住', stuckRecord.reason, true);
  }

  function resolveStuck(id: string, resolver: string, resolution: string) {
    const order = getOrderById(id);
    if (!order || !order.stuckRecord) return;
    const ts = nowStr();
    order.stuckRecord.resolvedAt = ts;
    order.stuckRecord.resolver = resolver;
    order.stuckRecord.resolution = resolution;

    const stuckType = order.stuckRecord.stuckType;
    const prev = order.previousStatus || 'PENDING_CONFIRM';

    if (stuckType === 'CUSTOMER_CHANGE') {
      order.status = 'PENDING_CONFIRM';
      order.operator = 'SALES';
      addLog(id, 'SALES', resolver, '恢复卡住·客户改规格', `${resolution} → 订单回到待确认,等待销售确认新规格`);
    } else if (stuckType === 'FORECAST_DEVIATION') {
      order.status = 'HARVESTING';
      order.operator = 'GROWER';
      if (order.harvestPlan) {
        order.harvestPlan.status = 'HARVESTING';
      }
      addLog(id, 'GROWER', resolver, '恢复卡住·花期异常', `${resolution} → 采切继续`);
    } else if (stuckType === 'PACKAGE_DAMAGE') {
      order.status = 'PACKING';
      order.operator = 'PACKER';
      addLog(id, 'PACKER', resolver, '恢复卡住·包装破损', `${resolution} → 包装继续`);
    } else {
      order.status = prev === 'STUCK' ? 'HARVESTING' : prev;
      addLog(id, order.operator, resolver, '恢复卡住', resolution);
    }
  }

  function confirmShip(id: string, logisticsNo: string) {
    const order = getOrderById(id);
    if (!order) return;
    order.logisticsNo = logisticsNo;
    order.previousStatus = order.status;
    order.status = 'COMPLETED';
    order.operator = 'PACKER';
    addLog(id, 'PACKER', '包装-老赵', '确认发货', `物流单号:${logisticsNo}`);
  }

  function getSalesTodoCount() {
    return orders.value.filter((o) => o.status === 'PENDING_CONFIRM' || (o.status === 'STUCK' && o.stuckRecord?.stuckType === 'CUSTOMER_CHANGE')).length;
  }
  function getGrowerTodoCount() {
    return orders.value.filter((o) => o.status === 'HARVESTING' || (o.status === 'STUCK' && o.stuckRecord?.stuckType === 'FORECAST_DEVIATION')).length;
  }
  function getPackerTodoCount() {
    return orders.value.filter((o) => o.status === 'PACKING' || (o.status === 'STUCK' && o.stuckRecord?.stuckType === 'PACKAGE_DAMAGE')).length;
  }

  return {
    orders,
    logs,
    stuckOrders,
    stuckCount,
    stuckSummary,
    getOrderById,
    getLogsByOrderId,
    addLog,
    addOrder,
    changeSpec,
    updateOrderStatus,
    confirmOrder,
    completeHarvest,
    reportStuck,
    resolveStuck,
    confirmShip,
    getSalesTodoCount,
    getGrowerTodoCount,
    getPackerTodoCount,
  };
});
