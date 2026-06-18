import { json, type RequestEvent } from '@sveltejs/kit';
import { getAllInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, updateInventoryStock } from '$server/database';

export async function GET() {
  const inventory = getAllInventory();
  return json(inventory);
}

export async function POST({ request }: RequestEvent) {
  const { name, quantity, min_stock, unit } = await request.json();
  addInventoryItem(name, quantity, min_stock, unit);
  return json({ success: true });
}

export async function PUT({ request }: RequestEvent) {
  const { id, name, quantity, min_stock, unit, delta } = await request.json();
  if (delta !== undefined) {
    updateInventoryStock(id, delta);
  } else {
    updateInventoryItem(id, name, quantity, min_stock, unit);
  }
  return json({ success: true });
}

export async function DELETE({ url }: RequestEvent) {
  const id = url.searchParams.get('id');
  if (id) {
    deleteInventoryItem(parseInt(id));
  }
  return json({ success: true });
}
