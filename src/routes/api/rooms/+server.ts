import { json } from '@sveltejs/kit';
import { getRooms } from '$lib/data/store';

export function GET() {
  return json(getRooms());
}
