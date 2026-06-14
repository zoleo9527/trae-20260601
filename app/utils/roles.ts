export type Role = "registrar" | "coach" | "safety_officer";

export const roleNames: Record<Role, string> = {
  registrar: "报名员",
  coach: "场地教练",
  safety_officer: "安全员",
};

export const statusNames: Record<string, string> = {
  enrolled: "已报名",
  training: "训练中",
  training_done: "待发放护具",
  gear_issued: "已发护具",
  completed: "已完成",
  pending: "待处理",
  in_progress: "进行中",
  cancelled: "已取消",
  issued: "已发放",
  returned: "已归还",
};

export const rolePermissions: Record<Role, string[]> = {
  registrar: ["view_students", "add_student", "view_training", "view_gear"],
  coach: ["view_students", "manage_training", "view_gear"],
  safety_officer: ["view_students", "manage_gear", "view_training"],
};

export const studentStatusColors: Record<string, { bg: string; text: string }> = {
  enrolled: { bg: "#f8f9fa", text: "#6c757d" },
  training: { bg: "#d1ecf1", text: "#0c5460" },
  training_done: { bg: "#fff3cd", text: "#856404" },
  gear_issued: { bg: "#e7f3ff", text: "#1976d2" },
  completed: { bg: "#d4edda", text: "#155724" },
};
