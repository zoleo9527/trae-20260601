import { reservationById } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = reservationById;
export const PUT: RequestHandler = reservationById;
export const DELETE: RequestHandler = reservationById;
