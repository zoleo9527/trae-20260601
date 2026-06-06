import { getDataStore } from '../utils/dataStore';

export default defineEventHandler(async (_event) => {
  try {
    const store = getDataStore();
    const inventoryItems = store.getInventoryItems();

    return {
      success: true,
      data: inventoryItems
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '获取库存列表失败'
    };
  }
});
