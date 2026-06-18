import { json, type RequestEvent } from '@sveltejs/kit';
import { getAllRooms, getRoomById, addRoom, updateRoomStatus, deleteRoom } from '$server/database';

export async function GET({ url }: RequestEvent) {
  const id = url.searchParams.get('id');
  if (id) {
    const room = getRoomById(parseInt(id));
    return json(room || {});
  }
  const rooms = getAllRooms();
  return json(rooms);
}

export async function POST({ request }: RequestEvent) {
  const { name, type, price, capacity } = await request.json();
  addRoom(name, type, price, capacity);
  return json({ success: true });
}

export async function PUT({ request }: RequestEvent) {
  const { id, status } = await request.json();
  updateRoomStatus(id, status);
  return json({ success: true });
}

export async function DELETE({ url }: RequestEvent) {
  const id = url.searchParams.get('id');
  if (id) {
    deleteRoom(parseInt(id));
  }
  return json({ success: true });
}