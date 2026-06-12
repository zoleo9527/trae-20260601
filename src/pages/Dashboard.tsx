import { useState } from 'react';
import { useFarmStore } from '@/store';
import { AlertTriangle, Clock, CheckCircle2, Activity, ChevronRight, Search, Filter, User, Calendar } from 'lucide-react';
import type { VeterinaryRecord, QuarantineRecord, ExceptionRecord } from '@/types';

interface RecentChange {
  id: number;
  type: 'veterinary' | 'quarantine' | 'exception';
  status?: string;
  cattleId?: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

function StatCard({ icon: Icon, label, value, color, trend }: { icon: typeof Activity; label: string; value: number; color: string; trend?: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color.replace('text-', 'bg-')}${color.includes('pasture') ? '-100' : '-100'} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function TaskCard({ record, type }: { record: VeterinaryRecord | QuarantineRecord; type: 'veterinary' | 'quarantine' }) {
  const store = useFarmStore();
  const cattle = store.getCattleById(record.cattleId);
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
    quarantining: { label: '隔离中', color: 'bg-orange-100 text-orange-700' },
  };

  const status = statusConfig[record.status] || statusConfig.pending;

  return (
    <div 
      className={`bg-white rounded-lg border ${record.status === 'rejected' || record.status === 'pending' ? 'border-red-200 pulse-warning' : 'border-gray-200'} p-4 hover:shadow-md transition-all cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {type === 'veterinary' ? '兽医巡诊' : '隔离管理'} #{record.id}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {cattle ? `${cattle.tagId} ${cattle.name}` : '未知牛只'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {record.operator}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {record.createdAt.split(' ')[0]}
            </span>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {type === 'veterinary' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">症状</p>
                  <p className="text-sm text-gray-700">{(record as VeterinaryRecord).symptoms}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">诊断</p>
                  <p className="text-sm text-gray-700">{(record as VeterinaryRecord).diagnosis}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">处理方案</p>
                <p className="text-sm text-gray-700">{(record as VeterinaryRecord).treatment}</p>
              </div>
              {(record as VeterinaryRecord).rejectReason && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">驳回原因</p>
                  <p className="text-sm text-red-700">{(record as VeterinaryRecord).rejectReason}</p>
                </div>
              )}
            </>
          )}
          {type === 'quarantine' && (
            <>
              <div>
                <p className="text-xs text-gray-500">隔离原因</p>
                <p className="text-sm text-gray-700">{(record as QuarantineRecord).reason}</p>
              </div>
              {(record as QuarantineRecord).rejectReason && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">驳回原因</p>
                  <p className="text-sm text-red-700">{(record as QuarantineRecord).rejectReason}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function WarningCard({ exception }: { exception: ExceptionRecord }) {
  const store = useFarmStore();
  const cattle = exception.vetRecordId ? store.getVeterinaryById(exception.vetRecordId) : undefined;

  const typeConfig = {
    reject: { icon: AlertTriangle, label: '驳回', color: 'text-red-600' },
    warning: { icon: Clock, label: '警告', color: 'text-yellow-600' },
    info: { icon: Activity, label: '信息', color: 'text-blue-600' },
  };

  const config = typeConfig[exception.type];

  return (
    <div className={`p-4 rounded-lg border-l-4 ${exception.type === 'reject' ? 'bg-red-50 border-red-500' : exception.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
      <div className="flex items-start gap-3">
        <config.icon className={`w-5 h-5 ${config.color} mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            {cattle && (
              <span className="text-xs text-gray-500">#{cattle.id}</span>
            )}
          </div>
          <p className="text-sm text-gray-700">{exception.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-gray-500">操作: {exception.action}</span>
            <span className="text-xs text-gray-500">{exception.createdAt.split(' ')[0]} {exception.createdAt.split(' ')[1]?.slice(0, 5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentChangeItem({ change }: { change: RecentChange }) {
  const store = useFarmStore();
  
  const getIcon = () => {
    switch (change.type) {
      case 'veterinary': return Activity;
      case 'quarantine': return AlertTriangle;
      case 'exception': return Clock;
    }
  };

  const getLabel = () => {
    switch (change.type) {
      case 'veterinary': return '兽医巡诊';
      case 'quarantine': return '隔离管理';
      case 'exception': return '异常记录';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      rejected: '已驳回',
      quarantining: '隔离中',
    };
    return statusMap[status] || status;
  };

  const cattle = change.cattleId ? store.getCattleById(change.cattleId as number) : undefined;
  const Icon = getIcon();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          {getLabel()} #{change.id}
          {cattle && <span className="text-gray-500 ml-1">({cattle.name})</span>}
        </p>
        {change.status && (
          <p className="text-xs text-gray-500">状态: {getStatusLabel(change.status)}</p>
        )}
        {change.type === 'exception' && change.description && (
          <p className="text-xs text-gray-500 truncate">{change.description}</p>
        )}
      </div>
      <span className="text-xs text-gray-400">
        {change.createdAt.split(' ')[1]?.slice(0, 5)}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const store = useFarmStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const pendingVet = store.getPendingVeterinary();
  const pendingQuar = store.getPendingQuarantine();
  const rejectedRecords = store.getRejectedRecords();
  const warnings = store.exceptionRecords.filter(e => e.type === 'warning' || e.type === 'reject');
  const recentChanges = store.getRecentChanges();

  const completedToday = store.veterinaryRecords.filter(r => {
    const date = new Date(r.updatedAt);
    const today = new Date();
    return r.status === 'completed' && 
           date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }).length;

  const filteredVet = store.veterinaryRecords.filter(r => {
    const matchesKeyword = searchKeyword === '' || 
      r.symptoms.includes(searchKeyword) || 
      r.diagnosis.includes(searchKeyword);
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesKeyword && matchesStatus;
  });

  const filteredQuar = store.quarantineRecords.filter(r => {
    const matchesKeyword = searchKeyword === '' || r.reason.includes(searchKeyword);
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesKeyword && matchesStatus;
  });

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">工作台</h2>
        <p className="text-sm text-gray-500 mt-1">查看待处理任务和风险预警</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock} label="待处理巡诊" value={pendingVet.length} color="text-yellow-600" />
        <StatCard icon={AlertTriangle} label="风险预警" value={warnings.length} color="text-red-600" />
        <StatCard icon={CheckCircle2} label="今日完成" value={completedToday} color="text-pasture-600" trend="+2 较昨日" />
        <StatCard icon={Activity} label="隔离中" value={pendingQuar.length} color="text-warm-500" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">待处理任务</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索症状、诊断..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="rejected">已驳回</option>
                  <option value="processing">处理中</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              {(filteredVet.filter(r => r.status !== 'completed').length > 0 || filteredQuar.length > 0) ? (
                <>
                  {filteredVet.filter(r => r.status !== 'completed').map(record => (
                    <TaskCard key={`vet-${record.id}`} record={record} type="veterinary" />
                  ))}
                  {filteredQuar.map(record => (
                    <TaskCard key={`quar-${record.id}`} record={record} type="quarantine" />
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无待处理任务</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">最近变更</h3>
            <div className="max-h-80 overflow-y-auto">
              {recentChanges.length > 0 ? (
                recentChanges.map((change) => (
                  <RecentChangeItem key={`${change.type}-${change.id}`} change={change} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无变更记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-80">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">风险预警</h3>
              {warnings.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                  {warnings.length} 项
                </span>
              )}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {warnings.length > 0 ? (
                warnings.map(warning => (
                  <WarningCard key={warning.id} exception={warning} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-pasture-300" />
                  <p>暂无风险预警</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-pasture-500 to-pasture-600 rounded-xl shadow-lg p-5 text-white">
            <h3 className="font-semibold mb-2">今日提示</h3>
            <p className="text-sm text-pasture-100 mb-4">
              请及时处理待处理的巡诊单和隔离申请，确保牧场运营顺畅。
            </p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                {pendingVet.length} 巡诊待处理
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                {pendingQuar.length} 隔离待审核
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
