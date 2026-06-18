import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { AlertTriangle, AlertCircle, Clock, ChevronRight } from "lucide-react";

export default function RiskPanel() {
  const risks = useAppStore((s) => s.getRisks());
  const navigate = useNavigate();

  if (risks.length === 0) return null;

  const handleClick = (r: typeof risks[number]) => {
    navigate(r.relatedType === "complaint" ? `/complaints/${r.relatedId}` : `/verification/${r.relatedId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="bg-gradient-to-r from-flame-600 to-red-600 px-5 py-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-white" />
        <span className="text-white font-medium">风险项提醒</span>
        <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{risks.length}</span>
      </div>
      <div className="divide-y divide-ink-100">
        {risks.map((r) => (
          <div
            key={r.id}
            onClick={() => handleClick(r)}
            className={`px-5 py-4 flex items-start gap-3 hover:bg-ink-50 cursor-pointer transition-colors border-l-4 ${
              r.level === "danger" ? "border-l-red-500" : "border-l-brand-500"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              r.level === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  r.level === "danger" ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700"
                }`}>
                  {r.level === "danger" ? "高危" : "预警"}
                </span>
                <span className="text-sm font-medium text-ink-900">{r.title}</span>
              </div>
              <p className="text-sm text-ink-500 mt-1">{r.description}</p>
              {r.timeLeft && (
                <div className="flex items-center gap-1 mt-2 text-xs text-ink-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className={r.level === "danger" ? "text-red-600 font-medium" : ""}>{r.timeLeft}</span>
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-ink-400 flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
