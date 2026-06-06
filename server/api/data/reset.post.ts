import { getDataStore } from '../../utils/dataStore';

export default defineEventHandler(async (_event) => {
  try {
    const store = getDataStore();
    store.resetAllData();

    return {
      success: true,
      data: { message: '数据已重置' }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '重置数据失败'
    };
  }
});
