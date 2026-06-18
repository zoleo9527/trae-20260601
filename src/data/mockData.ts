import type { Verification, Complaint, ActivityItem, TodoItem, RiskItem } from "@/types";

export const mockVerifications: Verification[] = [
  {
    id: "HX20260618001",
    platform: "美团",
    couponName: "4人超值火锅套餐",
    amount: 298,
    tableNo: "A12",
    peopleCount: 4,
    cashier: "张婷",
    verifyTime: "2026-06-18 12:15:00",
    status: "normal",
    complaintId: "TS20260618001",
  },
  {
    id: "HX20260618002",
    platform: "抖音",
    couponName: "双人午市特惠套餐",
    amount: 158,
    tableNo: "B05",
    peopleCount: 2,
    cashier: "张婷",
    verifyTime: "2026-06-18 12:22:00",
    status: "normal",
  },
  {
    id: "HX20260618003",
    platform: "大众点评",
    couponName: "6人欢聚豪华套餐",
    amount: 588,
    tableNo: "C08",
    peopleCount: 6,
    cashier: "李明",
    verifyTime: "2026-06-18 12:30:00",
    status: "abnormal",
    remark: "客户反映套餐内容与描述不符",
    complaintId: "TS20260618002",
  },
  {
    id: "HX20260618004",
    platform: "美团",
    couponName: "午市单人餐",
    amount: 68,
    tableNo: "D03",
    peopleCount: 1,
    cashier: "李明",
    verifyTime: "2026-06-18 13:05:00",
    status: "refunded",
    remark: "客户临时有事离店，全额退款",
  },
  {
    id: "HX20260617089",
    platform: "抖音",
    couponName: "家庭聚餐8人套餐",
    amount: 888,
    tableNo: "VIP01",
    peopleCount: 8,
    cashier: "张婷",
    verifyTime: "2026-06-17 19:20:00",
    status: "normal",
    complaintId: "TS20260617005",
  },
  {
    id: "HX20260617088",
    platform: "美团",
    couponName: "双人夜宵套餐",
    amount: 188,
    tableNo: "A03",
    peopleCount: 2,
    cashier: "王芳",
    verifyTime: "2026-06-17 22:10:00",
    status: "normal",
  },
  {
    id: "HX20260617087",
    platform: "大众点评",
    couponName: "工作日午市双人餐",
    amount: 128,
    tableNo: "B08",
    peopleCount: 2,
    cashier: "李明",
    verifyTime: "2026-06-17 12:45:00",
    status: "abnormal",
    remark: "券码已使用但系统无记录",
  },
  {
    id: "HX20260617086",
    platform: "美团",
    couponName: "学生特惠3人餐",
    amount: 198,
    tableNo: "A06",
    peopleCount: 3,
    cashier: "张婷",
    verifyTime: "2026-06-17 18:30:00",
    status: "normal",
  },
];

export const mockComplaints: Complaint[] = [
  {
    id: "TS20260618001",
    verificationId: "HX20260618001",
    source: "现场",
    content: "顾客反映毛肚不新鲜，有异味，已用餐15分钟发现。",
    severity: "serious",
    responsibleParty: "kitchen",
    handler: "后厨主管-赵刚",
    status: "processing",
    createTime: "2026-06-18 12:40:00",
    deadline: "2026-06-18 15:40:00",
    kitchenNote: "已检查库存，确认该批次毛肚确实有问题，已通知供应商，更换全部库存。",
    visitLogs: [],
  },
  {
    id: "TS20260618002",
    verificationId: "HX20260618003",
    source: "现场",
    content: "套餐内标注的澳洲肥牛实际为普通肥牛，客户要求退款并赔偿。",
    severity: "urgent",
    responsibleParty: "both",
    handler: "前厅经理-陈静",
    status: "pending",
    createTime: "2026-06-18 12:55:00",
    deadline: "2026-06-18 13:25:00",
    visitLogs: [],
  },
  {
    id: "TS20260617005",
    verificationId: "HX20260617089",
    source: "电话",
    content: "客户离店后致电反映小孩吃了虾滑后拉肚子，要求查明原因。",
    severity: "urgent",
    responsibleParty: "kitchen",
    handler: "后厨主管-赵刚",
    status: "to_visit",
    createTime: "2026-06-17 22:30:00",
    deadline: "2026-06-18 10:00:00",
    kitchenNote: "已留样送检，虾滑为当日现制，同批次无其他投诉。",
    visitLogs: [
      {
        id: "HF001",
        complaintId: "TS20260617005",
        visitor: "陈静",
        visitTime: "2026-06-18 09:30:00",
        method: "phone",
        result: "已解释留样检测情况，同意等待检测结果，承诺次日再次回访。",
        feedback: "客户情绪较平稳，理解我们的处理流程。",
        satisfaction: 3,
      },
    ],
  },
  {
    id: "TS20260617004",
    verificationId: "HX20260617088",
    source: "平台",
    content: "客户在美团差评：上菜速度太慢，等了40分钟才上锅底。",
    severity: "normal",
    responsibleParty: "front",
    handler: "前厅经理-陈静",
    status: "completed",
    createTime: "2026-06-17 23:00:00",
    visitLogs: [
      {
        id: "HF002",
        complaintId: "TS20260617004",
        visitor: "陈静",
        visitTime: "2026-06-18 10:00:00",
        method: "phone",
        result: "致歉并赠送50元代金券，客户同意修改评价。",
        feedback: "客户对代金券方案满意，表示愿意再来。",
        satisfaction: 4,
      },
    ],
  },
  {
    id: "TS20260617003",
    verificationId: "HX20260617087",
    source: "电话",
    content: "客户反映核销异常，团购券显示已使用但未消费。",
    severity: "normal",
    responsibleParty: "front",
    handler: "收银主管-李明",
    status: "escalated",
    createTime: "2026-06-17 14:00:00",
    visitLogs: [
      {
        id: "HF003",
        complaintId: "TS20260617003",
        visitor: "李明",
        visitTime: "2026-06-17 15:00:00",
        method: "phone",
        result: "联系平台客服处理中，平台反馈需要3个工作日核实。",
        feedback: "客户表示不满意处理时长。",
        satisfaction: 2,
      },
    ],
  },
];

export const mockActivities: ActivityItem[] = [
  {
    id: "ACT001",
    actor: "张婷",
    role: "cashier",
    action: "核销了团购券",
    target: "HX20260618004",
    time: "5分钟前",
  },
  {
    id: "ACT002",
    actor: "陈静",
    role: "floor_manager",
    action: "发起了客诉",
    target: "TS20260618002",
    time: "10分钟前",
  },
  {
    id: "ACT003",
    actor: "赵刚",
    role: "kitchen_lead",
    action: "录入了处理结果",
    target: "TS20260618001",
    time: "20分钟前",
  },
  {
    id: "ACT004",
    actor: "李明",
    role: "cashier",
    action: "标记了异常核销",
    target: "HX20260618003",
    time: "35分钟前",
  },
  {
    id: "ACT005",
    actor: "陈静",
    role: "floor_manager",
    action: "完成了回访",
    target: "TS20260617004",
    time: "1小时前",
  },
  {
    id: "ACT006",
    actor: "张婷",
    role: "cashier",
    action: "核销了团购券",
    target: "HX20260618002",
    time: "1小时前",
  },
  {
    id: "ACT007",
    actor: "赵刚",
    role: "kitchen_lead",
    action: "更新了菜品状态",
    target: "C08桌 6人套餐",
    time: "2小时前",
  },
];

export function parseTime(timeStr: string): Date {
  return new Date(timeStr.replace(/-/g, "/"));
}

export function calculateTimeLeft(deadline: string): string {
  const now = new Date();
  const deadlineDate = parseTime(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 0) {
    const overdueMins = Math.abs(diffMins);
    if (overdueMins >= 60) {
      const hours = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      return mins > 0 ? `超时 ${hours}小时${mins}分钟` : `超时 ${hours}小时`;
    }
    return `超时 ${overdueMins}分钟`;
  } else {
    if (diffMins >= 60) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `剩余 ${hours}小时${mins}分钟` : `剩余 ${hours}小时`;
    }
    return `剩余 ${diffMins}分钟`;
  }
}

function getSeverityPriority(severity: string): "high" | "medium" | "low" {
  switch (severity) {
    case "urgent":
      return "high";
    case "serious":
      return "medium";
    case "normal":
    default:
      return "low";
  }
}

function truncateDescription(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function getTodoTime(deadline?: string): string {
  if (!deadline) return "待处理";
  return calculateTimeLeft(deadline);
}

export function getRoleTodos(
  role: string,
  verifications: Verification[],
  complaints: Complaint[]
): TodoItem[] {
  const todos: TodoItem[] = [];
  let todoIndex = 0;

  switch (role) {
    case "cashier": {
      const abnormalVerifications = verifications.filter(
        (v) => v.status === "abnormal"
      );
      abnormalVerifications.forEach((v) => {
        todos.push({
          id: `TD${++todoIndex}`,
          type: "verification",
          title: `处理异常核销 ${v.id}`,
          description: v.remark
            ? v.remark + "，请尽快核实"
            : "券码异常，需核实原因并处理",
          priority: "high",
          time: getTodoTime(),
          relatedId: v.id,
        });
      });

      const refundedVerifications = verifications.filter(
        (v) => v.status === "refunded"
      );
      refundedVerifications.forEach((v) => {
        todos.push({
          id: `TD${++todoIndex}`,
          type: "verification",
          title: `确认退款 ${v.id}`,
          description: v.remark
            ? v.remark + "，待确认"
            : "退款申请待确认，需核对金额与券码",
          priority: "medium",
          time: getTodoTime(),
          relatedId: v.id,
        });
      });

      const frontComplaints = complaints.filter(
        (c) => c.responsibleParty === "front" && c.status !== "completed"
      );
      frontComplaints.forEach((c) => {
        let title = "";
        let description = "";
        switch (c.status) {
          case "pending":
            title = `协助受理客诉 ${c.id}`;
            description = "客户提出投诉，请协助前厅处理";
            break;
          case "processing":
            title = `协助跟进客诉 ${c.id}`;
            description = "客诉处理中，请配合前厅工作";
            break;
          case "to_visit":
            title = `协助回访客诉 ${c.id}`;
            description = "客诉已处理，需配合前厅完成回访";
            break;
          case "escalated":
            title = `协助处理升级客诉 ${c.id}`;
            description = "客诉已升级，需收银侧配合提供数据";
            break;
          default:
            title = `协助处理客诉 ${c.id}`;
            description = truncateDescription(c.content);
        }
        todos.push({
          id: `TD${++todoIndex}`,
          type: "complaint",
          title,
          description,
          priority: getSeverityPriority(c.severity),
          time: getTodoTime(c.deadline),
          relatedId: c.id,
          complaintStatus: c.status,
        });
      });
      break;
    }

    case "kitchen_lead": {
      const kitchenComplaints = complaints.filter(
        (c) =>
          (c.responsibleParty === "kitchen" ||
            c.responsibleParty === "both") &&
          (c.status === "pending" || c.status === "processing")
      );
      kitchenComplaints.forEach((c) => {
        let priority = getSeverityPriority(c.severity);
        let title = `处理客诉 ${c.id}`;
        let description = "";

        if (c.status === "pending") {
          description = "前厅转来客诉，请尽快核实原因";
        } else if (c.status === "processing") {
          if (c.kitchenNote) {
            priority = "medium";
            title = `等待回访 ${c.id}`;
            description = "已提交处理说明，等待前厅回访客户";
          } else {
            description = "客诉处理中，请尽快给出解决方案";
          }
        }

        todos.push({
          id: `TD${++todoIndex}`,
          type: "complaint",
          title,
          description,
          priority,
          time: getTodoTime(c.deadline),
          relatedId: c.id,
          complaintStatus: c.status,
        });
      });
      break;
    }

    case "floor_manager":
    default: {
      const pendingComplaints = complaints.filter(
        (c) => c.status === "pending"
      );
      pendingComplaints.forEach((c) => {
        todos.push({
          id: `TD${++todoIndex}`,
          type: "complaint",
          title: `受理客诉 ${c.id}`,
          description: "新客诉待受理，客户等待回应",
          priority: "high",
          time: getTodoTime(c.deadline),
          relatedId: c.id,
          complaintStatus: "pending",
        });
      });

      const toVisitComplaints = complaints.filter(
        (c) => c.status === "to_visit"
      );
      toVisitComplaints.forEach((c) => {
        todos.push({
          id: `TD${++todoIndex}`,
          type: "visit",
          title: `执行回访 ${c.id}`,
          description: "客诉已处理完成，安排回访确认满意度",
          priority: "high",
          time: getTodoTime(c.deadline),
          relatedId: c.id,
          complaintStatus: "to_visit",
        });
      });

      const escalatedComplaints = complaints.filter(
        (c) => c.status === "escalated"
      );
      escalatedComplaints.forEach((c) => {
        todos.push({
          id: `TD${++todoIndex}`,
          type: "complaint",
          title: `跟进升级客诉 ${c.id}`,
          description: "客诉已升级，需重点跟进并同步客户",
          priority: "high",
          time: getTodoTime(c.deadline),
          relatedId: c.id,
          complaintStatus: "escalated",
        });
      });

      const processingComplaints = complaints.filter(
        (c) => c.status === "processing"
      );
      processingComplaints.forEach((c) => {
        todos.push({
          id: `TD${++todoIndex}`,
          type: "complaint",
          title: `跟进处理中客诉 ${c.id}`,
          description: "后厨处理中，跟进进度并及时同步客户",
          priority: "medium",
          time: getTodoTime(c.deadline),
          relatedId: c.id,
          complaintStatus: "processing",
        });
      });
      break;
    }
  }

  return todos;
}

export function getRoleRisks(
  role: string,
  verifications: Verification[],
  complaints: Complaint[]
): RiskItem[] {
  const risks: RiskItem[] = [];
  let riskIndex = 0;
  const now = new Date();

  switch (role) {
    case "cashier": {
      verifications.forEach((v) => {
        if (v.status === "abnormal") {
          const verifyTime = parseTime(v.verifyTime);
          const hoursSince = (now.getTime() - verifyTime.getTime()) / (1000 * 60 * 60);
          if (hoursSince > 24) {
            risks.push({
              id: `RK${++riskIndex}`,
              title: "核销异常未处理",
              description: `${v.id} 券码异常已超过24小时未解决`,
              level: "danger",
              timeLeft: `已超时 ${Math.floor(hoursSince - 24)}小时`,
              relatedId: v.id,
              relatedType: "verification",
            });
          }
        }

        if (v.status === "refunded") {
          const verifyTime = parseTime(v.verifyTime);
          const hoursSince = (now.getTime() - verifyTime.getTime()) / (1000 * 60 * 60);
          if (hoursSince > 2) {
            risks.push({
              id: `RK${++riskIndex}`,
              title: "退款未确认",
              description: `${v.id} 退款核销超过2小时未确认`,
              level: "warning",
              timeLeft: `已超时 ${Math.floor(hoursSince - 2)}小时`,
              relatedId: v.id,
              relatedType: "verification",
            });
          }
        }
      });
      break;
    }

    case "kitchen_lead": {
      complaints.forEach((c) => {
        if (
          (c.responsibleParty === "kitchen" ||
            c.responsibleParty === "both") &&
          c.severity === "urgent" &&
          c.deadline
        ) {
          const deadlineDate = parseTime(c.deadline);
          const minsLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60);
          if (minsLeft > 0 && minsLeft < 30) {
            risks.push({
              id: `RK${++riskIndex}`,
              title: "紧急客诉即将超时",
              description: `${c.id} 紧急客诉临近处理时限`,
              level: "danger",
              timeLeft: `剩余 ${Math.ceil(minsLeft)}分钟`,
              relatedId: c.id,
              relatedType: "complaint",
            });
          }
        }
      });

      const contentKeywords: Record<string, string[]> = {
        "毛肚不新鲜": ["毛肚", "不新鲜", "异味"],
        "菜品不卫生": ["拉肚子", "不干净", "卫生"],
        "上菜慢": ["慢", "等了", "太久"],
      };

      Object.entries(contentKeywords).forEach(([issueType, keywords]) => {
        const matchingComplaints = complaints.filter((c) => {
          if (c.responsibleParty !== "kitchen" && c.responsibleParty !== "both") return false;
          const content = c.content;
          return keywords.some((kw) => content.includes(kw));
        });

        if (matchingComplaints.length >= 2) {
          const recentComplaints = matchingComplaints.filter((c) => {
            const createTime = parseTime(c.createTime);
            const hoursSince = (now.getTime() - createTime.getTime()) / (1000 * 60 * 60);
            return hoursSince < 24;
          });

          if (recentComplaints.length >= 2) {
            risks.push({
              id: `RK${++riskIndex}`,
              title: "供应商质量问题",
              description: `24小时内有 ${recentComplaints.length} 条${issueType}投诉，需关注供应商质量`,
              level: "warning",
              relatedId: recentComplaints[0].id,
              relatedType: "complaint",
            });
          }
        }
      });
      break;
    }

    case "floor_manager":
    default: {
      complaints.forEach((c) => {
        if (c.severity === "urgent" && c.status === "pending") {
          const createTime = parseTime(c.createTime);
          const minsSince = (now.getTime() - createTime.getTime()) / (1000 * 60);
          if (minsSince > 30) {
            risks.push({
              id: `RK${++riskIndex}`,
              title: "紧急客诉超时未受理",
              description: `${c.id} 紧急投诉超过30分钟未处理`,
              level: "danger",
              timeLeft: `已超时 ${Math.floor(minsSince - 30)}分钟`,
              relatedId: c.id,
              relatedType: "complaint",
            });
          }
        }

        if (c.status === "to_visit" && c.deadline) {
          const deadlineDate = parseTime(c.deadline);
          const minsLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60);
          if (minsLeft > 0 && minsLeft < 60) {
            risks.push({
              id: `RK${++riskIndex}`,
              title: "回访即将到期",
              description: `${c.id} 待回访客诉临近时限`,
              level: "warning",
              timeLeft: `剩余 ${Math.ceil(minsLeft)}分钟`,
              relatedId: c.id,
              relatedType: "complaint",
            });
          }
        }
      });
      break;
    }
  }

  return risks;
}
