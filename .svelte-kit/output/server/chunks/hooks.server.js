import { i as initDatabase } from "./init.js";
initDatabase();
const handle = async ({ event, resolve }) => {
  const sessionCookie = event.request.headers.get("cookie");
  if (sessionCookie) {
    const match = sessionCookie.match(/user=([^;]+)/);
    if (match) {
      try {
        const decoded = Buffer.from(match[1], "base64").toString();
        const [id, username, role] = decoded.split("|");
        event.locals.user = { id: parseInt(id), username, role };
      } catch {
        event.locals.user = null;
      }
    }
  }
  return resolve(event);
};
export {
  handle
};
