import { json } from '@sveltejs/kit';
import { createNotification, ackNotification } from '$lib/services.js';

export async function POST({ request }) {
  const body = await request.json();
  const result = createNotification(body);
  return json({ success: true, notification: result });
}
