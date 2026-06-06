import { getDataStore } from '../../utils/dataStore';

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

    const operator = body.submitter || body.operator || '系统';
    
    const newDoc = store.createCustomsDocumentNewVersion(id, body);

    if (newDoc) {
      store.addCustomsTimelineEvent(newDoc.id, {
        type: 'customs',
        title: '创建新版本',
        description: `基于 V${document.version} 创建新版本 V${newDoc.version}`,
        operator,
        operatorRole: 'customs',
        timestamp: new Date().toISOString(),
        metadata: { fromVersion: document.version, toVersion: newDoc.version }
      });

      const order = store.getOrderById(document.orderId);
      if (order) {
        store.addOrderTimelineEvent(document.orderId, {
          type: 'customs',
          title: '报关资料更新',
          description: `关务人员 ${operator} 更新了报关资料，版本 V${newDoc.version}`,
          operator,
          operatorRole: 'customs',
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      success: true,
      data: newDoc
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '更新报关资料失败'
    };
  }
});
