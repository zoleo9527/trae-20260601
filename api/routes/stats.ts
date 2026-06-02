
import { Router, type Request, type Response } from 'express';
import { stations, faults, workOrders, complaints, disputes, orders } from '../data/store.js';
import type { DashboardStats } from '../../shared/types.js';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  const totalStations = stations.length;
  const onlineStations = stations.filter((s) => s.status === 'normal').length;
  const activeFaults = faults.filter((f) => f.status === 'pending' || f.status === 'processing').length;
  const pendingWorkOrders = workOrders.filter((w) => w.status === 'pending' || w.status === 'accepted' || w.status === 'arrived' || w.status === 'processing').length;
  const todayRevenue = orders.filter((o) => o.status === 'completed' || o.status === 'refunded').reduce((sum, o) => sum + o.amount, 0);
  const monthRevenue = todayRevenue * 30;
  const pendingComplaints = complaints.filter((c) => c.status === 'pending' || c.status === 'processing').length;
  const pendingDisputes = disputes.filter((d) => d.status === 'pending' || d.status === 'reviewing').length;

  const stats: DashboardStats = {
    totalStations,
    onlineStations,
    activeFaults,
    pendingWorkOrders,
    todayRevenue,
    monthRevenue,
    pendingComplaints,
    pendingDisputes,
  };

  res.json({
    success: true,
    data: stats,
  });
});

router.get('/trends', async (req: Request, res: Response): Promise<void> => {
  const days = 7;
  const faultTrends = Array.from({ length: days }, (_, i) => ({
    date: `2024-05-${26 + i}`,
    count: Math.floor(Math.random() * 5) + 1,
  }));

  const revenueTrends = Array.from({ length: days }, (_, i) => ({
    date: `2024-05-${26 + i}`,
    revenue: Math.floor(Math.random() * 5000) + 10000,
  }));

  const workOrderTrends = Array.from({ length: days }, (_, i) => ({
    date: `2024-05-${26 + i}`,
    completed: Math.floor(Math.random() * 8) + 2,
    pending: Math.floor(Math.random() * 4) + 1,
  }));

  res.json({
    success: true,
    data: {
      faultTrends,
      revenueTrends,
      workOrderTrends,
    },
  });
});

export default router;
