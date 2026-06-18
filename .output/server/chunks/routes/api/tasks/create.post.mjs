import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { b as mockRefundRequests, c as mockRescheduleRequests, d as mockComplaints } from '../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const create_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { type, ticketId, ticketNo, touristName, touristPhone, reason, newDate } = body;
  let newItem = null;
  if (type === "refund") {
    const refundItem = {
      id: `r${Date.now()}`,
      ticketId,
      ticketNo,
      touristName,
      touristPhone,
      refundReason: reason,
      refundAmount: 150,
      status: "pending",
      currentHandler: "customer_service",
      currentHandlerName: "\u738B\u82B3",
      handlerDepartment: "\u5BA2\u670D\u90E8",
      stuckPoint: null,
      stuckReason: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      processingLogs: []
    };
    mockRefundRequests.push(refundItem);
    newItem = refundItem;
  } else if (type === "reschedule") {
    const rescheduleItem = {
      id: `rs${Date.now()}`,
      ticketId,
      ticketNo,
      touristName,
      touristPhone,
      originalDate: "2024-06-20",
      newDate,
      rescheduleReason: reason,
      status: "pending",
      currentHandler: "customer_service",
      currentHandlerName: "\u738B\u82B3",
      handlerDepartment: "\u5BA2\u670D\u90E8",
      stuckPoint: null,
      stuckReason: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      processingLogs: []
    };
    mockRescheduleRequests.push(rescheduleItem);
    newItem = rescheduleItem;
  } else if (type === "complaint") {
    const complaintItem = {
      id: `c${Date.now()}`,
      complaintNo: generateComplaintNo(),
      title: reason,
      description: reason,
      source: "onsite",
      level: "medium",
      status: "submitted",
      relatedTicketId: ticketId,
      relatedTicketNo: ticketNo,
      touristName,
      touristPhone,
      assignedTo: null,
      assignedToName: null,
      currentHandler: "customer_service",
      currentHandlerName: "\u738B\u82B3",
      handlerDepartment: "\u5BA2\u670D\u90E8",
      stuckPoint: null,
      stuckReason: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      processingLogs: []
    };
    mockComplaints.push(complaintItem);
    newItem = complaintItem;
  }
  if (!newItem) {
    throw createError({
      statusCode: 400,
      message: "\u65E0\u6548\u7684\u4EFB\u52A1\u7C7B\u578B"
    });
  }
  return {
    code: 200,
    message: "\u4EFB\u52A1\u521B\u5EFA\u6210\u529F",
    data: newItem
  };
});
function generateComplaintNo() {
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 1e3).toString().padStart(3, "0");
  return `CT${date}${random}`;
}

export { create_post as default };
//# sourceMappingURL=create.post.mjs.map
