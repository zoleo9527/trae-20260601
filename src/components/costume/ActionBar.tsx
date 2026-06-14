import { useState } from "react";
import { ArrowRight, Send, MessageSquare } from "lucide-react";
import { useAppStore } from "@/store";
import { STATUS_META, STATUS_FLOW } from "@/constants";
import type { Costume } from "@/types";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";

interface Props {
  costume: Costume;
}

export default function ActionBar({ costume }: Props) {
  const { advanceStatus, currentUser } = useAppStore();
  const [remark, setRemark] = useState("");
  const [showRemark, setShowRemark] = useState(false);

  const currentIdx = STATUS_FLOW.indexOf(costume.status);
  const nextStatus = STATUS_FLOW[currentIdx + 1];
  const nextMeta = nextStatus ? STATUS_META[nextStatus] : null;
  const isLast = currentIdx >= STATUS_FLOW.length - 1;

  const canAdvance =
    !isLast &&
    (currentUser.role === costume.currentAssigneeRole || currentUser.role === "admin");

  const handleAdvance = () => {
    if (!canAdvance) return;
    const finalRemark =
      remark.trim() || `由${currentUser.name}推进至「${nextMeta?.label}」`;
    advanceStatus(costume.id, finalRemark);
    setRemark("");
    setShowRemark(false);
  };

  return (
    <div className="card p-5 sticky bottom-4 z-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="text-xs text-ink-400 mb-1">当前状态</div>
            <StatusBadge status={costume.status} />
          </div>
          {nextMeta && (
            <>
              <ArrowRight size={18} className="text-ink-300" />
              <div>
                <div className="text-xs text-ink-400 mb-1">下一节点</div>
                <span className="chip bg-cream-100 text-ink-600 border-cream-200">
                  {nextMeta.label} → {currentUser.role === nextMeta.assigneeRole ? "当前身份可处理" : nextMeta.assigneeRole === "admin" ? "教务" : nextMeta.assigneeRole === "teacher" ? "舞蹈老师" : "校长"}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-cream-200">
            <span className="text-xs text-ink-400">当前处理人</span>
            <Avatar
              name={costume.currentAssignee}
              role={costume.currentAssigneeRole}
              size="sm"
              showName
            />
          </div>
          {isLast ? (
            <span className="chip bg-forest-50 text-forest-700 border-forest-200">
              流程已完成
            </span>
          ) : !canAdvance ? (
            <span className="chip bg-ink-50 text-ink-500 border-ink-200">
              当前身份无权限推进
            </span>
          ) : showRemark ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="input !py-1.5 w-56 text-sm"
                placeholder="请输入操作备注..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdvance()}
              />
              <button onClick={handleAdvance} className="btn btn-primary">
                <Send size={14} />
                确认推进
              </button>
              <button
                onClick={() => {
                  setShowRemark(false);
                  setRemark("");
                }}
                className="btn btn-ghost"
              >
                取消
              </button>
            </div>
          ) : (
            <button onClick={() => setShowRemark(true)} className="btn btn-primary">
              <ArrowRight size={14} />
              推进至下一节点
              <MessageSquare size={14} className="ml-1 opacity-70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
