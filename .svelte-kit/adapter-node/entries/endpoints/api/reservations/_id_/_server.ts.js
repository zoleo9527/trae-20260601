import { e as error, j as json } from "../../../../../chunks/index.js";
import { d as getReservationById, c as checkDuplicateReservation, u as updateReservation, e as deleteReservation } from "../../../../../chunks/reservations.js";
import { c as createLog } from "../../../../../chunks/operation_logs.js";
const GET = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const reservation = getReservationById(id);
  if (!reservation) {
    return error(404, { message: "订台不存在" });
  }
  return json({ reservation });
};
const PUT = async ({ locals, params, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const oldReservation = getReservationById(id);
  if (!oldReservation) {
    return error(404, { message: "订台不存在" });
  }
  if (body.table_number !== void 0 && body.date !== void 0 && body.time_slot !== void 0) {
    if (checkDuplicateReservation(body.date, body.table_number, body.time_slot, id)) {
      return error(409, { message: "该台号在该时段已被预订" });
    }
  }
  updateReservation(id, body, locals.user.id);
  if (body.status !== void 0 && body.status !== oldReservation.status) {
    createLog({
      table_name: "reservations",
      record_id: id,
      operation: "update",
      field_name: "status",
      old_value: oldReservation.status,
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
  deleteReservation(id);
  createLog({
    table_name: "reservations",
    record_id: id,
    operation: "delete",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: "删除订台"
  });
  return json({ success: true });
};
export {
  DELETE,
  GET,
  PUT
};
