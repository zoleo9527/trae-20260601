import { e as error, j as json } from "../../../../chunks/index.js";
import { d as db } from "../../../../chunks/init.js";
function getUserByUsername(username) {
  return db.prepare(`
    SELECT * FROM users WHERE username = ?
  `).get(username);
}
function validateUser(username, password) {
  const user = getUserByUsername(username);
  if (user && user.password === password) {
    return user;
  }
  return void 0;
}
const POST = async ({ request, cookies }) => {
  const body = await request.json();
  const { username, password } = body;
  const user = validateUser(username, password);
  if (!user) {
    return error(401, { message: "用户名或密码错误" });
  }
  const session = Buffer.from(`${user.id}|${user.username}|${user.role}`).toString("base64");
  cookies.set("user", session, { path: "/", httpOnly: true });
  return json({ user: { id: user.id, username: user.username, role: user.role } });
};
export {
  POST
};
