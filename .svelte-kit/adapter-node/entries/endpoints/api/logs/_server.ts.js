import { e as error, j as json } from "../../../../chunks/index.js";
import { g as getLogsByRecord, a as getLogsByTable, b as getAllLogs } from "../../../../chunks/operation_logs.js";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return error(401, { message: "未登录" });
  }
  const table = url.searchParams.get("table");
  const recordId = url.searchParams.get("recordId");
  let logs;
  if (table && recordId) {
    logs = getLogsByRecord(table, parseInt(recordId));
  } else if (table) {
    logs = getLogsByTable(table);
  } else {
    logs = getAllLogs();
  }
  return json({ logs });
};
export {
  GET
};
