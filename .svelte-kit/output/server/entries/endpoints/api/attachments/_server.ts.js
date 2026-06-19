import { e as error, j as json } from "../../../../chunks/index.js";
import { g as getAttachmentsByRecord, a as getAllAttachments, c as createAttachment } from "../../../../chunks/attachments.js";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const table = url.searchParams.get("table");
  const recordId = url.searchParams.get("recordId");
  const attachments = table && recordId ? getAttachmentsByRecord(table, parseInt(recordId)) : getAllAttachments();
  return json({ attachments });
};
const POST = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const body = await request.json();
  const id = createAttachment({ ...body, uploaded_by: locals.user.id });
  return json({ id }, { status: 201 });
};
export {
  GET,
  POST
};
