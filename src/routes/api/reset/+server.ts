import { json } from '@sveltejs/kit';
import { initSampleData } from '$server/database';

export async function POST() {
  initSampleData();
  return json({ success: true });
}
