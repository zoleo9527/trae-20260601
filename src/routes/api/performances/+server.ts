import { performances } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = performances;
export const POST: RequestHandler = performances;
