import { getDataStore } from '../../../utils/dataStore';
import type { ResponsibilityFlag } from '../../../../types';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      return {
        success: false,
        error: '订单ID不能为空'
      };
    }

    const body = await readBody(event);
    const { flag, operator } = body;

    if (!flag || !operator) {
      return {
        success: false,
        error: 'flag 和 operator 不能为空'
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

    const updatedOrder = store.updateOrder(id, {
      responsibilityFlag: flag as ResponsibilityFlag
    });

    const flagLabels: Record<string, string> = {
      'none': '无责任标记',
      'pending_confirm': '责任待确认',
      'operation': '运营责任',
      'customs': '关务责任'
    };

    store.addOrderTimelineEvent(id, {
      type: 'responsibility',
      title: '责任归属标记',
      description: `责任归属已标记为：${flagLabels[flag] || flag}`,
      operator,
      operatorRole: 'operation',
      timestamp: new Date().toISOString(),
      metadata: { flag }
    });

    return {
      success: true,
      data: updatedOrder
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '标记责任归属失败'
    };
  }
});
