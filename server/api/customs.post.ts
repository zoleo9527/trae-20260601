import { getDataStore } from '../utils/dataStore';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      orderId,
      orderNo,
      version = 1,
      exporter,
      importer,
      goodsDescription,
      hsCode,
      declaredValue,
      currency,
      weight,
      quantity,
      submitter = '系统'
    } = body;

    if (!orderId || !orderNo || !exporter || !importer || !goodsDescription || !hsCode || !declaredValue || !currency || !weight || !quantity) {
      return {
        success: false,
        error: '报关资料字段不完整'
      };
    }

    const store = getDataStore();
    const newDoc = store.createCustomsDocument({
      orderId,
      orderNo,
      version,
      status: 'draft',
      exporter,
      importer,
      goodsDescription,
      hsCode,
      declaredValue,
      currency,
      weight,
      quantity,
      submitter
    });

    store.addCustomsTimelineEvent(newDoc.id, {
      type: 'customs',
      title: '创建报关资料',
      description: `报关资料已创建，版本 V${version}`,
      operator: submitter,
      operatorRole: 'customs',
      timestamp: new Date().toISOString(),
      metadata: { version }
    });

    const order = store.getOrderById(orderId);
    if (order) {
      store.updateOrder(orderId, { status: 'customs_processing' });
      store.addOrderTimelineEvent(orderId, {
        type: 'customs',
        title: '报关资料已创建',
        description: `关务人员 ${submitter} 已创建报关资料`,
        operator: submitter,
        operatorRole: 'customs',
        timestamp: new Date().toISOString()
      });
    }

    return {
      success: true,
      data: newDoc
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '创建报关资料失败'
    };
  }
});
