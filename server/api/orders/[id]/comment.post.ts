import { getDataStore } from '../../../utils/dataStore';
import type { UserRole } from '../../../../types';

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
    const { content, operator, operatorRole } = body;

    if (!content || !operator || !operatorRole) {
      return {
        success: false,
        error: 'content、operator 和 operatorRole 不能为空'
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

    const timelineEvent = store.addOrderTimelineEvent(id, {
      type: 'comment',
      title: '添加备注',
      description: content,
      operator,
      operatorRole: operatorRole as UserRole,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: timelineEvent
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '添加备注失败'
    };
  }
});
