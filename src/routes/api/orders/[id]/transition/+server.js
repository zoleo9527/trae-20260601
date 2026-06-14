import { json, error } from '@sveltejs/kit';
import { executeTransition, getAvailableActions } from '$lib/services.js';

export async function POST({ params, request }) {
  const orderId = parseInt(params.id);
  const body = await request.json();
  const { action, role, roleName, notes, abnormalTrigger } = body;

  try {
    const result = executeTransition(orderId, action, role, roleName, notes, abnormalTrigger);
    return json({ success: true, order: result });
  } catch (e) {
    throw error(400, e.message);
  }
}
