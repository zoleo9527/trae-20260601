import { json } from '@sveltejs/kit';
import { getAllOrders, getOrdersByStatus, getDashboardStats } from '$lib/services.js';

export async function GET({ url }) {
  const status = url.searchParams.get('status');
  const stats = url.searchParams.get('stats');

  if (stats) {
    return json(getDashboardStats());
  }

  if (status) {
    const statuses = status.split(',');
    return json(getOrdersByStatus(statuses));
  }

  return json(getAllOrders());
}
