import { json } from '@sveltejs/kit';
import { getTechnicians } from '$lib/data/store';

export function GET() {
  return json(getTechnicians());
}
