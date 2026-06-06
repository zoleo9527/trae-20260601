import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { StatusBadge } from '@/components/StatusBadge';
import { RiskTag } from '@/components/RiskTag';
import {
  FileText,
  AlertTriangle,
  Package,
  Clock,
  ChevronRight,
  Activity,
} from 'lucide-react';
import type { PreparationOrder, RiskAlert, OperationLog } from '@/types';

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  return `${diffDays}天前`;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { preparationOrders, riskAlerts, operationLogs } = useStore();

  const pendingAuditCount = preparationOrders.filter(
    (o) => o.status === 'PENDING_AUDIT'
  ).length;
  const pendingSupplementCount = preparationOrders.filter(
    (o) => o.status === 'PENDING_SUPPLEMENT'
  ).length;
  const pendingLockCount = preparationOrders.filter(
    (o) => o.status === 'WAREHOUSE_CONFIRM'
  ).length;
  const totalRiskCount = riskAlerts.length;
  const highRiskCount = riskAlerts.filter((r) => r.level === 'high').length;

  const recentOrders = preparationOrders.slice(0, 5);
  const recentRisks = riskAlerts.slice(0, 5);
  const recentLogs = operationLogs.slice(0, 8);

  const statCards = [
    {
      title: '待审核',
      value: pendingAuditCount,
      icon: FileText,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: '待补件',
      value: pendingSupplementCount,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: '待锁库',
      value: pendingLockCount,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: '风险预警',
      value: totalRiskCount,
      subValue: highRiskCount > 0 ? `${highRiskCount} 高风险` : undefined,
      icon: Clock,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl p-5 border border-gray-100`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                {card.subValue && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {card.subValue}
                  </p>
                )}
              </div>
              <div
                className={`${card.color} p-3 rounded-lg text-white shadow-sm`}
              >
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">风险预警</h2>
            <button
              onClick={() => navigate('/risk-alerts')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRisks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无风险预警</div>
            ) : (
              recentRisks.map((risk: RiskAlert) => (
                <div
                  key={risk.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (risk.relatedType === 'preparation' && risk.relatedId) {
                      navigate(`/preparation/${risk.relatedId}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Activity
                          size={16}
                          className={
                            risk.level === 'high'
                              ? 'text-red-500'
                              : risk.level === 'medium'
                              ? 'text-orange-500'
                              : 'text-yellow-500'
                          }
                        />
                        <span className="font-medium text-gray-900 truncate">
                          {risk.title}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {risk.description}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {formatTime(risk.createdAt)}
                      </p>
                    </div>
                    <RiskTag level={risk.level} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">最近备货单</h2>
            <button
              onClick={() => navigate('/preparation')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无备货单</div>
            ) : (
              recentOrders.map((order: PreparationOrder) => (
                <div
                  key={order.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/preparation/${order.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {order.orderNo}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {order.warehouseName} · {order.creatorName}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatTime(order.createdAt)} · {order.items.length}个SKU ·{' '}
                        {order.totalQuantity}件
                      </p>
                    </div>
                    <StatusBadge status={order.status} type="preparation" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">最近操作动态</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无操作记录</div>
          ) : (
            recentLogs.map((log: OperationLog) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Activity size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {log.operatorName}
                      </span>
                      <span className="text-gray-500">{log.operation}</span>
                      {log.bizNo && (
                        <span className="text-blue-600 font-medium">
                          {log.bizNo}
                        </span>
                      )}
                    </div>
                    {log.detail && (
                      <p className="mt-1 text-sm text-gray-500">{log.detail}</p>
                    )}
                    {log.remark && (
                      <p className="mt-1 text-sm text-gray-500">
                        备注：{log.remark}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {formatTime(log.operateAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
