import { json } from '@sveltejs/kit';
import { getTodos } from '$lib/data/store';

export function GET({ url }: { url: URL }) {
  const role = url.searchParams.get('role') || 'admin';
  return json(getTodos(role));
}
