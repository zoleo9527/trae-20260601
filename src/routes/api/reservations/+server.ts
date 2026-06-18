import { json, type RequestEvent } from '@sveltejs/kit';
import { getAllReservations, getReservationById, addReservation, updateReservationStatus } from '$server/database';

export async function GET({ url }: RequestEvent) {
  const id = url.searchParams.get('id');
  if (id) {
    const reservation = getReservationById(parseInt(id));
    return json(reservation || {});
  }
  const reservations = getAllReservations();
  return json(reservations);
}

export async function POST({ request }: RequestEvent) {
  const { room_id, guest_name, phone, check_in, check_out, guests, deposit } = await request.json();
  addReservation(room_id, guest_name, phone, check_in, check_out, guests, deposit);
  return json({ success: true });
}

export async function PUT({ request }: RequestEvent) {
  const { id, status } = await request.json();
  updateReservationStatus(id, status);
  return json({ success: true });
}
