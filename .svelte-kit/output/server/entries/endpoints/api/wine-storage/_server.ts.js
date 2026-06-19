import { e as error, j as json } from "../../../../chunks/index.js";
import { g as getStoredWines, a as getWineStorageByPhone, b as getAllWineStorage, c as createWineStorage } from "../../../../chunks/wine_storage.js";
import { c as createLog } from "../../../../chunks/operation_logs.js";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const phone = url.searchParams.get("phone");
  const storedOnly = url.searchParams.get("stored") === "true";
  const wines = storedOnly ? getStoredWines() : phone ? getWineStorageByPhone(phone) : getAllWineStorage();
  return json({ wines });
};
const POST = async ({ locals, request }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const body = await request.json();
  const id = createWineStorage({ ...body, created_by: locals.user.id, updated_by: locals.user.id });
  createLog({
    table_name: "wine_storage",
    record_id: id,
    operation: "create",
    operator_id: locals.user.id,
    operator_name: locals.user.username,
    notes: `寄存酒水: ${body.wine_name} (${body.customer_name})`
  });
  return json({ id }, { status: 201 });
};
export {
  GET,
  POST
};
