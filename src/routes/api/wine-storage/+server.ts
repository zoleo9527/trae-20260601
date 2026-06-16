import { wineStorage } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = wineStorage;
export const POST: RequestHandler = wineStorage;
