import { initDatabase } from '$lib/server/db/init';

let initialized = false;

export async function handle({ event, resolve }) {
	if (!initialized) {
		await initDatabase();
		initialized = true;
	}

	const response = await resolve(event);
	return response;
}
