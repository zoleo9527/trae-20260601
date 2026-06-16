import { performanceById } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = performanceById;
export const PUT: RequestHandler = performanceById;
export const DELETE: RequestHandler = performanceById;
