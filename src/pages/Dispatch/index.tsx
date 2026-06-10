import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Radio,
  ArrowLeft,
  RefreshCw,
  Download,
  Clock,
  Car,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { DispatchProcessSteps } from '../../components/ProcessSteps';
import { useRecent } from '../../hooks/useRecent';
import { useOffline } from '../../hooks/useOffline';
import { formatDateTime, timeAgo } from '../../utils/date';
import { cn } from '../../lib/utils';
import type { DispatchNode } from '../../data/types';

export default function DispatchList() {
  const navigate = useNavigate();
  const { addRecentVisit } = useRecent();
  const { dispatches } = useStore();

  const handleRowClick = (dispatchId: string, record: typeof dispatches[0]) => {
    addRecentVisit({
      type: 'dispatch',
      title: record.plateNumber,
      subtitle: `下发${record.status === 'success' ? '成功' : record.status === 'failed' ? '失败' : '中'}`,
      path: `/dispatch/${dispatchId}`,
    });
    navigate(`/dispatch/${dispatchId}`);
  };

  const getFailedNode = (record: typeof dispatches[0]) => {
    return record.nodes.find(n => n.status === 'failed');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">权限下发回看</h1>
            <p className="text-sm text-slate-500">追踪下发链路，定位失败原因</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            导出日志
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  车牌号
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  重试次数
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  进度
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  失败节点
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches.map((record) => {
                const failedNode = getFailedNode(record);
                const successCount = record.nodes.filter(n => n.status === 'success').length;
                const totalNodes = record.nodes.length;

                return (
                  <tr
                    key={record.id}
                    onClick={() => handleRowClick(record.id, record)}
                    className={cn(
                      'hover:bg-orange-50/30 cursor-pointer transition-colors',
                      record.status === 'failed' && 'bg-red-50/30 hover:bg-red-50/50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Car className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="font-mono font-medium text-slate-800">
                          {record.plateNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3">
                      {record.retryCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                          <RefreshCw className="w-3 h-3" />
                          {record.retryCount} 次
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">0 次</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              record.status === 'success' && 'bg-emerald-500',
                              record.status === 'failed' && 'bg-red-500',
                              (record.status === 'dispatching' || record.status === 'queued') && 'bg-blue-500'
                            )}
                            style={{ width: `${(successCount / totalNodes) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {successCount}/{totalNodes}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {failedNode ? (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-sm text-red-600">{failedNode.name}</span>
                        </div>
                      ) : record.status === 'success' ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-sm text-emerald-600">全部成功</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600 font-mono text-xs">
                        {formatDateTime(record.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600 font-mono text-xs">
                        {timeAgo(record.updatedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                        查看链路
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DispatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addRecentVisit } = useRecent();
  const { isOffline, toggleOffline } = useOffline();
  const { dispatches, currentUser, actions } = useStore();
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const record = dispatches.find(d => d.id === id);

  if (!record) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">未找到该下发记录</p>
          <button
            onClick={() => navigate('/dispatch')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const failedNode = record.nodes.find(n => n.status === 'failed');
  const successCount = record.nodes.filter(n => n.status === 'success').length;
  const totalNodes = record.nodes.length;

  const handleRetry = async (nodeId: string) => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    actions.retryDispatch(record.id, nodeId);
    actions.addActivity({
      type: 'dispatch_fail',
      title: '重试下发',
      description: `${record.plateNumber} 正在重试下发`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      relatedId: record.id,
      relatedType: 'dispatch',
    });
    addRecentVisit({
      type: 'dispatch',
      title: record.plateNumber,
      subtitle: '重试下发中',
      path: `/dispatch/${record.id}`,
    });
    setIsRetrying(false);
    setExpandedNodeId(null);
  };

  const handleNodeClick = (node: DispatchNode, index: number) => {
    setExpandedNodeId(expandedNodeId === node.id ? null : node.id);
    addRecentVisit({
      type: 'dispatch',
      title: record.plateNumber,
      subtitle: `${node.name} - ${node.status === 'failed' ? '失败' : node.status === 'success' ? '成功' : '进行中'}`,
      path: `/dispatch/${record.id}`,
    });
  };

  const handleBatchRetry = async () => {
    const firstFailed = record.nodes.find(n => n.status === 'failed');
    if (firstFailed) {
      await handleRetry(firstFailed.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dispatch')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">
                {record.plateNumber} 权限下发
              </h1>
              <StatusBadge status={record.status} />
              {failedNode && <PriorityBadge priority="high" />}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              下发编号：{record.id} · 创建于 {formatDateTime(record.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleOffline}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              isOffline
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4" />
                离线模式
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                在线模式
              </>
            )}
          </button>
          <button
            onClick={handleBatchRetry}
            disabled={record.status !== 'failed' || isRetrying}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            重试下发
          </button>
        </div>
      </div>

      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-800">当前处于离线模式</div>
            <div className="text-sm text-amber-600 mt-1">
              所有操作将暂存本地，联网后自动同步。可查看历史记录和已缓存数据。
            </div>
          </div>
        </div>
      )}

      {failedNode && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-red-800">下发失败</div>
            <div className="text-sm text-red-600 mt-1">
              <span className="font-medium">{failedNode.name}：</span>
              {failedNode.errorMessage || '未知错误'}
              {failedNode.errorCode && (
                <span className="font-mono ml-2 text-red-500">[{failedNode.errorCode}]</span>
              )}
            </div>
          </div>
          <button
            onClick={() => failedNode && handleRetry(failedNode.id)}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-sm rounded-lg transition-colors"
          >
            {isRetrying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            重试该节点
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">整体进度</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold text-slate-800 font-mono">
              {Math.round((successCount / totalNodes) * 100)}%
            </div>
            <div className="text-xs text-slate-400 mb-1">
              {successCount}/{totalNodes} 节点
            </div>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className={cn(
                'h-full transition-all',
                record.status === 'success' && 'bg-emerald-500',
                record.status === 'failed' && 'bg-red-500',
                (record.status === 'dispatching' || record.status === 'queued') && 'bg-blue-500'
              )}
              style={{ width: `${(successCount / totalNodes) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">重试次数</div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {record.retryCount}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {record.retryCount > 0 ? '已尝试多次重试' : '首次下发中'}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">创建时间</div>
          <div className="text-sm font-medium text-slate-800 font-mono">
            {formatDateTime(record.createdAt)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {timeAgo(record.createdAt)} 创建
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">最近更新</div>
          <div className="text-sm font-medium text-slate-800 font-mono">
            {formatDateTime(record.updatedAt)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {timeAgo(record.updatedAt)} 更新
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-500" />
            下发链路
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            点击节点查看详情和原始日志
          </div>
        </div>
        <div className="p-6">
          <DispatchProcessSteps
            nodes={record.nodes}
            onNodeClick={handleNodeClick}
            expandedNodeId={expandedNodeId}
          />
        </div>
      </div>

      {expandedNodeId && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-slide-in">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">节点操作</h2>
          </div>
          <div className="p-6 flex items-center gap-4">
            {record.nodes.find(n => n.id === expandedNodeId)?.status === 'failed' && (
              <>
                <button
                  onClick={() => handleRetry(expandedNodeId)}
                  disabled={isRetrying}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isRetrying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  重试该节点
                </button>
                <p className="text-sm text-slate-500">
                  从该节点开始重新下发，后续节点将重置状态
                </p>
              </>
            )}
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors">
              <Download className="w-4 h-4" />
              导出该节点日志
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
