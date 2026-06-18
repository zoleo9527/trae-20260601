import { json } from '@sveltejs/kit';
import { getAllUsers } from '$server/database';

export async function GET() {
  const users = getAllUsers();
  return json(users);
}
