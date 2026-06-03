import { json } from '@sveltejs/kit';
import { getUsers } from '$lib/models';

export function GET() {
	const users = getUsers();
	return json(users);
}
