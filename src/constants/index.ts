import type { CostumeStatus, StatusMeta, UserRole, RoleMeta, SizeConfirmStatus } from "@/types";

export const STATUS_META: Record<CostumeStatus, StatusMeta> = {
  created: {
    label: "已创建",
    description: "教务已发起服装需求",
    assigneeRole: "teacher",
    order: 1,
  },
  roster_pending: {
    label: "待确认名单",
    description: "等待舞蹈老师确认参演学生名单",
    assigneeRole: "teacher",
    order: 2,
  },
  roster_confirmed: {
    label: "名单已确认",
    description: "舞蹈老师已确认学生名单",
    assigneeRole: "admin",
    order: 3,
  },
  sizing_pending: {
    label: "待录入尺码",
    description: "等待教务录入学生尺码信息",
    assigneeRole: "admin",
    order: 4,
  },
  sizing_entered: {
    label: "尺码已录入",
    description: "教务已录入尺码",
    assigneeRole: "teacher",
    order: 5,
  },
  size_confirm_pending: {
    label: "待确认尺码",
    description: "等待舞蹈老师逐一确认尺码",
    assigneeRole: "teacher",
    order: 6,
  },
  size_confirmed: {
    label: "尺码已确认",
    description: "舞蹈老师已确认全部尺码",
    assigneeRole: "principal",
    order: 7,
  },
  approval_pending: {
    label: "待审批",
    description: "等待校长审批服装预算",
    assigneeRole: "principal",
    order: 8,
  },
  approved: {
    label: "已审批",
    description: "校长已审批通过",
    assigneeRole: "admin",
    order: 9,
  },
  ordering: {
    label: "订购中",
    description: "教务已下单，等待供应商发货",
    assigneeRole: "admin",
    order: 10,
  },
  received: {
    label: "已到货",
    description: "服装已到货并验收",
    assigneeRole: "admin",
    order: 11,
  },
  distributed: {
    label: "已发放",
    description: "服装已发放给学生，等待演出后回收",
    assigneeRole: "admin",
    order: 12,
  },
  archived: {
    label: "已归档",
    description: "演出结束，服装已回收归档",
    assigneeRole: "admin",
    order: 13,
  },
};

export const ROLE_META: Record<UserRole, RoleMeta> = {
  admin: {
    label: "教务",
    color: "text-wine-700 bg-wine-50 border-wine-200",
    avatarColor: "bg-wine-600 text-white",
  },
  teacher: {
    label: "舞蹈老师",
    color: "text-forest-700 bg-forest-50 border-forest-200",
    avatarColor: "bg-forest-600 text-white",
  },
  principal: {
    label: "校长",
    color: "text-gold-800 bg-gold-50 border-gold-300",
    avatarColor: "bg-gold-600 text-white",
  },
};

export const SIZE_CONFIRM_META: Record<SizeConfirmStatus, { label: string; color: string }> = {
  pending: {
    label: "待确认",
    color: "text-ink-500 bg-ink-50 border-ink-200",
  },
  confirmed: {
    label: "已确认",
    color: "text-forest-700 bg-forest-50 border-forest-200",
  },
  exception: {
    label: "异常",
    color: "text-ochre-700 bg-ochre-50 border-ochre-300",
  },
};

export const STATUS_FLOW: CostumeStatus[] = [
  "created",
  "roster_pending",
  "roster_confirmed",
  "sizing_pending",
  "sizing_entered",
  "size_confirm_pending",
  "size_confirmed",
  "approval_pending",
  "approved",
  "ordering",
  "received",
  "distributed",
  "archived",
];

export const USERS: Record<UserRole, { name: string; role: UserRole }[]> = {
  admin: [
    { name: "李教务", role: "admin" },
    { name: "王助理", role: "admin" },
  ],
  teacher: [
    { name: "陈老师", role: "teacher" },
    { name: "刘老师", role: "teacher" },
    { name: "张老师", role: "teacher" },
  ],
  principal: [{ name: "赵校长", role: "principal" }],
};

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

export const STATUS_TIMEOUT_DAYS: Record<CostumeStatus, number> = {
  created: 1,
  roster_pending: 2,
  roster_confirmed: 1,
  sizing_pending: 3,
  sizing_entered: 1,
  size_confirm_pending: 3,
  size_confirmed: 1,
  approval_pending: 3,
  approved: 1,
  ordering: 15,
  received: 3,
  distributed: 30,
  archived: 999,
};

export const STUCK_PRESET_FILTERS = [
  {
    key: "stuck_sizing",
    label: "尺码录入超3天",
    matchStatus: ["sizing_pending"] as CostumeStatus[],
    minDays: 3,
  },
  {
    key: "stuck_confirm",
    label: "尺码确认超3天",
    matchStatus: ["size_confirm_pending"] as CostumeStatus[],
    minDays: 3,
  },
  {
    key: "stuck_approval",
    label: "审批超3天",
    matchStatus: ["approval_pending"] as CostumeStatus[],
    minDays: 3,
  },
  {
    key: "stuck_any",
    label: "任意节点超时",
    matchStatus: null,
    minDays: -1,
  },
];
