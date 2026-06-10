import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CustomerOrder, OperationLog, RoleType, OrderStatus, StuckRecord, OrderItem, OrderItemSnapshot, SpecChangeRecord } from '@/types';
import { mockOrders, mockLogs } from '@/mock/data';
import { orderStatusText, calcOrderAmount } from '@/utils';

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

  function snapshotItems(items: OrderItem[]): OrderItemSnapshot[] {
    return items.map((it) => ({
      flowerType: it.flowerType,
      color: it.color,
      quantity: it.quantity,
      stemsPerBunch: it.stemsPerBunch,
      shelterId: it.shelterId,
      remark: it.remark,
    }));
  }

  function calcAmount(items: Array<{ flowerType: string; quantity: number }>): number {
    return calcOrderAmount(items);
  }

  function rebuildHarvestPlan(order: CustomerOrder) {
    if (!order.harvestPlan) return;
    const newPlanQty = order.items.reduce((s, it) => s + it.quantity, 0);
    const newShelterId = order.items[0]?.shelterId || order.harvestPlan.shelterId;
    order.harvestPlan.planQty = newPlanQty;
    order.harvestPlan.shelterId = newShelterId;
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
      totalAmount: calcAmount(data.items),
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

  function changeSpec(
    id: string,
    data: {
      specNote: string;
      items: Array<Omit<OrderItem, 'id' | 'orderId'>>;
    },
    changedBy: string,
  ): SpecChangeRecord | null {
    const order = getOrderById(id);
    if (!order) return null;

    const beforeItems = snapshotItems(order.items);
    const beforeAmount = order.totalAmount;
    const beforeSpecNote = order.specNote;
    const beforePlan = order.harvestPlan
      ? { shelterId: order.harvestPlan.shelterId, planQty: order.harvestPlan.planQty }
      : undefined;

    const itemsChanged =
      beforeItems.length !== data.items.length ||
      beforeItems.some((it, idx) => {
        const ni = data.items[idx];
        if (!ni) return true;
        return (
          it.flowerType !== ni.flowerType ||
          it.color !== ni.color ||
          it.quantity !== ni.quantity ||
          it.stemsPerBunch !== ni.stemsPerBunch ||
          it.shelterId !== ni.shelterId
        );
      });

    const specChanged = beforeSpecNote !== data.specNote;
    if (!itemsChanged && !specChanged) return null;

    const newItems: OrderItem[] = data.items.map((it, idx) => ({
      ...it,
      id: `OI${Date.now()}_${idx}`,
      orderId: id,
    }));

    order.items = newItems;
    order.specNote = data.specNote;
    order.totalAmount = calcAmount(newItems);

    if (order.harvestPlan) {
      rebuildHarvestPlan(order);
    }

    const afterPlan = order.harvestPlan
      ? { shelterId: order.harvestPlan.shelterId, planQty: order.harvestPlan.planQty }
      : undefined;

    const record: SpecChangeRecord = {
      id: `SCH${Date.now()}`,
      changedAt: nowStr(),
      changedBy,
      beforeSpecNote,
      afterSpecNote: data.specNote,
      beforeItems,
      afterItems: snapshotItems(newItems),
      beforeAmount,
      afterAmount: order.totalAmount,
      beforeHarvestPlan: beforePlan,
      afterHarvestPlan: afterPlan,
    };

    if (!order.specChangeHistory) {
      order.specChangeHistory = [];
    }
    order.specChangeHistory.push(record);

    const itemDesc = newItems.map((i) => `${i.flowerType}${i.color}×${i.quantity}扎`).join('、');
    const amountDesc = beforeAmount !== order.totalAmount
      ? `,金额 ¥${beforeAmount.toLocaleString()} → ¥${order.totalAmount.toLocaleString()}`
      : '';
    addLog(id, 'SALES', changedBy, '修改规格', `明细:${itemDesc}${amountDesc}${specChanged ? `,包装:${beforeSpecNote.length > 15 ? beforeSpecNote.slice(0, 15) + '...' : beforeSpecNote} → ${data.specNote.length > 15 ? data.specNote.slice(0, 15) + '...' : data.specNote}` : ''}`);

    return record;
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
      rebuildHarvestPlan(order);
      order.harvestPlan.status = 'PENDING';
      order.harvestPlan.id = `HP${Date.now()}`;
    } else {
      const newPlanQty = order.items.reduce((s, it) => s + it.quantity, 0);
      const newShelterId = order.items[0]?.shelterId || 'SH-A01';
      order.harvestPlan = {
        id: `HP${Date.now()}`,
        orderId: id,
        shelterId: newShelterId,
        planDate: order.deliveryDate,
        planQty: newPlanQty,
        status: 'PENDING',
        operator: ['李师傅', '王师傅', '张师傅'][Math.floor(Math.random() * 3)],
      };
    }

    const wasFromStuck = order.previousStatus === 'PENDING_CONFIRM' && order.specChangeHistory && order.specChangeHistory.length > 0;
    const rebuildNote = wasFromStuck ? '（已基于新明细重建采切排期,避免沿用旧排期）' : '';

    addLog(id, 'SALES', '销售-小林', '确认订单', `已确认,系统自动生成采切排期,推送至种植员工作台${rebuildNote}`);
    addLog(id, 'SYSTEM', '系统', '生成采切排期', `自动分配至${order.items[0]?.shelterId || '-'},计划数量${order.harvestPlan?.planQty}扎,计划日期${order.harvestPlan?.planDate}`);
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
    order.previousStatus = order.status;
    order.status = 'STUCK';
    order.stuckRecord = { id: `STK${Date.now()}`, orderId: id, stuckAt: nowStr(), ...stuckRecord };
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
      const hasChange = order.specChangeHistory && order.specChangeHistory.length > 0;
      const note = hasChange
        ? `已改规格,需销售基于新明细确认 → 确认后将重建采切排期,不再沿用旧排期`
        : `待销售确认新规格`;
      addLog(id, 'SALES', resolver, '恢复卡住·客户改规格', `${resolution} → ${note}`);
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
