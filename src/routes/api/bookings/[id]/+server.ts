import { json, error } from '@sveltejs/kit';
import { getBookingById, confirmBooking, rejectBooking, requestSupplement, completeSupplement, checkInBooking, markArrived, completeBooking, updateBooking } from '$lib/data/store';
import type { UserRole } from '$lib/types';

export function GET({ params }: { params: { id: string } }) {
  const booking = getBookingById(params.id);
  if (!booking) {
    throw error(404, '预订不存在');
  }
  return json(booking);
}

export async function PATCH({ params, request }: { params: { id: string }; request: Request }) {
  const body = await request.json();
  const { action, operator, operatorRole, ...rest } = body;
  
  let booking;
  
  switch (action) {
    case 'confirm':
      booking = confirmBooking(params.id, operator, operatorRole as UserRole);
      break;
    case 'reject':
      booking = rejectBooking(params.id, rest.reason, rest.supplementaryNotes, operator, operatorRole as UserRole);
      break;
    case 'request_supplement':
      booking = requestSupplement(params.id, rest.supplementInfo, operator, operatorRole as UserRole);
      break;
    case 'complete_supplement':
      booking = completeSupplement(params.id, operator, operatorRole as UserRole);
      break;
    case 'checkin':
      booking = checkInBooking(params.id, operator, operatorRole as UserRole);
      break;
    case 'mark_arrived':
      booking = markArrived(params.id, operator, operatorRole as UserRole);
      break;
    case 'complete':
      booking = completeBooking(params.id, operator, operatorRole as UserRole);
      break;
    case 'update':
      booking = updateBooking(params.id, rest);
      break;
    default:
      throw error(400, '无效的操作');
  }
  
  if (!booking) {
    throw error(404, '预订不存在');
  }
  
  return json(booking);
}
