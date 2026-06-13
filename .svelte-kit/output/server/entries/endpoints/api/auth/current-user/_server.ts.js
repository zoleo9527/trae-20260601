import { json } from "@sveltejs/kit";
import { d as db } from "../../../../../chunks/db.js";
const GET = async ({ cookies }) => {
  const sessionCookie = cookies.get("session");
  if (!sessionCookie) {
    return json({ user: null }, { status: 401 });
  }
  try {
    const session = JSON.parse(sessionCookie);
    const user = db.prepare("SELECT id, username, role, name, email FROM users WHERE id = ?").get(session.userId);
    if (!user) {
      return json({ user: null }, { status: 401 });
    }
    return json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });
  } catch {
    return json({ user: null }, { status: 401 });
  }
};
export {
  GET
};
