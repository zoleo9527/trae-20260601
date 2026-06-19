import { e as error, j as json } from "../../../../chunks/index.js";
import { g as getAllGuests, c as createGuest } from "../../../../chunks/guests.js";
import { c as createLog } from "../../../../chunks/operation_logs.js";
const GET = async ({ locals }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const guests = getAllGuests();
  return json({ guests });
};
const POST = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const body = await request.json();
  const id = createGuest({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: "guests",
    record_id: id,
    operation: "create",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `新增嘉宾: ${body.name}`
  });
  return json({ id }, { status: 201 });
};
export {
  GET,
  POST
};
