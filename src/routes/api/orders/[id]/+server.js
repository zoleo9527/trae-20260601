import { json, error } from '@sveltejs/kit';
import { getOrderById, getTransitionsByOrderId, getNotificationsByOrderId, getAttachmentsByOrderId, getTimelineForOrder } from '$lib/services.js';

export async function GET({ params }) {
  const id = parseInt(params.id);
  const order = getOrderById(id);
  if (!order) throw error(404, '典当单不存在');

  return json({
    order,
    transitions: getTransitionsByOrderId(id),
    notifications: getNotificationsByOrderId(id),
    attachments: getAttachmentsByOrderId(id),
    timeline: getTimelineForOrder(id)
  });
}
