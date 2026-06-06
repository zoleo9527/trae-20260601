import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearUserSession } from '$lib/utils/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	clearUserSession(cookies);
	throw redirect(303, '/login');
};

export const GET: RequestHandler = async ({ cookies }) => {
	clearUserSession(cookies);
	throw redirect(303, '/login');
};
