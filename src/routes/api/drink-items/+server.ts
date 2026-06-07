import { json } from '@sveltejs/kit';
import { getDrinkItems } from '$lib/data/store';

export function GET() {
  return json(getDrinkItems());
}
