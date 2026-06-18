import { json, type RequestEvent } from '@sveltejs/kit';
import { getAllOrders, addOrder, updateOrderStatus, createOrderWithInventory } from '$server/database';

export async function GET() {
  const orders = getAllOrders();
  return json(orders);
}

export async function POST({ request }: RequestEvent) {
  const { table_no, dishes, deduct_stock } = await request.json();
  
  if (deduct_stock) {
    const result = createOrderWithInventory(table_no, dishes);
    return json(result);
  } else {
    addOrder(table_no, dishes);
    return json({ success: true, message: '下单成功' });
  }
}

export async function PUT({ request }: RequestEvent) {
  const { id, status } = await request.json();
  updateOrderStatus(id, status);
  return json({ success: true });
}
