import { getData, generateId } from '../data/store.js';
import { addLog } from './logService.js';
import type { Order, RiskItem } from '../../shared/types.js';

export const getOrders = (status?: string): Order[] => {
  const { orders } = getData();
  if (status && status !== 'all') {
    return orders.filter(o => o.status === status);
  }
  return orders;
};

export const getOrderById = (id: string): Order | undefined => {
  const { orders } = getData();
  return orders.find(o => o.id === id);
};

export const updateOrderSpec = (
  orderId: string,
  newSpec: string,
  newQuantity?: number,
  operator: string = '孙销售',
): Order | null => {
  const { orders, packagingBatches, loadingBatches } = getData();
  const order = orders.find(o => o.id === orderId);

  if (!order) return null;

  const oldSpec = order.spec;
  const oldQuantity = order.quantity;

  order.spec = newSpec;
  if (newQuantity !== undefined) {
    order.quantity = newQuantity;
  }
  order.specChanged = true;
  order.lastSpecChange = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  packagingBatches.forEach(batch => {
    if (batch.orderId === orderId) {
      batch.spec = newSpec;
    }
  });

  loadingBatches.forEach(batch => {
    if (batch.orderId === orderId) {
      batch.spec = newSpec;
    }
  });

  const changes = [
    {
      field: 'spec',
      fieldText: '规格',
      oldValue: oldSpec,
      newValue: newSpec,
    },
  ];

  if (newQuantity !== undefined && newQuantity !== oldQuantity) {
    changes.push({
      field: 'quantity',
      fieldText: '数量',
      oldValue: `${oldQuantity} ${order.unit}`,
      newValue: `${newQuantity} ${order.unit}`,
    });
  }

  addLog({
    operator,
    operatorRole: 'sales',
    operatorRoleText: '销售内勤',
    action: 'spec_change',
    actionText: '变更订单规格',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.orderNo} / ${order.flowerType}`,
    description: `客户要求将规格从${oldSpec}调整为${newSpec}`,
    changes,
  });

  return order;
};

export const updateBloomForecast = (
  orderId: string,
  newForecast: string,
  operator: string = '李建国',
): Order | null => {
  const { orders, risks } = getData();
  const order = orders.find(o => o.id === orderId);

  if (!order) return null;

  const oldForecast = order.bloomForecast;
  order.bloomForecast = newForecast;
  order.updatedAt = new Date().toISOString();

  const oldDate = new Date(oldForecast);
  const newDate = new Date(newForecast);
  const daysDiff = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));

  if (Math.abs(daysDiff) >= 1) {
    const existingRisk = risks.find(r => r.targetId === order.id && r.type === 'bloom_deviation');
    if (!existingRisk) {
      const risk: RiskItem = {
        id: generateId('risk'),
        title: daysDiff > 0 ? '花期预测推迟' : '花期预测提前',
        description: `${order.flowerType}花期预测${daysDiff > 0 ? '推迟' : '提前'}${Math.abs(daysDiff)}天，${daysDiff > 0 ? '可能影响交货时间' : '请提前安排采收'}`,
        level: Math.abs(daysDiff) >= 2 ? 'high' : 'medium',
        levelText: Math.abs(daysDiff) >= 2 ? '高风险' : '中风险',
        type: 'bloom_deviation',
        typeText: '花期偏差',
        targetId: order.id,
        targetName: order.orderNo,
        detectedAt: new Date().toISOString(),
      };
      risks.push(risk);
    } else {
      existingRisk.title = daysDiff > 0 ? '花期预测推迟' : '花期预测提前';
      existingRisk.description = `${order.flowerType}花期预测${daysDiff > 0 ? '推迟' : '提前'}${Math.abs(daysDiff)}天，${daysDiff > 0 ? '可能影响交货时间' : '请提前安排采收'}`;
      existingRisk.level = Math.abs(daysDiff) >= 2 ? 'high' : 'medium';
      existingRisk.levelText = Math.abs(daysDiff) >= 2 ? '高风险' : '中风险';
      existingRisk.detectedAt = new Date().toISOString();
    }
  }

  addLog({
    operator,
    operatorRole: 'grower',
    operatorRoleText: '种植员',
    action: 'bloom_forecast',
    actionText: '花期预测调整',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.orderNo} / ${order.flowerType}`,
    description: `花期预测从${oldForecast}调整为${newForecast}`,
    changes: [
      {
        field: 'bloomForecast',
        fieldText: '预计花期',
        oldValue: oldForecast,
        newValue: newForecast,
      },
    ],
  });

  return order;
};

export const reportActualBloom = (
  orderId: string,
  actualBloom: string,
  operator: string = '李建国',
): Order | null => {
  const { orders } = getData();
  const order = orders.find(o => o.id === orderId);

  if (!order) return null;

  order.bloomActual = actualBloom;
  order.updatedAt = new Date().toISOString();

  if (order.status === 'scheduled' || order.status === 'pending') {
    order.status = 'packaging';
    order.statusText = '包装中';
  }

  addLog({
    operator,
    operatorRole: 'grower',
    operatorRoleText: '种植员',
    action: 'bloom_report',
    actionText: '花期上报',
    targetType: 'order',
    targetId: order.id,
    targetName: `${order.orderNo} / ${order.flowerType}`,
    description: `${order.flowerType}已进入盛花期，实际花期${actualBloom}，可以安排采收`,
  });

  return order;
};

export const recordPatrol = (
  greenhouseId: string,
  greenhouseName: string,
  description: string,
  orderId?: string,
  operator: string = '李建国',
): boolean => {
  const { orders } = getData();
  const order = orderId ? orders.find(o => o.id === orderId) : undefined;

  addLog({
    operator,
    operatorRole: 'grower',
    operatorRoleText: '种植员',
    action: 'patrol_record',
    actionText: '棚区巡检',
    targetType: 'greenhouse',
    targetId: greenhouseId,
    targetName: greenhouseName,
    description: order
      ? `${description}（关联订单：${order.orderNo} / ${order.flowerType}）`
      : description,
    changes: orderId ? [{
      field: 'orderId',
      fieldText: '关联订单',
      oldValue: '',
      newValue: orderId,
    }] : undefined,
  });

  if (order) {
    addLog({
      operator,
      operatorRole: 'grower',
      operatorRoleText: '种植员',
      action: 'patrol_record',
      actionText: '棚区巡检',
      targetType: 'order',
      targetId: order.id,
      targetName: `${order.orderNo} / ${order.flowerType}`,
      description: `${greenhouseName}巡检：${description}`,
    });
  }

  return true;
};
