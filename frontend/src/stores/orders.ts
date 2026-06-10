import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CustomerOrder, OperationLog, RoleType, OrderStatus, StuckRecord } from '@/types';
import { mockOrders, mockLogs } from '@/mock/data';
import { orderStatusText } from '@/utils';

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<CustomerOrder[]>(JSON.parse(JSON.stringify(mockOrders)));
  const logs = ref<OperationLog[]>(JSON.parse(JSON.stringify(mockLogs)));

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
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    logs.value.unshift({ id, orderId, role, operatorName, action, detail, timestamp, isStuck });
    const order = getOrderById(orderId);
    if (order) order.updatedAt = timestamp;
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
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    order.stuckRecord.resolvedAt = nowStr;
    order.stuckRecord.resolver = resolver;
    order.stuckRecord.resolution = resolution;
    const prev = order.previousStatus || order.status;
    order.status = prev === 'STUCK' ? 'HARVESTING' : prev;
    addLog(id, order.operator, resolver, '恢复卡住', resolution);
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
