import { e as error, j as json } from "../../../../../chunks/index.js";
import { b as getPerformanceById, u as updatePerformance, d as deletePerformance } from "../../../../../chunks/performances.js";
import { c as createLog } from "../../../../../chunks/operation_logs.js";
const GET = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const performance = getPerformanceById(id);
  if (!performance) {
    return error(404, { message: "演出不存在" });
  }
  return json({ performance });
};
const PUT = async ({ locals, params, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const oldPerformance = getPerformanceById(id);
  if (!oldPerformance) {
    return error(404, { message: "演出不存在" });
  }
  updatePerformance(id, body, locals.user.id);
  if (body.date !== void 0 && body.date !== oldPerformance.date) {
    createLog({
      table_name: "performances",
      record_id: id,
      operation: "update",
      field_name: "date",
      old_value: oldPerformance.date,
      new_value: body.date,
      operator_id: locals.user.id,
      operator_name: locals.user.username,
      notes: body.notes || "改期"
    });
  }
  if (body.status !== void 0 && body.status !== oldPerformance.status) {
    createLog({
      table_name: "performances",
      record_id: id,
      operation: "update",
      field_name: "status",
      old_value: oldPerformance.status,
      new_value: body.status,
      operator_id: locals.user.id,
      operator_name: locals.user.username,
      notes: body.notes
    });
  }
  return json({ success: true });
};
const DELETE = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  deletePerformance(id);
  createLog({
    table_name: "performances",
    record_id: id,
    operation: "delete",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: "删除演出"
  });
  return json({ success: true });
};
export {
  DELETE,
  GET,
  PUT
};
