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
    const { submitter } = body;

    if (!submitter) {
      return {
        success: false,
        error: 'submitter 不能为空'
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

    const updatedDoc = store.updateCustomsDocument(id, {
      status: 'pending_review',
      submitter
    });

    store.addCustomsTimelineEvent(id, {
      type: 'status_change',
      title: '提交审核',
      description: '报关资料已提交审核',
      operator: submitter,
      operatorRole: 'customs',
      timestamp: new Date().toISOString(),
      metadata: { from: document.status, to: 'pending_review' }
    });

    const order = store.getOrderById(document.orderId);
    if (order) {
      store.updateOrder(document.orderId, {
        status: 'customs_processing',
        responsibilityFlag: 'none'
      });
      store.addOrderTimelineEvent(document.orderId, {
        type: 'customs',
        title: '报关资料提交审核',
        description: `关务人员 ${submitter} 已提交报关资料审核`,
        operator: submitter,
        operatorRole: 'customs',
        timestamp: new Date().toISOString()
      });
    }

    return {
      success: true,
      data: updatedDoc
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '提交审核失败'
    };
  }
});
