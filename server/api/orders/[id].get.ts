import { getDataStore } from '../../utils/dataStore';

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

    return {
      success: true,
      data: order
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '获取订单详情失败'
    };
  }
});
