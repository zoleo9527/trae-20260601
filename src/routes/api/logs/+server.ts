import { json, type RequestEvent } from '@sveltejs/kit';
import { getAllLogs, addStatusLog } from '$server/database';

export async function GET() {
  const logs = getAllLogs();
  return json(logs);
}

export async function POST({ request }: RequestEvent) {
  const { room_id, status, changed_by, note } = await request.json();
  addStatusLog(room_id, status, changed_by, note);
  return json({ success: true });
}
