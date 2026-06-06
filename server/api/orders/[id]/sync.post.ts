import { getDataStore } from '../../../utils/dataStore';
import type { OrderStatus } from '../../../../types';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      return {
        success: false,
        error: '订单ID不能为空'
      };
    }

    const store = getDataStore();
    const order = store.getOrderById(id);

    if (!order) {
      return {
        success: false,
        error: '订单不存在'
      };
    }

    const newStatus: OrderStatus = 'synced';
    const updatedOrder = store.updateOrder(id, {
      status: newStatus,
      syncCount: order.syncCount + 1,
      lastSyncAt: new Date().toISOString()
    });

    store.addOrderTimelineEvent(id, {
      type: 'sync',
      title: '订单同步成功',
      description: '订单信息已同步至ERP系统',
      operator: '系统',
      operatorRole: 'system',
      timestamp: new Date().toISOString(),
      metadata: { syncCount: order.syncCount + 1 }
    });

    return {
      success: true,
      data: updatedOrder
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '订单同步失败'
    };
  }
});
