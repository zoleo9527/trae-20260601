import { Briefcase, GraduationCap, MessageCircle, User } from "lucide-react";
import { formatDateTime } from "~/data/mockData";
import type { FollowUpRecord } from "~/types";

interface FollowUpTimelineProps {
  records: FollowUpRecord[];
}

export function FollowUpTimeline({ records }: FollowUpTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle size={40} className="mx-auto mb-2 text-gray-300" />
        <p>暂无跟进记录</p>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "teacher":
        return <GraduationCap size={16} />;
      case "consultant":
        return <Briefcase size={16} />;
      case "director":
        return <User size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "teacher":
        return "任课老师";
      case "consultant":
        return "课程顾问";
      case "director":
        return "校区主管";
      default:
        return "其他";
    }
  };

  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <div key={record.id} className="relative pl-6">
          {index < records.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
          )}
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            {getRoleIcon(record.operatorRole)}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 ml-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{record.operatorName}</span>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                  {getRoleLabel(record.operatorRole)}
                </span>
              </div>
              <span className="text-xs text-gray-400">{formatDateTime(record.createdAt)}</span>
            </div>
            <p className="text-gray-700 text-sm">{record.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
