import { d as defineEventHandler, g as getRouterParam, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { b as mockRefundRequests, c as mockRescheduleRequests, d as mockComplaints } from '../../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const update_post = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { type, action, comment, newStatus, newHandler, stuckPoint, stuckReason } = body;
  let item = null;
  if (type === "refund") {
    item = mockRefundRequests.find((r) => r.id === id);
  } else if (type === "reschedule") {
    item = mockRescheduleRequests.find((r) => r.id === id);
  } else if (type === "complaint") {
    item = mockComplaints.find((c) => c.id === id);
  }
  if (!item) {
    throw createError({
      statusCode: 404,
      message: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
  }
  const logEntry = {
    id: `log${Date.now()}`,
    type: action,
    action: getActionText(action, newStatus, newHandler),
    operator: "\u5F53\u524D\u7528\u6237",
    operatorRole: "ticket_manager",
    operatorDepartment: "\u7968\u52A1\u90E8",
    timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
    comment
  };
  item.processingLogs.push(logEntry);
  item.updatedAt = logEntry.timestamp;
  if (newStatus) {
    item.status = newStatus;
  }
  if (newHandler) {
    item.currentHandler = newHandler.role;
    item.currentHandlerName = newHandler.name;
    item.handlerDepartment = newHandler.department;
  }
  if (stuckPoint !== void 0) {
    item.stuckPoint = stuckPoint;
    item.stuckReason = stuckReason;
  }
  return {
    code: 200,
    message: "\u4EFB\u52A1\u66F4\u65B0\u6210\u529F",
    data: item
  };
});
function getActionText(action, newStatus, newHandler) {
  switch (action) {
    case "process":
      return newStatus ? `\u5904\u7406\u4E2D,\u72B6\u6001\u66F4\u65B0\u4E3A${newStatus}` : "\u5F00\u59CB\u5904\u7406";
    case "assign":
      return newHandler ? `\u5206\u914D\u7ED9${newHandler.name}(${newHandler.department})` : "\u4EFB\u52A1\u5206\u914D";
    case "stuck":
      return "\u4EFB\u52A1\u5361\u70B9";
    case "resolve":
      return "\u95EE\u9898\u5DF2\u89E3\u51B3";
    case "close":
      return "\u4EFB\u52A1\u5DF2\u5173\u95ED";
    default:
      return action;
  }
}

export { update_post as default };
//# sourceMappingURL=update.post.mjs.map
