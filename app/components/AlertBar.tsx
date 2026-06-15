import { Link, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";

interface Alert {
  id: string;
  title: string;
  message: string;
  alertType: string;
  workOrder: {
    id: string;
    orderNo: string;
  };
}

interface AlertBarProps {
  userId: string;
  role: string;
}

export function AlertBar({ userId, role }: AlertBarProps) {
  const fetcher = useFetcher<{ alerts: Alert[] }>();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetcher.load(`/api/alerts?userId=${userId}&role=${role}`);
  }, [userId, role]);

  useEffect(() => {
    if (fetcher.data) {
      setAlerts(fetcher.data.alerts);
    }
  }, [fetcher.data]);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-red-50 border-b border-red-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">!</div>
            <span className="text-sm font-medium text-red-800">
              有 {alerts.length} 条异常需要处理：
            </span>
            <div className="flex items-center gap-2 overflow-x-auto max-w-2xl">
              {alerts.slice(0, 3).map((a) => (
                <Link
                  key={a.id}
                  to={`/orders/${a.workOrder.id}`}
                  className="shrink-0 px-2.5 py-1 bg-white border border-red-200 rounded text-xs text-red-700 hover:bg-red-50 transition-colors"
                >
                  [{a.workOrder.orderNo}] {a.title}
                </Link>
              ))}
              {alerts.length > 3 && (
                <Link
                  to="/alerts"
                  className="shrink-0 text-xs text-red-700 hover:text-red-900 underline"
                >
                  查看全部 {alerts.length} 条 →
                </Link>
              )}
            </div>
          </div>
          <Link
            to="/alerts"
            className="text-xs text-red-700 hover:text-red-900 font-medium"
          >
            进入处理中心
          </Link>
        </div>
      </div>
    </div>
  );
}
