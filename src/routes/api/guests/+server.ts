import { guests } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = guests;
export const POST: RequestHandler = guests;
