import { X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import type { Costume } from "@/types";
import { cn, formatDateTime } from "@/utils";
import Avatar from "../common/Avatar";

interface Props {
  costume: Costume;
}

const fieldLabels: Record<string, string> = {
  height: "身高",
  weight: "体重",
  chest: "胸围",
  waist: "腰围",
  hips: "臀围",
  size: "尺码",
  confirmStatus: "确认状态",
  remark: "备注",
};

const statusLabels: Record<string, string> = {
  pending: "待确认",
  confirmed: "已确认",
  exception: "异常",
};

export default function SizeHistoryModal({ costume }: Props) {
  const navigate = useNavigate();
  const { sizeHistoryStudentId, openSizeHistory } = useAppStore();
  const student = costume.studentSizes.find((s) => s.id === sizeHistoryStudentId);

  const handleClose = () => {
    openSizeHistory(null, null);
    navigate(`/costumes/${costume.id}`, { replace: true });
  };

  if (!student) return null;
  const logs = [...student.changeLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatValue = (field: string, v: string) => {
    if (!v) return "（空）";
    if (field === "confirmStatus") return statusLabels[v] || v;
    return v;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-card-hover animate-in">
        <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between bg-cream-50">
          <div>
            <h3 className="font-serif text-base font-semibold text-ink-900">
              尺码修改历史
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">学生：{student.studentName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-cream-200 text-ink-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {logs.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-8">暂无修改记录</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-cream-200" />
              <div className="space-y-5">
                {logs.map((log, idx) => (
                  <div key={log.id} className="relative pl-8">
                    <div
                      className={cn(
                        "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shadow",
                        idx === 0 ? "bg-wine-600" : "bg-ink-400"
                      )}
                    >
                      {logs.length - idx}
                    </div>
                    <div className="card p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Avatar name={log.operatorName} role={log.operatorRole} size="sm" showName />
                        <span className="text-xs text-ink-400">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-cream-200 text-ink-700 text-xs font-medium">
                          {fieldLabels[log.fieldName] || log.fieldName}
                        </span>
                        <span className="text-ink-500">{formatValue(log.fieldName, log.oldValue)}</span>
                        <ArrowRight size={14} className="text-ink-300" />
                        <span className="font-medium text-wine-700">{formatValue(log.fieldName, log.newValue)}</span>
                      </div>
                      {log.remark && (
                        <p className="text-xs text-ink-600 mt-2 pt-2 border-t border-cream-100 leading-relaxed">
                          <span className="text-gold-700 font-medium">备注：</span>
                          {log.remark}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
