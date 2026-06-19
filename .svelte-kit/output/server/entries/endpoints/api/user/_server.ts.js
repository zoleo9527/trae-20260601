import { e as error, j as json } from "../../../../chunks/index.js";
const GET = async ({ locals }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  return json({ user: locals.user });
};
const POST = async ({ cookies }) => {
  cookies.delete("user", { path: "/" });
  return json({ message: "已退出" });
};
export {
  GET,
  POST
};
