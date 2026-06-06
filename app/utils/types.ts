export const STATUS_LABELS: Record<string, string> = {
  PENDING_INSPECTION: "待检查",
  INSPECTED: "已检查",
  NEEDS_RECTIFICATION: "需整改",
  RECTIFIED: "待复查",
  RECTIFICATION_PASSED: "整改通过",
  RECTIFICATION_REJECTED: "整改驳回",
  MAINTENANCE_ASSIGNED: "维修中",
  MAINTENANCE_COMPLETED: "维修完成",
  PASSED: "检查通过",
  CLOSED: "已关闭",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING_INSPECTION: "bg-gray-100 text-gray-800",
  INSPECTED: "bg-blue-100 text-blue-800",
  NEEDS_RECTIFICATION: "bg-orange-100 text-orange-800",
  RECTIFIED: "bg-yellow-100 text-yellow-800",
  RECTIFICATION_PASSED: "bg-green-100 text-green-800",
  RECTIFICATION_REJECTED: "bg-red-100 text-red-800",
  MAINTENANCE_ASSIGNED: "bg-purple-100 text-purple-800",
  MAINTENANCE_COMPLETED: "bg-teal-100 text-teal-800",
  PASSED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-gray-200 text-gray-600",
};

export const GRADE_LABELS: Record<string, string> = {
  EXCELLENT: "优秀",
  GOOD: "良好",
  FAIR: "一般",
  POOR: "差",
};

export const ROLE_LABELS: Record<string, string> = {
  DORM_MANAGER: "宿管员",
  COUNSELOR: "辅导员",
  MAINTENANCE: "维修人员",
};

export const INSPECTION_CATEGORIES = [
  { category: "卫生整洁", items: ["地面清洁", "床铺整理", "桌面整洁", "物品摆放"] },
  { category: "安全隐患", items: ["违规电器", "私拉电线", "易燃易爆", "消防通道"] },
  { category: "设施设备", items: ["门窗完好", "水电正常", "家具完好", "空调/暖气"] },
  { category: "公共区域", items: ["阳台卫生", "卫生间", "走廊清洁", "垃圾处理"] },
];
