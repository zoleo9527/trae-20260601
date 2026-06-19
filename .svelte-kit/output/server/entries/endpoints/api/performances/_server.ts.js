import { e as error, j as json } from "../../../../chunks/index.js";
import { g as getPerformancesByDate, a as getAllPerformances, c as createPerformance } from "../../../../chunks/performances.js";
import { c as createLog } from "../../../../chunks/operation_logs.js";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const date = url.searchParams.get("date");
  const performances = date ? getPerformancesByDate(date) : getAllPerformances();
  return json({ performances });
};
const POST = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const body = await request.json();
  const id = createPerformance({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: "performances",
    record_id: id,
    operation: "create",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `安排演出: 嘉宾${body.guest_id}`
  });
  return json({ id }, { status: 201 });
};
export {
  GET,
  POST
};
