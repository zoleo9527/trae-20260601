import { guestById } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = guestById;
export const PUT: RequestHandler = guestById;
export const DELETE: RequestHandler = guestById;
