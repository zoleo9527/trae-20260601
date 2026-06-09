import { CheckCircle, XCircle, Clock, AlertTriangle, Package } from 'lucide-react';

const iconMap = {
  create: Clock,
  submit: Clock,
  confirm: CheckCircle,
  reject: XCircle,
  warehouse_confirm: Package,
  reset: Clock,
  cancel: XCircle,
  stock_insufficient: AlertTriangle,
  repay: CheckCircle,
};

const colorMap = {
  create: 'bg-blue-100 text-blue-600',
  submit: 'bg-blue-100 text-blue-600',
  confirm: 'bg-green-100 text-green-600',
  reject: 'bg-red-100 text-red-600',
  warehouse_confirm: 'bg-purple-100 text-purple-600',
  reset: 'bg-yellow-100 text-yellow-600',
  cancel: 'bg-gray-100 text-gray-600',
  stock_insufficient: 'bg-orange-100 text-orange-600',
  repay: 'bg-green-100 text-green-600',
};

const labelMap = {
  create: '创建销售单',
  submit: '提交审核',
  confirm: '农技员确认',
  reject: '退回修改',
  warehouse_confirm: '仓管出库',
  reset: '重置单据',
  cancel: '取消销售',
  stock_insufficient: '库存不足',
  repay: '还款登记',
};

export default function Timeline({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        暂无操作记录
      </div>
    );
  }

  return (
    <div className="relative">
      {logs.map((log, index) => {
        const Icon = iconMap[log.action] || Clock;
        const colorClass = colorMap[log.action] || 'bg-gray-100 text-gray-600';
        const label = labelMap[log.action] || log.action;

        return (
          <div key={log.id} className="relative pl-8 pb-6 last:pb-0">
            {/* Timeline line */}
            {index < logs.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-primary-light to-gray-200"></div>
            )}

            {/* Timeline dot */}
            <div className={`absolute left-0 w-6 h-6 rounded-full ${colorClass} flex items-center justify-center`}>
              <Icon size={14} />
            </div>

            {/* Content */}
            <div className="pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">{label}</span>
                <span className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                操作人：{log.operator_name}
              </p>
              {log.details && (
                <p className="text-xs text-gray-400 mt-1 bg-gray-50 px-2 py-1 rounded">
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
