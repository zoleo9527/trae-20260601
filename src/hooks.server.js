import { authenticateUser } from '$lib/server/auth.js';
import { getUserById } from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
  const session = event.cookies.get('session');
  
  if (session) {
    try {
      const user = getUserById(session);
      if (user) {
        event.locals.user = user;
      }
    } catch (e) {
      console.error('Session validation error:', e);
    }
  }

  return resolve(event);
}
