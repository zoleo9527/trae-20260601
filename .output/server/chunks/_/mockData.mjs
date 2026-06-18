const mockRefundRequests = [
  {
    id: "r1",
    ticketId: "t1",
    ticketNo: "TK20240618001",
    touristName: "\u5F20\u4E09",
    touristPhone: "13800138001",
    refundReason: "\u5BB6\u4E2D\u6709\u6025\u4E8B,\u65E0\u6CD5\u6309\u8BA1\u5212\u51FA\u884C",
    refundAmount: 150,
    status: "processing",
    currentHandler: "ticket_manager",
    currentHandlerName: "\u5F20\u660E",
    handlerDepartment: "\u7968\u52A1\u90E8",
    stuckPoint: "\u8D22\u52A1\u5BA1\u6279",
    stuckReason: "\u7B49\u5F85\u8D22\u52A1\u4E3B\u7BA1\u738B\u603B\u5BA1\u6279\u9000\u6B3E\u91D1\u989D",
    createdAt: "2024-06-18 09:15:00",
    updatedAt: "2024-06-18 14:30:00",
    processingLogs: [
      {
        id: "log1",
        type: "create",
        action: "\u63D0\u4EA4\u9000\u7968\u7533\u8BF7",
        operator: "\u5F20\u4E09",
        operatorRole: "customer_service",
        operatorDepartment: "\u5BA2\u670D\u90E8",
        timestamp: "2024-06-18 09:15:00"
      },
      {
        id: "log2",
        type: "assign",
        action: "\u5206\u914D\u7ED9\u7968\u52A1\u4E3B\u7BA1\u5BA1\u6838",
        operator: "\u738B\u82B3",
        operatorRole: "customer_service",
        operatorDepartment: "\u5BA2\u670D\u90E8",
        timestamp: "2024-06-18 09:20:00"
      },
      {
        id: "log3",
        type: "process",
        action: "\u5BA1\u6838\u901A\u8FC7,\u63D0\u4EA4\u8D22\u52A1\u5BA1\u6279",
        operator: "\u5F20\u660E",
        operatorRole: "ticket_manager",
        operatorDepartment: "\u7968\u52A1\u90E8",
        timestamp: "2024-06-18 14:30:00",
        comment: "\u6838\u5B9E\u6E38\u5BA2\u4FE1\u606F\u65E0\u8BEF,\u9000\u7968\u7533\u8BF7\u7B26\u5408\u653F\u7B56"
      }
    ]
  },
  {
    id: "r2",
    ticketId: "t2",
    ticketNo: "TK20240618002",
    touristName: "\u674E\u56DB",
    touristPhone: "13900139002",
    refundReason: "\u4E34\u65F6\u51FA\u5DEE,\u65F6\u95F4\u51B2\u7A81",
    refundAmount: 280,
    status: "pending",
    currentHandler: "customer_service",
    currentHandlerName: "\u738B\u82B3",
    handlerDepartment: "\u5BA2\u670D\u90E8",
    stuckPoint: null,
    stuckReason: null,
    createdAt: "2024-06-18 16:45:00",
    updatedAt: "2024-06-18 16:45:00",
    processingLogs: []
  }
];
const mockRescheduleRequests = [
  {
    id: "rs1",
    ticketId: "t1",
    ticketNo: "TK20240618001",
    touristName: "\u5F20\u4E09",
    touristPhone: "13800138001",
    originalDate: "2024-06-20",
    newDate: "2024-06-25",
    rescheduleReason: "\u56E0\u5929\u6C14\u539F\u56E0\u60F3\u8C03\u6574\u51FA\u884C\u65E5\u671F",
    status: "approved",
    currentHandler: "ticket_manager",
    currentHandlerName: "\u5F20\u660E",
    handlerDepartment: "\u7968\u52A1\u90E8",
    stuckPoint: null,
    stuckReason: null,
    createdAt: "2024-06-17 11:00:00",
    updatedAt: "2024-06-17 15:30:00",
    processingLogs: []
  }
];
const mockComplaints = [
  {
    id: "c1",
    complaintNo: "CT20240618001",
    title: "\u68C0\u7968\u95F8\u673A\u6545\u969C\u5BFC\u81F4\u65E0\u6CD5\u5165\u56ED",
    description: "2024\u5E746\u670818\u65E5\u4E0A\u534810\u70B9,\u6E38\u5BA2\u53CD\u6620\u5728\u5317\u95E8\u68C0\u7968\u65F6\u95F8\u673A\u6545\u969C,\u5BFC\u81F4\u6392\u961F\u7B49\u5F85\u8D85\u8FC730\u5206\u949F,\u4E25\u91CD\u5F71\u54CD\u6E38\u73A9\u4F53\u9A8C\u3002",
    source: "onsite",
    level: "high",
    status: "processing",
    relatedTicketId: "t1",
    relatedTicketNo: "TK20240618001",
    touristName: "\u5F20\u4E09",
    touristPhone: "13800138001",
    assignedTo: "gate_staff",
    assignedToName: "\u674E\u534E",
    currentHandler: "gate_staff",
    currentHandlerName: "\u674E\u534E",
    handlerDepartment: "\u68C0\u7968\u90E8",
    stuckPoint: "\u8BBE\u5907\u7EF4\u4FEE",
    stuckReason: "\u7B49\u5F85\u5DE5\u7A0B\u90E8\u7EF4\u4FEE\u4EBA\u5458\u5230\u573A\u5904\u7406,\u9884\u8BA1\u4E0B\u53482\u70B9\u5230\u8FBE",
    createdAt: "2024-06-18 10:30:00",
    updatedAt: "2024-06-18 11:15:00",
    processingLogs: [
      {
        id: "clog1",
        type: "create",
        action: "\u73B0\u573A\u63D0\u4EA4\u6295\u8BC9",
        operator: "\u5F20\u4E09",
        operatorRole: "customer_service",
        operatorDepartment: "\u5BA2\u670D\u90E8",
        timestamp: "2024-06-18 10:30:00"
      },
      {
        id: "clog2",
        type: "assign",
        action: "\u5206\u914D\u7ED9\u68C0\u7968\u90E8\u5904\u7406",
        operator: "\u738B\u82B3",
        operatorRole: "customer_service",
        operatorDepartment: "\u5BA2\u670D\u90E8",
        timestamp: "2024-06-18 10:35:00"
      },
      {
        id: "clog3",
        type: "process",
        action: "\u6838\u5B9E\u60C5\u51B5,\u786E\u8BA4\u95F8\u673A\u6545\u969C",
        operator: "\u674E\u534E",
        operatorRole: "gate_staff",
        operatorDepartment: "\u68C0\u7968\u90E8",
        timestamp: "2024-06-18 11:15:00",
        comment: "\u5DF2\u8054\u7CFB\u5DE5\u7A0B\u90E8,\u6B63\u5728\u7B49\u5F85\u7EF4\u4FEE\u4EBA\u5458\u5230\u573A"
      }
    ]
  },
  {
    id: "c2",
    complaintNo: "CT20240618002",
    title: "\u9000\u7968\u9000\u6B3E\u6D41\u7A0B\u8FC7\u6162",
    description: "\u6E38\u5BA2\u53CD\u6620\u63D0\u4EA4\u7684\u9000\u7968\u7533\u8BF7\u5DF2\u8D85\u8FC73\u4E2A\u5DE5\u4F5C\u65E5,\u4F46\u4ECD\u672A\u6536\u5230\u9000\u6B3E,\u591A\u6B21\u8054\u7CFB\u5BA2\u670D\u65E0\u679C\u3002",
    source: "phone",
    level: "urgent",
    status: "processing",
    relatedTicketId: "t1",
    relatedTicketNo: "TK20240618001",
    touristName: "\u5F20\u4E09",
    touristPhone: "13800138002",
    assignedTo: "ticket_manager",
    assignedToName: "\u5F20\u660E",
    currentHandler: "ticket_manager",
    currentHandlerName: "\u5F20\u660E",
    handlerDepartment: "\u7968\u52A1\u90E8",
    stuckPoint: "\u8D22\u52A1\u5BA1\u6279",
    stuckReason: "\u8D22\u52A1\u4E3B\u7BA1\u738B\u603B\u51FA\u5DEE,\u9700\u8981\u7B49\u52306\u670820\u65E5\u624D\u80FD\u5B8C\u6210\u5BA1\u6279",
    createdAt: "2024-06-15 14:20:00",
    updatedAt: "2024-06-18 09:00:00",
    processingLogs: []
  },
  {
    id: "c3",
    complaintNo: "CT20240618003",
    title: "VIP\u670D\u52A1\u672A\u4EAB\u53D7",
    description: "\u6E38\u5BA2\u8D2D\u4E70VIP\u7968\u540E,\u5728\u666F\u533A\u5185\u672A\u80FD\u4EAB\u53D7\u627F\u8BFA\u7684\u9910\u996E\u670D\u52A1,\u5DE5\u4F5C\u4EBA\u5458\u6001\u5EA6\u6076\u52A3\u3002",
    source: "online",
    level: "medium",
    status: "assigned",
    assignedTo: "customer_service",
    assignedToName: "\u738B\u82B3",
    currentHandler: "customer_service",
    currentHandlerName: "\u738B\u82B3",
    handlerDepartment: "\u5BA2\u670D\u90E8",
    stuckPoint: null,
    stuckReason: null,
    createdAt: "2024-06-18 15:00:00",
    updatedAt: "2024-06-18 15:10:00",
    processingLogs: []
  }
];
const mockExceptionRecords = [
  {
    id: "e1",
    type: "complaint",
    relatedId: "c1",
    relatedNo: "CT20240618001",
    exceptionType: "\u8BBE\u5907\u6545\u969C",
    description: "\u5317\u95E8\u95F8\u673A2\u53F7\u673A\u6545\u969C,\u5F71\u54CD\u6E38\u5BA2\u5165\u56ED",
    status: "handling",
    priority: "high",
    createdAt: "2024-06-18 10:30:00",
    createdBy: "\u674E\u534E"
  }
];
const mockDashboardStats = {
  pendingRefunds: 5,
  pendingReschedules: 3,
  pendingComplaints: 8,
  todayProcessed: 12,
  stuckTasks: 2,
  urgentComplaints: 1
};
function getTaskTrackerInfo(type, item) {
  const taskTrackerInfo = {
    taskId: item.id,
    taskNo: "ticketNo" in item ? item.ticketNo : "complaintNo" in item ? item.complaintNo : "",
    taskType: type,
    title: type === "complaint" && "title" in item ? item.title : type === "refund" ? `\u9000\u7968\u7533\u8BF7-${item.ticketNo}` : `\u6539\u671F\u7533\u8BF7-${item.ticketNo}`,
    currentHandler: item.currentHandler,
    currentHandlerName: item.currentHandlerName,
    handlerDepartment: item.handlerDepartment,
    status: item.status,
    stuckPoint: item.stuckPoint,
    stuckReason: item.stuckReason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    processingProgress: item.processingLogs.map((log) => ({
      stage: log.action,
      handler: log.operator,
      handlerRole: log.operatorRole,
      handlerDepartment: log.operatorDepartment,
      status: log.type === "process" ? "completed" : log.type === "stuck" ? "stuck" : "pending",
      startTime: log.timestamp,
      comment: log.comment
    }))
  };
  return taskTrackerInfo;
}

export { mockDashboardStats as a, mockRefundRequests as b, mockRescheduleRequests as c, mockComplaints as d, getTaskTrackerInfo as g, mockExceptionRecords as m };
//# sourceMappingURL=mockData.mjs.map
