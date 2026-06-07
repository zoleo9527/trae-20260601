
import { db } from '../db/database.js';
import type { User, DashboardStats } from '../../shared/types.js';

export function getDemoUsers(): User[] {
  return db.users;
}

export function findUserByUsernameAndRole(username: string, role: string): User | null {
  return db.findUserByUsernameAndRole(username, role) || null;
}

export function getDashboardStats(): DashboardStats {
  const promotions = db.promotions;
  const inspections = db.inspections;

  const stats: DashboardStats = {
    pendingPromotions: 0,
    processingPromotions: 0,
    completedPromotions: 0,
    pendingInspections: 0,
    processingInspections: 0,
    rejectedInspections: 0,
    completedInspections: 0,
  };

  promotions.forEach((p) => {
    switch (p.status) {
      case 'pending':
        stats.pendingPromotions++;
        break;
      case 'processing':
        stats.processingPromotions++;
        break;
      case 'completed':
        stats.completedPromotions++;
        break;
    }
  });

  inspections.forEach((i) => {
    switch (i.status) {
      case 'pending':
        stats.pendingInspections++;
        break;
      case 'processing':
        stats.processingInspections++;
        break;
      case 'rejected':
        stats.rejectedInspections++;
        break;
      case 'completed':
        stats.completedInspections++;
        break;
    }
  });

  return stats;
}
