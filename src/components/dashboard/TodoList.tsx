import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import { CheckSquare, Square, ChevronRight, GripVertical, Clock, AlertOctagon } from "lucide-react";

const priorityMap = {
  high: { label: "高", color: "text-red-600 bg-red-50 border-red-200" },
  medium: { label: "中", color: "text-brand-700 bg-brand-50 border-brand-200" },
  low: { label: "低", color: "text-ink-600 bg-ink-100 border-ink-200" },
};

export default function TodoList() {
  const todos = useAppStore((s) => s.getTodos());
  const { selectedIds, toggleSelected } = useAppStore();
  const navigate = useNavigate();

  const handleClick = (t: typeof todos[number]) => {
    if (t.type === "complaint" || t.type === "visit") navigate(`/complaints/${t.relatedId}`);
    else navigate(`/verification/${t.relatedId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-card">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-ink-700" />
          <span className="font-medium text-ink-900">待处理事项</span>
          <span className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">{todos.length}</span>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">已选 {selectedIds.size} 项</span>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
              批量标记处理
            </button>
          </div>
        )}
      </div>
      <div className="divide-y divide-ink-100">
        {todos.map((t) => {
          const checked = selectedIds.has(t.id);
          const p = priorityMap[t.priority];
          const isOverdue = t.time.includes("超时");
          return (
            <div
              key={t.id}
              className="px-5 py-4 flex items-start gap-3 hover:bg-ink-50 transition-colors group"
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelected(t.id); }}
                className="mt-0.5 text-ink-400 hover:text-ink-700 transition-colors"
              >
                {checked ? <CheckSquare className="w-5 h-5 text-brand-600 fill-brand-50" /> : <Square className="w-5 h-5" />}
              </button>
              <GripVertical className="w-4 h-4 text-ink-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
              <div
                onClick={() => handleClick(t)}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${p.color}`}>
                    {t.priority === "high" && <AlertOctagon className="w-3 h-3 inline mr-1" />}
                    {p.label}优先级
                  </span>
                  {t.type !== "verification" && (
                    <StatusBadge
                      type="complaint"
                      value={t.complaintStatus || (t.type === "visit" ? "to_visit" : "pending")}
                    />
                  )}
                  <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-ink-400"}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {t.time}
                  </span>
                </div>
                <div className="text-sm font-medium text-ink-900 mt-2">{t.title}</div>
                <p className="text-sm text-ink-500 mt-0.5">{t.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
