import { getData } from '../data/store.js';
import { getLogs } from './logService.js';
import type { DashboardData } from '../../shared/types.js';

export const getDashboardData = (): DashboardData => {
  const { orders, packagingBatches, loadingBatches, risks, tasks } = getData();

  const pendingInspection = packagingBatches.filter(
    b => b.status === 'pending' || b.status === 'inspecting',
  ).length;

  const pendingLoading = loadingBatches.filter(b => b.status === 'pending').length;

  const inspectedBatches = packagingBatches.filter(b => b.inspectionResult);
  const totalDamaged = inspectedBatches.reduce(
    (sum, b) => sum + (b.inspectionResult?.damagedQty || 0),
    0,
  );
  const totalQty = inspectedBatches.reduce(
    (sum, b) => sum + (b.inspectionResult?.qualifiedQty || 0) + (b.inspectionResult?.damagedQty || 0),
    0,
  );
  const damageRate = totalQty > 0 ? Math.round((totalDamaged / totalQty) * 1000) / 10 : 0;

  const recentChanges = getLogs({ limit: 6 });

  return {
    stats: {
      totalOrders: orders.length,
      pendingInspection,
      pendingLoading,
      damageRate,
    },
    tasks: tasks.slice(0, 5),
    risks: risks.filter(r => r.level === 'high' || r.level === 'medium').slice(0, 3),
    recentChanges,
  };
};
