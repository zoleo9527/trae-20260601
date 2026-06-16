import { getCurrentUser, logout } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = getCurrentUser;
export const POST: RequestHandler = logout;
