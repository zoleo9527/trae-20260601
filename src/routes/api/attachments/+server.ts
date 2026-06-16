import { attachments } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = attachments;
export const POST: RequestHandler = attachments;
