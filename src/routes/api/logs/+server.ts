import { logs } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = logs;
