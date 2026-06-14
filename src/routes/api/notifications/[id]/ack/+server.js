import { json, error } from '@sveltejs/kit';
import { ackNotification } from '$lib/services.js';

export async function POST({ params, request }) {
  const id = parseInt(params.id);
  const body = await request.json();
  const { ackMethod, ackNotes } = body;
  try {
    const result = ackNotification(id, ackMethod, ackNotes);
    return json({ success: true, notification: result });
  } catch (e) {
    throw error(400, e.message);
  }
}
