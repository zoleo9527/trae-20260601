import { useAppStore } from "@/store/useAppStore";
import { Receipt, ChefHat, Users, MessageSquare } from "lucide-react";

const roleIcon = {
  cashier: Receipt,
  kitchen_lead: ChefHat,
  floor_manager: Users,
};

const roleColor = {
  cashier: "bg-green-50 text-green-600",
  kitchen_lead: "bg-flame-50 text-flame-600",
  floor_manager: "bg-blue-50 text-blue-600",
};

export default function ActivityTimeline() {
  const activities = useAppStore((s) => s.activities);

  return (
    <div className="bg-white rounded-xl shadow-card">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-ink-700" />
        <span className="font-medium text-ink-900">最近变更</span>
      </div>
      <div className="p-5">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-ink-200"></div>
          <div className="space-y-5">
            {activities.map((a, idx) => {
              const Icon = roleIcon[a.role];
              const isLast = idx === activities.length - 1;
              return (
                <div key={a.id} className="relative pl-11">
                  <div className={`absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center ${roleColor[a.role]} border-2 border-white shadow-card`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink-900">{a.actor}</span>
                      <span className="text-sm text-ink-700">{a.action}</span>
                      <span className="text-sm font-mono text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">{a.target}</span>
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">{a.time}</div>
                  </div>
                  {isLast && <div className="h-0"></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
