import { json, error } from '@sveltejs/kit';
import { addDrinkOrder, updateDrinkOrderStatus } from '$lib/data/store';
import type { DrinkOrderItem, DrinkOrderStatus } from '$lib/types';

export async function POST({ params, request }: { params: { id: string }; request: Request }) {
  const body = await request.json();
  const { items, notes } = body;
  
  const booking = addDrinkOrder(params.id, items as DrinkOrderItem[], notes);
  if (!booking) {
    throw error(404, '预订不存在');
  }
  
  return json(booking);
}

export async function PATCH({ params, request }: { params: { id: string }; request: Request }) {
  const body = await request.json();
  const { orderId, status } = body;
  
  const booking = updateDrinkOrderStatus(params.id, orderId, status as DrinkOrderStatus);
  if (!booking) {
    throw error(404, '预订不存在');
  }
  
  return json(booking);
}
