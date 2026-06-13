import { json } from "@sveltejs/kit";
import { d as db } from "../../../../../chunks/db.js";
import bcrypt from "bcryptjs";
const POST = async ({ request, cookies }) => {
  const { username, password } = await request.json();
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return json({ success: false, error: "用户名或密码错误" }, { status: 401 });
  }
  const sessionData = JSON.stringify({ userId: user.id, role: user.role });
  cookies.set("session", sessionData, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: false
  });
  return json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email
    }
  });
};
export {
  POST
};
