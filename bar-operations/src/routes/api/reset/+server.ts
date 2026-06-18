import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db, { resetDatabase } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { confirm } = data;

    if (!confirm) {
      return json({ error: 'Confirmation required' }, { status: 400 });
    }

    resetDatabase();

    return json({ success: true, message: 'Database has been reset successfully' });
  } catch (error) {
    console.error('Failed to reset database:', error);
    return json({ error: 'Failed to reset database' }, { status: 500 });
  }
};
