import { Tag } from "antd"

type BadgeType = "booking" | "schedule" | "assignment" | "exception" | "exception_type"

const labelMap: Record<string, string> = {
  pending: "待处理", confirmed: "已确认", scheduled: "已排班",
  in_transit: "运输中", in_progress: "进行中", completed: "已完成", cancelled: "已取消", paid: "已支付",
  departed: "已出车", arrived_pickup: "到达装车", loading: "装车中",
  transporting: "运输中", arrived_delivery: "到达卸车", unloading: "卸车中", finished: "已完成",
  assigned: "已派工", accepted: "已接受", done: "已完成", rejected: "已拒绝",
  open: "待处理", handling: "处理中", resolved: "已解决", refunded: "已退款", closed: "已关闭", returned: "已退回",
  delay: "延误", surcharge: "加价", damage: "物损",
};
const bookingColorMap: Record<string, string> = {
  pending: "gold", confirmed: "blue", scheduled: "cyan",
  in_transit: "processing", completed: "green", cancelled: "default", paid: "purple",
};
const scheduleColorMap: Record<string, string> = {
  pending: "default", departed: "cyan", arrived_pickup: "geekblue",
  loading: "purple", transporting: "processing",
  arrived_delivery: "volcano", unloading: "magenta", finished: "green",
};
const assignmentColorMap: Record<string, string> = {
  assigned: "blue", accepted: "cyan", in_progress: "processing",
  done: "green", rejected: "red",
};
const exceptionColorMap: Record<string, string> = {
  open: "red", handling: "gold", resolved: "green",
  refunded: "purple", closed: "default", returned: "orange",
};
const exceptionTypeColorMap: Record<string, string> = {
  delay: "orange", surcharge: "gold", damage: "red",
};
interface StatusBadgeProps {
  type: BadgeType;
  value: string;
  showLabel?: boolean;
}

export default function StatusBadge({ type, value, showLabel = true }: StatusBadgeProps) {
  const label = labelMap[value] ?? String(value);
  let color: string = "default";
  switch (type) {
    case "booking": color = bookingColorMap[value] ?? "default"; break;
    case "schedule": color = scheduleColorMap[value] ?? "default"; break;
    case "assignment": color = assignmentColorMap[value] ?? "default"; break;
    case "exception": color = exceptionColorMap[value] ?? "default"; break;
    case "exception_type": color = exceptionTypeColorMap[value] ?? "default"; break;
  }
  return <Tag color={color}>{showLabel ? label : String(value)}</Tag>;
}