import { login } from '$server/api';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = login;
