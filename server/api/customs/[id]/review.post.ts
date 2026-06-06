import { getDataStore } from '../../../utils/dataStore';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      return {
        success: false,
        error: '报关单ID不能为空'
      };
    }

    const body = await readBody(event);
    const { passed, reviewer, comment } = body;

    if (passed === undefined || !reviewer) {
      return {
        success: false,
        error: 'passed 和 reviewer 不能为空'
      };
    }

    const store = getDataStore();
    const document = store.getCustomsDocumentById(id);

    if (!document) {
      return {
        success: false,
        error: '报关单不存在'
      };
    }

    if (!store.isLatestCustomsVersion(id)) {
      return {
        success: false,
        error: '仅允许对最新版本的报关资料执行此操作'
      };
    }

    const newStatus = passed ? 'reviewed' : 'rejected';
    const updatedDoc = store.updateCustomsDocument(id, {
      status: newStatus,
      reviewer,
      reviewComment: comment
    });

    store.addCustomsTimelineEvent(id, {
      type: 'customs',
      title: passed ? '审核通过' : '审核驳回',
      description: passed ? '报关资料审核通过' : comment || '报关资料审核驳回',
      operator: reviewer,
      operatorRole: 'customs',
      timestamp: new Date().toISOString(),
      metadata: { passed, comment }
    });

    const order = store.getOrderById(document.orderId);
    if (order) {
      if (passed) {
        store.updateOrder(document.orderId, {
          status: 'completed',
          responsibilityFlag: 'none'
        });
        store.addOrderTimelineEvent(document.orderId, {
          type: 'customs',
          title: '报关审核通过',
          description: `关务人员 ${reviewer} 审核通过了报关资料，订单完成`,
          operator: reviewer,
          operatorRole: 'customs',
          timestamp: new Date().toISOString()
        });
      } else {
        store.updateOrder(document.orderId, {
          status: 'exception',
          responsibilityFlag: 'customs'
        });
        store.addOrderTimelineEvent(document.orderId, {
          type: 'customs',
          title: '报关审核驳回',
          description: `关务人员 ${reviewer} 驳回了报关资料：${comment || '资料不符合要求'}`,
          operator: reviewer,
          operatorRole: 'customs',
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      success: true,
      data: updatedDoc
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '审核失败'
    };
  }
});
