import { reservations } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = reservations;
export const POST: RequestHandler = reservations;
