import { attachmentById } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = attachmentById;
