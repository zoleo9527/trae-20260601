import { AlertCircle, AlertTriangle, Clock, FileCheck } from 'lucide-react';

export default function Dashboard({ stats, onNavigate }) {
  const statusMap = {};
  (stats.statusCounts || []).forEach(s => { statusMap[s.status] = s.count; });

  const cards = [
    {
      label: '排期冲突',
      value: stats.conflictCount || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      desc: '需要协调处理',
    },
    {
      label: '待审核素材',
      value: stats.pendingReview || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      desc: '等待审核人员处理',
    },
    {
      label: '已播待确认',
      value: stats.pendingConfirm || 0,
      icon: FileCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      desc: '等待客户确认播出效果',
    },
    {
      label: '活跃订单',
      value: Object.values(statusMap).reduce((a, b) => a + b, 0) - (statusMap.completed || 0),
      icon: AlertCircle,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      border: 'border-primary-100',
      desc: '进行中的订单数量',
    },
  ];

  const actionMap = {
    order_status_change: '订单状态变更',
    material_review: '素材审核',
    material_upload: '素材上传',
    schedule_update: '排期更新',
    schedule_conflict: '排期冲突',
    broadcast_confirmed: '播出确认',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">工作台</h2>
        <p className="text-gray-500 mt-1">广告排期全流程管理 — 今日概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className={`card p-5 border ${card.border} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => onNavigate && onNavigate(card.label)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-2">{card.desc}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <card.icon size={22} className={card.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">📋 今日排期</h3>
          {(stats.todaySchedules || []).length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">今日暂无排期</p>
          ) : (
            <div className="space-y-3">
              {stats.todaySchedules.map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-primary-600">{s.time_slot}</p>
                    <p className="text-xs text-gray-400">{s.duration}s</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.client_name} - {s.file_name}</p>
                    <p className="text-xs text-gray-500">{s.channel} · {s.order_no}</p>
                  </div>
                  <span className={`badge ${
                    s.status === 'aired' ? 'bg-emerald-100 text-emerald-700' :
                    s.status === 'conflict' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {s.status === 'aired' ? '已播' : s.status === 'conflict' ? '冲突' : '待播'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">🔔 最近动态</h3>
          {(stats.recentAudits || []).length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">暂无动态</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAudits.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{a.order_no}</span>
                      {' · '}
                      <span className="text-gray-600">{actionMap[a.action] || a.action}</span>
                    </p>
                    {a.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.notes}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{a.operator} · {a.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
