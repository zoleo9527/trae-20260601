import { getDataStore } from '../utils/dataStore';
import type { Order } from '../../types';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const store = getDataStore();
    let orders = store.getOrders();

    if (query.status) {
      orders = orders.filter((o: Order) => o.status === query.status);
    }

    if (query.platform) {
      orders = orders.filter((o: Order) => o.platform === query.platform);
    }

    return {
      success: true,
      data: orders
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '获取订单列表失败'
    };
  }
});
