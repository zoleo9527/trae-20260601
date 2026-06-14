export type Role = "registrar" | "coach" | "safety_officer";

export const roleNames: Record<Role, string> = {
  registrar: "报名员",
  coach: "场地教练",
  safety_officer: "安全员",
};

export const statusNames: Record<string, string> = {
  enrolled: "已报名",
  training: "训练中",
  gear_issued: "已发护具",
  completed: "已完成",
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
  issued: "已发放",
  returned: "已归还",
};

export const rolePermissions: Record<Role, string[]> = {
  registrar: ["view_students", "add_student", "view_training", "view_gear"],
  coach: ["view_students", "manage_training", "view_gear"],
  safety_officer: ["view_students", "manage_gear", "view_training"],
};
