import { json } from '@sveltejs/kit';
import { getBookings } from '$lib/data/store';

export function GET() {
  return json(getBookings());
}
