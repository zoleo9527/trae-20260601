import { d as defineEventHandler, g as getRouterParam, a as getQuery, c as createError } from '../../../../nitro/nitro.mjs';
import { b as mockRefundRequests, c as mockRescheduleRequests, d as mockComplaints } from '../../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const context_get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const type = getQuery(event).type;
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
  const relatedTicketRules = [
    {
      ticketType: item.type || "adult",
      refundPolicy: "\u6E38\u73A9\u65E5\u524D1\u5929\u53EF\u5168\u989D\u9000\u6B3E,\u5F53\u5929\u4E0D\u53EF\u9000\u6B3E",
      reschedulePolicy: "\u6E38\u73A9\u65E5\u524D\u53EF\u514D\u8D39\u6539\u671F1\u6B21",
      validDays: 1
    }
  ];
  const relatedTickets = [
    {
      id: item.ticketId || "t1",
      ticketNo: item.ticketNo || "TK20240618001",
      type: "adult",
      price: item.refundAmount || 150,
      purchaseTime: "2024-06-15 10:30:00",
      validFrom: "2024-06-20 08:00:00",
      validUntil: "2024-06-20 18:00:00",
      status: "valid"
    }
  ];
  return {
    code: 200,
    message: "success",
    data: {
      task: item,
      ticketRules: relatedTicketRules,
      tickets: relatedTickets
    }
  };
});

export { context_get as default };
//# sourceMappingURL=context.get.mjs.map
