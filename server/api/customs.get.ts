import { getDataStore } from '../utils/dataStore';
import type { CustomsDocument } from '../../types';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const store = getDataStore();
    let documents = store.getCustomsDocuments();

    if (query.status) {
      documents = documents.filter((d: CustomsDocument) => d.status === query.status);
    }

    return {
      success: true,
      data: documents
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '获取报关资料列表失败'
    };
  }
});
