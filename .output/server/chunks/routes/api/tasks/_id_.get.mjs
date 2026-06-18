import { d as defineEventHandler, g as getRouterParam, a as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { b as mockRefundRequests, g as getTaskTrackerInfo, c as mockRescheduleRequests, d as mockComplaints, m as mockExceptionRecords } from '../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const type = getQuery(event).type;
  let item = null;
  let trackerInfo = null;
  if (type === "refund") {
    item = mockRefundRequests.find((r) => r.id === id);
    if (item) {
      trackerInfo = getTaskTrackerInfo("refund", item);
    }
  } else if (type === "reschedule") {
    item = mockRescheduleRequests.find((r) => r.id === id);
    if (item) {
      trackerInfo = getTaskTrackerInfo("reschedule", item);
    }
  } else if (type === "complaint") {
    item = mockComplaints.find((c) => c.id === id);
    if (item) {
      trackerInfo = getTaskTrackerInfo("complaint", item);
    }
  }
  if (!item) {
    throw createError({
      statusCode: 404,
      message: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
  }
  const relatedException = mockExceptionRecords.find(
    (e) => e.relatedId === id || e.relatedNo === item.ticketNo || e.relatedNo === item.complaintNo
  );
  return {
    code: 200,
    message: "success",
    data: {
      task: item,
      tracker: trackerInfo,
      relatedException
    }
  };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
