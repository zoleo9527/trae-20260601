import { e as error, j as json } from "../../../../../chunks/index.js";
import { d as deleteAttachment } from "../../../../../chunks/attachments.js";
const DELETE = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  deleteAttachment(id);
  return json({ success: true });
};
export {
  DELETE
};
