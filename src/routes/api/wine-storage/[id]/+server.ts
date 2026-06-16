import { wineStorageById } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = wineStorageById;
export const PUT: RequestHandler = wineStorageById;
export const DELETE: RequestHandler = wineStorageById;
