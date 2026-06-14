import { d as defineEventHandler, g as getQuery, r as readBody } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const prizeRecords = [
  {
    id: "P001",
    ticketNumber: "20241201001",
    prizeAmount: 5e4,
    prizeType: "\u4E00\u7B49\u5956",
    storeName: "\u671D\u9633\u533A\u671B\u4EAC\u5E97",
    storeCode: "BJ-WJ-001",
    status: "pending",
    currentHandler: "\u5E97\u5458",
    currentHandlerName: "\u5F20\u4E09",
    createdAt: "2024-12-01 09:15:30",
    lastUpdatedAt: "2024-12-01 09:15:30",
    statusChanges: [
      { status: "pending", operator: "\u5F20\u4E09", operatorRole: "\u5E97\u5458", time: "2024-12-01 09:15:30", remark: "\u987E\u5BA2\u6301\u5F69\u7968\u5230\u5E97\u7533\u8BF7\u5151\u5956" }
    ],
    customerName: "\u674E\u56DB",
    customerId: "110101199001011234",
    materialsStatus: "uploading",
    materials: [
      { type: "\u8EAB\u4EFD\u8BC1\u6B63\u9762", uploaded: true, uploadedBy: "\u5F20\u4E09", uploadedAt: "2024-12-01 09:18:00" },
      { type: "\u8EAB\u4EFD\u8BC1\u53CD\u9762", uploaded: true, uploadedBy: "\u5F20\u4E09", uploadedAt: "2024-12-01 09:19:00" },
      { type: "\u5F69\u7968\u539F\u4EF6", uploaded: false, uploadedBy: "", uploadedAt: "" },
      { type: "\u5151\u5956\u7533\u8BF7\u8868", uploaded: false, uploadedBy: "", uploadedAt: "" }
    ],
    remark: "\u987E\u5BA2\u8868\u793A\u6025\u9700\u7528\u94B1\uFF0C\u5E0C\u671B\u5C3D\u5FEB\u5904\u7406"
  },
  {
    id: "P002",
    ticketNumber: "20241201002",
    prizeAmount: 1e4,
    prizeType: "\u4E8C\u7B49\u5956",
    storeName: "\u6D77\u6DC0\u533A\u4E2D\u5173\u6751\u5E97",
    storeCode: "BJ-ZG-002",
    status: "processing",
    currentHandler: "\u5E97\u957F",
    currentHandlerName: "\u738B\u4E94",
    createdAt: "2024-12-01 10:20:00",
    lastUpdatedAt: "2024-12-01 14:30:00",
    statusChanges: [
      { status: "pending", operator: "\u8D75\u516D", operatorRole: "\u5E97\u5458", time: "2024-12-01 10:20:00", remark: "\u987E\u5BA2\u5230\u5E97\u5151\u5956" },
      { status: "processing", operator: "\u738B\u4E94", operatorRole: "\u5E97\u957F", time: "2024-12-01 14:30:00", remark: "\u5DF2\u5BA1\u6838\u5F69\u7968\u4FE1\u606F\uFF0C\u8FDB\u5165\u5904\u7406\u6D41\u7A0B" }
    ],
    customerName: "\u94B1\u4E03",
    customerId: "110102198505156789",
    materialsStatus: "pending",
    materials: [
      { type: "\u8EAB\u4EFD\u8BC1\u6B63\u9762", uploaded: true, uploadedBy: "\u8D75\u516D", uploadedAt: "2024-12-01 10:25:00" },
      { type: "\u8EAB\u4EFD\u8BC1\u53CD\u9762", uploaded: true, uploadedBy: "\u8D75\u516D", uploadedAt: "2024-12-01 10:26:00" },
      { type: "\u5F69\u7968\u539F\u4EF6", uploaded: true, uploadedBy: "\u8D75\u516D", uploadedAt: "2024-12-01 10:27:00" },
      { type: "\u5151\u5956\u7533\u8BF7\u8868", uploaded: true, uploadedBy: "\u8D75\u516D", uploadedAt: "2024-12-01 10:28:00" }
    ],
    remark: ""
  },
  {
    id: "P003",
    ticketNumber: "20241202001",
    prizeAmount: 5e5,
    prizeType: "\u4E00\u7B49\u5956",
    storeName: "\u897F\u57CE\u533A\u897F\u5355\u5E97",
    storeCode: "BJ-XD-003",
    status: "exception",
    currentHandler: "\u7247\u533A\u7BA1\u7406\u5458",
    currentHandlerName: "\u5B59\u516B",
    createdAt: "2024-12-02 11:00:00",
    lastUpdatedAt: "2024-12-02 15:45:00",
    statusChanges: [
      { status: "pending", operator: "\u5468\u4E5D", operatorRole: "\u5E97\u5458", time: "2024-12-02 11:00:00", remark: "\u5927\u989D\u5151\u5956\u7533\u8BF7" },
      { status: "processing", operator: "\u5434\u5341", operatorRole: "\u5E97\u957F", time: "2024-12-02 11:30:00", remark: "\u5DF2\u521D\u5BA1\uFF0C\u4E0A\u62A5\u7247\u533A\u7BA1\u7406\u5458" },
      { status: "exception", operator: "\u5B59\u516B", operatorRole: "\u7247\u533A\u7BA1\u7406\u5458", time: "2024-12-02 15:45:00", remark: "\u5F69\u7968\u4FE1\u606F\u4E0E\u7CFB\u7EDF\u4E0D\u7B26\uFF0C\u9700\u8FDB\u4E00\u6B65\u6838\u5B9E" }
    ],
    customerName: "\u90D1\u5341\u4E00",
    customerId: "110103197808201122",
    materialsStatus: "exception",
    materials: [
      { type: "\u8EAB\u4EFD\u8BC1\u6B63\u9762", uploaded: true, uploadedBy: "\u5468\u4E5D", uploadedAt: "2024-12-02 11:05:00" },
      { type: "\u8EAB\u4EFD\u8BC1\u53CD\u9762", uploaded: true, uploadedBy: "\u5468\u4E5D", uploadedAt: "2024-12-02 11:06:00" },
      { type: "\u5F69\u7968\u539F\u4EF6", uploaded: true, uploadedBy: "\u5468\u4E5D", uploadedAt: "2024-12-02 11:07:00" },
      { type: "\u5151\u5956\u7533\u8BF7\u8868", uploaded: true, uploadedBy: "\u5468\u4E5D", uploadedAt: "2024-12-02 11:08:00" }
    ],
    remark: "\u5F69\u7968\u5E8F\u5217\u53F7\u5B58\u5728\u7591\u95EE\uFF0C\u9700\u8054\u7CFB\u7701\u4E2D\u5FC3\u6838\u5B9E"
  },
  {
    id: "P004",
    ticketNumber: "20241202002",
    prizeAmount: 5e3,
    prizeType: "\u4E09\u7B49\u5956",
    storeName: "\u4E1C\u57CE\u533A\u738B\u5E9C\u4E95\u5E97",
    storeCode: "BJ-WF-004",
    status: "completed",
    currentHandler: "\u5E97\u5458",
    currentHandlerName: "\u90D1\u5341\u4E8C",
    createdAt: "2024-12-02 08:30:00",
    lastUpdatedAt: "2024-12-02 09:15:00",
    statusChanges: [
      { status: "pending", operator: "\u90D1\u5341\u4E8C", operatorRole: "\u5E97\u5458", time: "2024-12-02 08:30:00", remark: "\u987E\u5BA2\u5230\u5E97\u5151\u5956" },
      { status: "processing", operator: "\u90D1\u5341\u4E8C", operatorRole: "\u5E97\u5458", time: "2024-12-02 08:45:00", remark: "\u5BA1\u6838\u901A\u8FC7\uFF0C\u51C6\u5907\u6253\u6B3E" },
      { status: "completed", operator: "\u90D1\u5341\u4E8C", operatorRole: "\u5E97\u5458", time: "2024-12-02 09:15:00", remark: "\u5151\u5956\u5B8C\u6210\uFF0C\u5956\u91D1\u5DF2\u53D1\u653E" }
    ],
    customerName: "\u738B\u5341\u4E09",
    customerId: "110104199512123456",
    materialsStatus: "completed",
    materials: [
      { type: "\u8EAB\u4EFD\u8BC1\u6B63\u9762", uploaded: true, uploadedBy: "\u90D1\u5341\u4E8C", uploadedAt: "2024-12-02 08:35:00" },
      { type: "\u8EAB\u4EFD\u8BC1\u53CD\u9762", uploaded: true, uploadedBy: "\u90D1\u5341\u4E8C", uploadedAt: "2024-12-02 08:36:00" },
      { type: "\u5F69\u7968\u539F\u4EF6", uploaded: true, uploadedBy: "\u90D1\u5341\u4E8C", uploadedAt: "2024-12-02 08:37:00" },
      { type: "\u5151\u5956\u7533\u8BF7\u8868", uploaded: true, uploadedBy: "\u90D1\u5341\u4E8C", uploadedAt: "2024-12-02 08:38:00" }
    ],
    remark: ""
  },
  {
    id: "P005",
    ticketNumber: "20241203001",
    prizeAmount: 2e4,
    prizeType: "\u4E8C\u7B49\u5956",
    storeName: "\u671D\u9633\u533A\u671B\u4EAC\u5E97",
    storeCode: "BJ-WJ-001",
    status: "pending",
    currentHandler: "\u5E97\u5458",
    currentHandlerName: "\u5F20\u4E09",
    createdAt: "2024-12-03 14:20:00",
    lastUpdatedAt: "2024-12-03 14:20:00",
    statusChanges: [
      { status: "pending", operator: "\u5F20\u4E09", operatorRole: "\u5E97\u5458", time: "2024-12-03 14:20:00", remark: "\u987E\u5BA2\u6301\u5F69\u7968\u5230\u5E97\u7533\u8BF7\u5151\u5956" }
    ],
    customerName: "\u5218\u5341\u56DB",
    customerId: "110105199203156789",
    materialsStatus: "uploading",
    materials: [
      { type: "\u8EAB\u4EFD\u8BC1\u6B63\u9762", uploaded: true, uploadedBy: "\u5F20\u4E09", uploadedAt: "2024-12-03 14:25:00" },
      { type: "\u8EAB\u4EFD\u8BC1\u53CD\u9762", uploaded: false, uploadedBy: "", uploadedAt: "" },
      { type: "\u5F69\u7968\u539F\u4EF6", uploaded: false, uploadedBy: "", uploadedAt: "" },
      { type: "\u5151\u5956\u7533\u8BF7\u8868", uploaded: false, uploadedBy: "", uploadedAt: "" }
    ],
    remark: "\u987E\u5BA2\u8EAB\u4EFD\u8BC1\u7167\u7247\u6A21\u7CCA\uFF0C\u9700\u8981\u91CD\u65B0\u4E0A\u4F20"
  }
];
const prize = defineEventHandler(async (event) => {
  const { method } = event.node.req;
  if (method === "GET") {
    const query = getQuery(event);
    let records = [...prizeRecords];
    if (query.status) {
      records = records.filter((r) => r.status === query.status);
    }
    if (query.storeCode) {
      records = records.filter((r) => r.storeCode === query.storeCode);
    }
    if (query.handler) {
      records = records.filter((r) => r.currentHandler === query.handler);
    }
    return { success: true, data: records };
  }
  if (method === "PUT") {
    const body = await readBody(event);
    const { id, status, operator, operatorRole, remark } = body;
    const recordIndex = prizeRecords.findIndex((r) => r.id === id);
    if (recordIndex === -1) {
      return { success: false, message: "\u8BB0\u5F55\u4E0D\u5B58\u5728" };
    }
    const now = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).replace(/\//g, "-");
    prizeRecords[recordIndex].status = status;
    prizeRecords[recordIndex].currentHandler = operatorRole;
    prizeRecords[recordIndex].currentHandlerName = operator;
    prizeRecords[recordIndex].lastUpdatedAt = now;
    prizeRecords[recordIndex].statusChanges.push({
      status,
      operator,
      operatorRole,
      time: now,
      remark
    });
    return { success: true, data: prizeRecords[recordIndex] };
  }
  if (method === "POST") {
    const body = await readBody(event);
    const { ticketNumber, prizeAmount, prizeType, storeName, storeCode, customerName, customerId } = body;
    const now = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).replace(/\//g, "-");
    const newRecord = {
      id: `P${String(prizeRecords.length + 1).padStart(3, "0")}`,
      ticketNumber,
      prizeAmount: Number(prizeAmount),
      prizeType,
      storeName,
      storeCode,
      status: "pending",
      currentHandler: "\u5E97\u5458",
      currentHandlerName: body.operator || "\u7CFB\u7EDF",
      createdAt: now,
      lastUpdatedAt: now,
      statusChanges: [
        { status: "pending", operator: body.operator || "\u7CFB\u7EDF", operatorRole: "\u5E97\u5458", time: now, remark: "\u65B0\u5EFA\u5151\u5956\u7533\u8BF7" }
      ],
      customerName,
      customerId,
      materialsStatus: "uploading",
      materials: [
        { type: "\u8EAB\u4EFD\u8BC1\u6B63\u9762", uploaded: false, uploadedBy: "", uploadedAt: "" },
        { type: "\u8EAB\u4EFD\u8BC1\u53CD\u9762", uploaded: false, uploadedBy: "", uploadedAt: "" },
        { type: "\u5F69\u7968\u539F\u4EF6", uploaded: false, uploadedBy: "", uploadedAt: "" },
        { type: "\u5151\u5956\u7533\u8BF7\u8868", uploaded: false, uploadedBy: "", uploadedAt: "" }
      ],
      remark: ""
    };
    prizeRecords.push(newRecord);
    return { success: true, data: newRecord };
  }
  return { success: false, message: "\u4E0D\u652F\u6301\u7684\u65B9\u6CD5" };
});

export { prize as default };
//# sourceMappingURL=prize.mjs.map
