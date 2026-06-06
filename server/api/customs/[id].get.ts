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

    const store = getDataStore();
    const document = store.getCustomsDocumentById(id);

    if (!document) {
      return {
        success: false,
        error: '报关单不存在'
      };
    }

    return {
      success: true,
      data: document
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '获取报关单详情失败'
    };
  }
});
