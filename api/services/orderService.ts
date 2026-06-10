import { getData, generateId } from '../data/store.js';
import { addLog } from './logService.js';
import type { Order } from '../../shared/types.js';

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
  const { orders } = getData();
  const order = orders.find(o => o.id === orderId);

  if (!order) return null;

  const oldForecast = order.bloomForecast;
  order.bloomForecast = newForecast;
  order.updatedAt = new Date().toISOString();

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
