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
      quantity
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
      quantity
    });

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
