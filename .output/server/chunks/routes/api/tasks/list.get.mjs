import { d as defineEventHandler, a as getQuery } from '../../../nitro/nitro.mjs';
import { b as mockRefundRequests, c as mockRescheduleRequests, d as mockComplaints } from '../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const list_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { type, status, handler } = query;
  let results = [];
  if (type === "refund") {
    results = mockRefundRequests;
  } else if (type === "reschedule") {
    results = mockRescheduleRequests;
  } else if (type === "complaint") {
    results = mockComplaints;
  } else {
    results = [
      ...mockRefundRequests,
      ...mockRescheduleRequests,
      ...mockComplaints
    ];
  }
  if (status) {
    results = results.filter((item) => item.status === status);
  }
  if (handler) {
    results = results.filter((item) => item.currentHandler === handler);
  }
  return {
    code: 200,
    message: "success",
    data: results
  };
});

export { list_get as default };
//# sourceMappingURL=list.get.mjs.map
