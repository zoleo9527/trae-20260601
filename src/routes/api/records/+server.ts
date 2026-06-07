import { json } from '@sveltejs/kit';
import { getRecords } from '$lib/data/store';

export function GET() {
  return json(getRecords());
}
