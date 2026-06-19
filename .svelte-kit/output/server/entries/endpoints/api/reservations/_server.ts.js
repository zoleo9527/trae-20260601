import { e as error, j as json } from "../../../../chunks/index.js";
import { g as getReservationsByDate, a as getAllReservations, c as checkDuplicateReservation, b as createReservation } from "../../../../chunks/reservations.js";
import { c as createLog } from "../../../../chunks/operation_logs.js";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const date = url.searchParams.get("date");
  const reservations = date ? getReservationsByDate(date) : getAllReservations();
  return json({ reservations });
};
const POST = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const body = await request.json();
  if (checkDuplicateReservation(body.date, body.table_number, body.time_slot)) {
    return error(409, { message: "该台号在该时段已被预订" });
  }
  const id = createReservation({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: "reservations",
    record_id: id,
    operation: "create",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `预订台${body.table_number}: ${body.customer_name}`
  });
  return json({ id }, { status: 201 });
};
export {
  GET,
  POST
};
