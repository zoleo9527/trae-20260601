import { json, type RequestEvent } from '@sveltejs/kit';
import { batchCheckIn, batchCheckOut, batchCleanComplete } from '$server/database';

export async function POST({ request }: RequestEvent) {
  const { action, roomIds, operator } = await request.json();
  
  switch (action) {
    case 'checkin':
      batchCheckIn(roomIds, operator);
      break;
    case 'checkout':
      batchCheckOut(roomIds, operator);
      break;
    case 'cleanComplete':
      batchCleanComplete(roomIds, operator);
      break;
  }
  
  return json({ success: true });
}
