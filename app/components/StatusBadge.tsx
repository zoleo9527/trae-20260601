import { getFeedbackTypeLabel, getStatusLabel, getTodoStatusLabel, getTodoTypeLabel } from "~/data/mockData";

interface StatusBadgeProps {
  status: string;
  type?: "feedback" | "feedbackType" | "todo" | "todoType";
}

export function StatusBadge({ status, type = "feedback" }: StatusBadgeProps) {
  if (type === "todoType") {
    const config = getTodoTypeLabel(status);
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  }

  let config: { label: string; color: string };
  
  if (type === "feedback") {
    config = getStatusLabel(status);
  } else if (type === "feedbackType") {
    config = getFeedbackTypeLabel(status);
  } else {
    config = getTodoStatusLabel(status);
  }

  return (
    <span className={`badge ${config.color}`}>
      {config.label}
    </span>
  );
}
