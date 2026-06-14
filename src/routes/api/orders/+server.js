import { json } from '@sveltejs/kit';
import { getAllOrders, getOrdersByStatus, getDashboardStats, enrichOrdersWithAbnormal } from '$lib/services.js';

export async function GET({ url }) {
  const status = url.searchParams.get('status');
  const stats = url.searchParams.get('stats');
  const abnormal = url.searchParams.get('abnormal');

  if (stats) {
    return json(getDashboardStats());
  }

  let orders;
  if (status) {
    orders = getOrdersByStatus(status.split(','));
  } else {
    orders = getAllOrders();
  }

  orders = enrichOrdersWithAbnormal(orders);

  if (abnormal === '1') {
    orders = orders.filter(o => o.last_abnormal);
  } else if (abnormal === 'mine') {
    const role = url.searchParams.get('role');
    const statusMap = {
      OVERDUE_PENDING: 'APPRAISER',
      OVERDUE_CONFIRMED: 'STORAGE',
      STORAGE_CHECKED: 'FINANCE',
      FINANCIAL_SETTLED: 'APPRAISER',
      CUSTOMER_NOTIFIED: 'APPRAISER',
      DISPOSAL_PENDING: 'FINANCE'
    };
    orders = orders.filter(o => o.last_abnormal && statusMap[o.current_status] === role);
  }

  return json(orders);
}
