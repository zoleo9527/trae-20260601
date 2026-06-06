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

    const updatedDoc = store.updateCustomsDocument(id, body);

    return {
      success: true,
      data: updatedDoc
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '更新报关资料失败'
    };
  }
});
