import { json } from '@sveltejs/kit';
import { createAttachment } from '$lib/services.js';

export async function POST({ request }) {
  const body = await request.json();
  const result = createAttachment(body);
  return json({ success: true, attachment: result });
}
