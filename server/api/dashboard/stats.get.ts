import { getDataStore } from '../../utils/dataStore';
import type { DashboardStats } from '../../../types';

export default defineEventHandler(async (_event) => {
  try {
    const store = getDataStore();
    const orders = store.getOrders();
    const customsDocuments = store.getCustomsDocuments();
    const inventoryItems = store.getInventoryItems();

    const today = new Date().toDateString();
    const todaySynced = orders.filter(o => 
      o.lastSyncAt && new Date(o.lastSyncAt).toDateString() === today
    ).length;

    const reviewedDocs = customsDocuments.filter(d => d.status === 'reviewed' || d.status === 'completed');
    const totalReviewed = customsDocuments.filter(d => d.status !== 'draft' && d.status !== 'pending_review').length;
    const customsPassRate = totalReviewed > 0 ? (reviewedDocs.length / totalReviewed) * 100 : 0;

    const stats: DashboardStats = {
      totalOrders: orders.length,
      todaySynced,
      pendingCustoms: orders.filter(o => o.status === 'pending_customs').length,
      customsPassRate: Math.round(customsPassRate * 100) / 100,
      exceptionOrders: orders.filter(o => o.status === 'exception' || o.status === 'sync_failed').length,
      pendingResponsibility: orders.filter(o => o.responsibilityFlag === 'pending_confirm').length,
      inventoryWarnings: inventoryItems.filter(i => i.availableQuantity <= i.warningThreshold).length
    };

    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '获取统计数据失败'
    };
  }
});
