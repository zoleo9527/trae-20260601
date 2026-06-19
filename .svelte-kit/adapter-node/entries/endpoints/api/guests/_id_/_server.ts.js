import { e as error, j as json } from "../../../../../chunks/index.js";
import { a as getGuestById, u as updateGuest, d as deleteGuest } from "../../../../../chunks/guests.js";
import { c as createLog } from "../../../../../chunks/operation_logs.js";
const GET = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const guest = getGuestById(id);
  if (!guest) {
    return error(404, { message: "嘉宾不存在" });
  }
  return json({ guest });
};
const PUT = async ({ locals, params, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const oldGuest = getGuestById(id);
  if (!oldGuest) {
    return error(404, { message: "嘉宾不存在" });
  }
  updateGuest(id, body, locals.user.id);
  if (body.name !== void 0 && body.name !== oldGuest.name) {
    createLog({
      table_name: "guests",
      record_id: id,
      operation: "update",
      field_name: "name",
      old_value: oldGuest.name,
      new_value: body.name,
      operator_id: locals.user.id,
      operator_name: locals.user.username
    });
  }
  if (body.status !== void 0 && body.status !== oldGuest.status) {
    createLog({
      table_name: "guests",
      record_id: id,
      operation: "update",
      field_name: "status",
      old_value: oldGuest.status,
      new_value: body.status,
      operator_id: locals.user.id,
      operator_name: locals.user.username
    });
  }
  return json({ success: true });
};
const DELETE = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  deleteGuest(id);
  createLog({
    table_name: "guests",
    record_id: id,
    operation: "delete",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: "删除嘉宾"
  });
  return json({ success: true });
};
export {
  DELETE,
  GET,
  PUT
};
