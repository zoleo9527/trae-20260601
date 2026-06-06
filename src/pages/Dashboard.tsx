import { useNavigate } from 'react-router-dom';
import { Clock, FileText, AlertCircle, DollarSign, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { StatusTag } from '@/components/common/StatusTag';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, todos, detentions, appeals } = useStore();

  const statCards = [
    {
      title: '今日滞留单量',
      value: stats.todayDetentionCount,
      icon: Clock,
      color: 'bg-blue-50 text-blue-600',
      trend: '+2 较昨日',
      trendUp: true,
    },
    {
      title: '待处理申诉',
      value: stats.pendingAppealCount,
      icon: FileText,
      color: 'bg-orange-50 text-orange-600',
      trend: '需尽快处理',
      trendUp: false,
    },
    {
      title: '滞留费用总额',
      value: formatCurrency(stats.totalFeeAmount),
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      trend: '+¥120 较昨日',
      trendUp: true,
    },
    {
      title: '待确认费用',
      value: stats.pendingConfirmationCount,
      icon: AlertCircle,
      color: 'bg-purple-50 text-purple-600',
      trend: '等待调度员确认',
      trendUp: false,
    },
  ];

  const handleTodoClick = (todo: any) => {
    if (todo.type === 'detention_confirm') {
      navigate('/detention');
    } else if (todo.type === 'appeal_process') {
      navigate('/appeal');
    }
  };

  const recentDetentions = detentions.slice(0, 3);
  const recentAppeals = appeals.slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">工作台</h2>
        <p className="text-sm text-gray-500">欢迎回来，查看今日待办和数据概览</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white border border-gray-200 rounded p-5 hover:shadow-sm transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-2">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs">
              <span className={card.trendUp ? 'text-green-600' : 'text-gray-500'}>
                {card.trend}
              </span>
              {card.trendUp && <ArrowUpRight className="w-3 h-3 text-green-600 ml-1" />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">待办事项</h3>
              <span className="text-xs text-gray-500">{todos.length} 条待处理</span>
            </div>
            <div className="divide-y divide-gray-50">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => handleTodoClick(todo)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      todo.status === 'pending' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{todo.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{todo.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDateTime(todo.createTime)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">最近滞留记录</h3>
              <button
                onClick={() => navigate('/detention')}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">订单号</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">车牌号</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">司机</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">滞留时长</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">费用</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDetentions.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-900">{d.orderNo}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{d.plateNumber}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{d.driverName}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{d.detentionHours}小时</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{formatCurrency(d.feeAmount)}</td>
                      <td className="px-5 py-3">
                        <StatusTag status={d.status} type="detention" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">最近申诉</h3>
              <button
                onClick={() => navigate('/appeal')}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentAppeals.map((appeal) => (
                <div key={appeal.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{appeal.driverName}</span>
                    <StatusTag status={appeal.status} type="appeal" />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{appeal.appealReason}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>申请减免: {formatCurrency(appeal.requestedAdjustment)}</span>
                    <span>{formatDateTime(appeal.submittedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded p-5 text-white">
            <h3 className="font-medium mb-2">处理节奏提示</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 flex-shrink-0" />
                调度员：每日上午确认前日滞留费用
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 flex-shrink-0" />
                叉车班长：装卸完成即时标记
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 flex-shrink-0" />
                仓库文员：申诉24小时内处理完毕
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
