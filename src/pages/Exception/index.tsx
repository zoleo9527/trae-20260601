import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Wrench,
  UserX,
  Car,
  User,
  Clock,
  MapPin,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { useRecent } from '../../hooks/useRecent';
import { formatDateTime, timeAgo } from '../../utils/date';
import { cn } from '../../lib/utils';
import { getExceptionTypeLabel, getOperatorRoleLabel } from '../../data/mockData';
import type { ExceptionType, ExceptionPriority } from '../../data/types';

export default function ExceptionList() {
  const navigate = useNavigate();
  const { addRecentVisit } = useRecent();
  const { exceptions, operators } = useStore();
  const [typeFilter, setTypeFilter] = useState<ExceptionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<ExceptionPriority | 'all'>('all');

  const filteredExceptions = exceptions.filter(exc => {
    if (typeFilter !== 'all' && exc.type !== typeFilter) return false;
    if (statusFilter !== 'all' && exc.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && exc.priority !== priorityFilter) return false;
    return true;
  });

  const handleRowClick = (exceptionId: string, record: typeof exceptions[0]) => {
    addRecentVisit({
      type: 'exception',
      title: record.plateNumber || getExceptionTypeLabel(record.type),
      subtitle: `${record.parkingLot} · ${getExceptionTypeLabel(record.type)}`,
      path: `/exception/${exceptionId}`,
    });
    navigate(`/exception/${exceptionId}`);
  };

  const getTypeIcon = (type: ExceptionType) => {
    const icons = {
      permission_expired: <UserX className="w-4 h-4" />,
      unlicensed_dispute: <Car className="w-4 h-4" />,
      gate_fault: <Wrench className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getTypeBgColor = (type: ExceptionType) => {
    const colors = {
      permission_expired: 'bg-amber-100 text-amber-600',
      unlicensed_dispute: 'bg-blue-100 text-blue-600',
      gate_fault: 'bg-red-100 text-red-600',
    };
    return colors[type];
  };

  const getHandler = (handlerId: string | null) => {
    if (!handlerId) return null;
    return operators.find(o => o.id === handlerId);
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
            <h1 className="text-xl font-bold text-slate-800">异常处理</h1>
            <p className="text-sm text-slate-500">处理道闸故障、权限失效、无牌车争议</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            筛选：
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ExceptionType | 'all')}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">全部类型</option>
            <option value="permission_expired">月租权限失效</option>
            <option value="unlicensed_dispute">无牌车争议</option>
            <option value="gate_fault">道闸故障</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="transferred">已转派</option>
            <option value="closed">已关闭</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as ExceptionPriority | 'all')}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">全部优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {exceptions.filter(e => e.status === 'pending').length}
              </div>
              <div className="text-xs text-slate-500">待处理</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {exceptions.filter(e => e.status === 'processing').length}
              </div>
              <div className="text-xs text-slate-500">处理中</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {exceptions.filter(e => e.type === 'permission_expired').length}
              </div>
              <div className="text-xs text-slate-500">权限失效</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {exceptions.filter(e => e.status === 'closed').length}
              </div>
              <div className="text-xs text-slate-500">已关闭</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  工单号
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  优先级
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  车牌号
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  停车场
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  处理人
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExceptions.map((record) => {
                const handler = getHandler(record.handlerId);

                return (
                  <tr
                    key={record.id}
                    onClick={() => handleRowClick(record.id, record)}
                    className={cn(
                      'hover:bg-orange-50/30 cursor-pointer transition-colors',
                      record.priority === 'high' && record.status === 'pending' && 'bg-red-50/30 hover:bg-red-50/50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-slate-800">{record.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-7 h-7 rounded flex items-center justify-center', getTypeBgColor(record.type))}>
                          {getTypeIcon(record.type)}
                        </div>
                        <span className="text-sm text-slate-700">
                          {getExceptionTypeLabel(record.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={record.priority} />
                    </td>
                    <td className="px-4 py-3">
                      {record.plateNumber ? (
                        <div className="font-mono text-sm text-slate-800">
                          {record.plateNumber}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">{record.parkingLot}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-sm text-slate-600 truncate">
                        {record.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3">
                      {handler ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                            {handler.avatar}
                          </div>
                          <div>
                            <div className="text-sm text-slate-700">{handler.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {getOperatorRoleLabel(handler.role)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-red-500 font-medium">待分配</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-500">
                        {timeAgo(record.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                        查看详情
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

export function ExceptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addRecentVisit } = useRecent();
  const { exceptions, operators, currentUser, actions } = useStore();
  const [remark, setRemark] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedHandler, setSelectedHandler] = useState<string>('');

  const record = exceptions.find(e => e.id === id);

  if (!record) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">未找到该异常工单</p>
          <button
            onClick={() => navigate('/exception')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const handler = operators.find(o => o.id === record.handlerId);

  const getTypeIcon = (type: ExceptionType) => {
    const icons = {
      permission_expired: <UserX className="w-5 h-5" />,
      unlicensed_dispute: <Car className="w-5 h-5" />,
      gate_fault: <Wrench className="w-5 h-5" />,
    };
    return icons[type];
  };

  const getTypeBgColor = (type: ExceptionType) => {
    const colors = {
      permission_expired: 'bg-amber-100 text-amber-600',
      unlicensed_dispute: 'bg-blue-100 text-blue-600',
      gate_fault: 'bg-red-100 text-red-600',
    };
    return colors[type];
  };

  const getLogIcon = (action: string) => {
    if (action.includes('创建')) return <AlertTriangle className="w-4 h-4" />;
    if (action.includes('转派')) return <RefreshCw className="w-4 h-4" />;
    if (action.includes('接单') || action.includes('处理')) return <Wrench className="w-4 h-4" />;
    if (action.includes('关闭') || action.includes('解决')) return <CheckCircle className="w-4 h-4" />;
    return <MessageSquare className="w-4 h-4" />;
  };

  const getLogIconColor = (action: string) => {
    if (action.includes('创建')) return 'bg-amber-100 text-amber-600';
    if (action.includes('转派')) return 'bg-purple-100 text-purple-600';
    if (action.includes('接单') || action.includes('处理')) return 'bg-blue-100 text-blue-600';
    if (action.includes('关闭') || action.includes('解决')) return 'bg-emerald-100 text-emerald-600';
    return 'bg-slate-100 text-slate-600';
  };

  const handleAddLog = () => {
    if (!remark.trim()) return;
    actions.addExceptionLog(record.id, currentUser.id, '添加备注', remark);
    actions.addActivity({
      type: 'exception_fix',
      title: '异常处理',
      description: `${getExceptionTypeLabel(record.type)}: ${remark}`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      relatedId: record.id,
      relatedType: 'exception',
    });
    addRecentVisit({
      type: 'exception',
      title: record.plateNumber || getExceptionTypeLabel(record.type),
      subtitle: `添加备注: ${remark.substring(0, 20)}`,
      path: `/exception/${record.id}`,
    });
    setRemark('');
  };

  const handleClaim = () => {
    actions.claimException(record.id, currentUser.id);
    actions.addActivity({
      type: 'exception_fix',
      title: '接单处理',
      description: `${getExceptionTypeLabel(record.type)} 已由 ${currentUser.name} 接单`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      relatedId: record.id,
      relatedType: 'exception',
    });
    addRecentVisit({
      type: 'exception',
      title: record.plateNumber || getExceptionTypeLabel(record.type),
      subtitle: '已接单处理',
      path: `/exception/${record.id}`,
    });
  };

  const handleTransfer = () => {
    if (!selectedHandler) return;
    const targetOperator = operators.find((o) => o.id === selectedHandler);
    actions.transferException(record.id, currentUser.id, selectedHandler, `转派给 ${targetOperator?.name} 处理`);
    actions.addActivity({
      type: 'exception_create',
      title: '工单转派',
      description: `${getExceptionTypeLabel(record.type)} 转派给 ${targetOperator?.name}`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      relatedId: record.id,
      relatedType: 'exception',
    });
    addRecentVisit({
      type: 'exception',
      title: record.plateNumber || getExceptionTypeLabel(record.type),
      subtitle: `转派给 ${targetOperator?.name}`,
      path: `/exception/${record.id}`,
    });
    setShowTransferModal(false);
    setSelectedHandler('');
  };

  const handleClose = () => {
    if (!remark.trim()) {
      alert('请填写处理结果备注');
      return;
    }
    actions.closeException(record.id, currentUser.id, remark);
    actions.addActivity({
      type: 'exception_fix',
      title: '工单关闭',
      description: `${getExceptionTypeLabel(record.type)} 已解决: ${remark}`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      relatedId: record.id,
      relatedType: 'exception',
    });
    addRecentVisit({
      type: 'exception',
      title: record.plateNumber || getExceptionTypeLabel(record.type),
      subtitle: '工单已关闭',
      path: `/exception/${record.id}`,
    });
    setRemark('');
  };

  const canClaim = record.status === 'pending' && !record.handlerId;
  const canProcess = record.handlerId === currentUser.id && record.status !== 'closed';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exception')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getTypeBgColor(record.type))}>
              {getTypeIcon(record.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  {getExceptionTypeLabel(record.type)}
                </h1>
                <StatusBadge status={record.status} />
                <PriorityBadge priority={record.priority} />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                工单号：{record.id} · 创建于 {formatDateTime(record.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canClaim && (
            <button
              onClick={handleClaim}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              我来处理
            </button>
          )}
          {canProcess && (
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              转派
            </button>
          )}
          {canProcess && (
            <button
              onClick={handleClose}
              disabled={!remark.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              关闭工单
            </button>
          )}
        </div>
      </div>

      {record.priority === 'high' && record.status !== 'closed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-red-800">高优先级异常</div>
            <div className="text-sm text-red-600 mt-1">
              {record.description}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">工单信息</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">停车场</div>
                    <div className="font-medium text-slate-800">{record.parkingLot}</div>
                  </div>
                </div>
                {record.plateNumber && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">车牌号</div>
                      <div className="font-mono font-medium text-slate-800">
                        {record.plateNumber}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">创建时间</div>
                    <div className="font-mono text-sm text-slate-700">
                      {formatDateTime(record.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">更新时间</div>
                    <div className="font-mono text-sm text-slate-700">
                      {formatDateTime(record.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-1">问题描述</div>
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                  {record.description}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">处理时间线</h2>
              <span className="text-xs text-slate-500">
                共 {record.logs.length} 条记录
              </span>
            </div>
            <div className="p-6">
              <div className="relative">
                {record.logs.map((log, index) => (
                  <div key={log.id} className="flex gap-3 mb-0 last:mb-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          getLogIconColor(log.action)
                        )}
                      >
                        {getLogIcon(log.action)}
                      </div>
                      {index < record.logs.length - 1 && (
                        <div className="absolute top-8 left-1/2 w-px h-full bg-slate-200 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-slate-800">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
                          {timeAgo(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {log.remark}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">
                          {log.operatorName || '未知'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {canProcess && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">添加处理记录</h2>
              </div>
              <div className="p-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-orange-600">
                      {currentUser.avatar}
                    </span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="输入处理记录、备注或解决方案..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleAddLog}
                        disabled={!remark.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        添加记录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">处理人</h2>
            </div>
            <div className="p-4">
              {handler ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-lg font-medium text-slate-600">
                    {handler.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{handler.name}</div>
                    <div className="text-xs text-slate-500">
                      {getOperatorRoleLabel(handler.role)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        handler.status === 'online' && 'bg-emerald-500 animate-pulse',
                        handler.status === 'busy' && 'bg-amber-500',
                        handler.status === 'offline' && 'bg-slate-400'
                      )} />
                      <span className="text-[10px] text-slate-400">
                        {handler.status === 'online' && '在岗'}
                        {handler.status === 'busy' && '忙碌'}
                        {handler.status === 'offline' && '离线'}
                      </span>
                      <span className="text-[10px] text-slate-300 mx-1">·</span>
                      <span className="text-[10px] text-slate-400">
                        {handler.currentTaskCount} 个任务
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <XCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">尚未分配处理人</p>
                  {canClaim && (
                    <button
                      onClick={handleClaim}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      点击接单
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">可选处理人</h2>
            </div>
            <div className="p-2">
              {operators
                .filter(o => o.status !== 'offline')
                .sort((a, b) => a.currentTaskCount - b.currentTaskCount)
                .map(op => (
                  <div
                    key={op.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors',
                      op.id === record.handlerId
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                      {op.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {op.name}
                        </span>
                        {op.id === record.handlerId && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                            当前
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">
                          {getOperatorRoleLabel(op.role)}
                        </span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400">
                          {op.currentTaskCount} 个任务
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      op.status === 'online' && 'bg-emerald-500',
                      op.status === 'busy' && 'bg-amber-500'
                    )} />
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-orange-800 text-sm">一线处理优先级</div>
                <div className="text-xs text-orange-600 mt-1 space-y-0.5">
                  <div>1. 道闸故障 → 设备维护员优先</div>
                  <div>2. 月租权限失效 → 客服/运营协同</div>
                  <div>3. 无牌车争议 → 客服优先</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">转派工单</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  选择处理人
                </label>
                <div className="relative">
                  <select
                    value={selectedHandler}
                    onChange={(e) => setSelectedHandler(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none"
                  >
                    <option value="">请选择处理人</option>
                    {operators
                      .filter(o => o.status !== 'offline')
                      .map(op => (
                        <option key={op.id} value={op.id}>
                          {op.name} - {getOperatorRoleLabel(op.role)} ({op.currentTaskCount}个任务)
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!selectedHandler}
                  className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  确认转派
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
