import { e as error, j as json } from "../../../../../chunks/index.js";
import { d as getWineStorageById, r as retrieveWine, u as updateWineStorage, e as deleteWineStorage } from "../../../../../chunks/wine_storage.js";
import { c as createLog } from "../../../../../chunks/operation_logs.js";
const GET = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const wine = getWineStorageById(id);
  if (!wine) {
    return error(404, { message: "寄存记录不存在" });
  }
  return json({ wine });
};
const PUT = async ({ locals, params, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  const body = await request.json();
  const oldWine = getWineStorageById(id);
  if (!oldWine) {
    return error(404, { message: "寄存记录不存在" });
  }
  if (body.action === "retrieve") {
    retrieveWine(id, locals.user.id, body.notes);
    createLog({
      table_name: "wine_storage",
      record_id: id,
      operation: "update",
      field_name: "status",
      old_value: oldWine.status,
      new_value: "retrieved",
      operator_id: locals.user.id,
      operator_name: locals.user.username,
      notes: body.notes || "取走酒水"
    });
  } else {
    updateWineStorage(id, body, locals.user.id);
    if (body.status !== void 0 && body.status !== oldWine.status) {
      createLog({
        table_name: "wine_storage",
        record_id: id,
        operation: "update",
        field_name: "status",
        old_value: oldWine.status,
        new_value: body.status,
        operator_id: locals.user.id,
        operator_name: locals.user.username
      });
    }
  }
  return json({ success: true });
};
const DELETE = async ({ locals, params }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const id = parseInt(params.id);
  deleteWineStorage(id);
  createLog({
    table_name: "wine_storage",
    record_id: id,
    operation: "delete",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: "删除寄存记录"
  });
  return json({ success: true });
};
export {
  DELETE,
  GET,
  PUT
};
